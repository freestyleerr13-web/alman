require("dotenv").config();

const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit").rateLimit;
const nodemailer = require("nodemailer");
const db = require("./database");
const products = require("./catalog");
const { fingerprint, paymentSignature, safeEqualHex, validateCheckout, webhookSignature } = require("./validation");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const APP_ORIGIN = process.env.APP_ORIGIN || `http://localhost:${PORT}`;
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const provisioning = new Map();

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      formAction: ["'self'", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
    }
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === APP_ORIGIN) return callback(null, true);
    return callback(new Error("Origin is not allowed."));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Idempotency-Key", "X-Checkout-Method", "X-Admin-Action"],
  maxAge: 600
}));

let databaseReady;
function ensureDatabase() {
  if (!databaseReady) databaseReady = db.initialize();
  return databaseReady;
}

app.use((req, res, next) => {
  ensureDatabase().then(() => next(), next);
});

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure && req.get("x-forwarded-proto") !== "https") {
    return res.status(426).json({ error: "HTTPS is required." });
  }
  next();
});

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false });
app.use("/api", apiLimiter);

function jsonError(res, status, message, details) {
  const response = { error: message };
  if (details) response.details = details;
  return res.status(status).json(response);
}

function testGatewayReady() {
  return typeof process.env.RAZORPAY_KEY_ID === "string"
    && process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")
    && Boolean(process.env.RAZORPAY_KEY_SECRET)
    && Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
}

function basicAuth(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD;
  const authorization = req.get("authorization") || "";
  const match = /^Basic ([A-Za-z0-9+/]+=*)$/.exec(authorization);
  if (!expected) return jsonError(res, 503, "Admin access is not configured.");
  if (!match) {
    res.set("WWW-Authenticate", 'Basic realm="Saanjh Beauty admin", charset="UTF-8"');
    return jsonError(res, 401, "Admin authentication is required.");
  }
  let credentials;
  try { credentials = Buffer.from(match[1], "base64").toString("utf8"); }
  catch { return jsonError(res, 401, "Admin authentication failed."); }
  const separator = credentials.indexOf(":");
  const username = separator < 0 ? "" : credentials.slice(0, separator);
  const password = separator < 0 ? "" : credentials.slice(separator + 1);
  const passwordMatches = crypto.timingSafeEqual(
    crypto.createHash("sha256").update(password).digest(),
    crypto.createHash("sha256").update(expected).digest()
  );
  if (username !== "admin" || !passwordMatches) {
    res.set("WWW-Authenticate", 'Basic realm="Saanjh Beauty admin", charset="UTF-8"');
    return jsonError(res, 401, "Admin authentication failed.");
  }
  if (req.method !== "GET" && req.get("x-admin-action") !== "1") return jsonError(res, 403, "Admin action header is required.");
  next();
}

async function razorpayRequest(endpoint, method, payload) {
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json"
    },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Payment provider request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function validIdempotencyKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{16,100}$/.test(value);
}

function orderResponse(order) {
  return {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    items: JSON.parse(order.items_json)
  };
}

async function provisionOnlineOrder(order) {
  if (order.razorpay_order_id) return order;
  const existing = provisioning.get(order.idempotency_key);
  if (existing) return existing;
  const promise = (async () => {
    const latest = await db.get("SELECT * FROM orders WHERE id = ?", [order.id]);
    if (!latest) throw new Error("Order disappeared during payment setup.");
    if (latest.razorpay_order_id) return latest;
    const gatewayOrder = await razorpayRequest("orders", "POST", {
      amount: latest.total * 100,
      currency: "INR",
      receipt: latest.order_number,
      notes: { store_order_id: latest.id }
    });
    if (!gatewayOrder.id || gatewayOrder.amount !== latest.total * 100 || gatewayOrder.currency !== "INR") {
      throw new Error("Payment provider returned an invalid order.");
    }
    const updatedAt = new Date().toISOString();
    await db.run(
      "UPDATE orders SET razorpay_order_id = ?, updated_at = ? WHERE id = ? AND razorpay_order_id IS NULL",
      [gatewayOrder.id, updatedAt, latest.id]
    );
    return (await db.get("SELECT * FROM orders WHERE id = ?", [latest.id]));
  })();
  provisioning.set(order.idempotency_key, promise);
  try { return await promise; }
  finally { provisioning.delete(order.idempotency_key); }
}

function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.EMAIL_FROM);
}

const mailer = emailConfigured() ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
}) : null;

async function sendConfirmationOnce(orderId) {
  if (!mailer) return;
  const now = new Date().toISOString();
  const claimBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const claim = await db.run(
    "UPDATE orders SET email_claimed_at = ? WHERE id = ? AND email_sent_at IS NULL AND (email_claimed_at IS NULL OR email_claimed_at < ?)",
    [now, orderId, claimBefore]
  );
  if (!claim.changes) return;
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order || order.email_sent_at) return;
  const itemLines = JSON.parse(order.items_json).map((item) => `${item.name} (${item.variant}) × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString("en-IN")}`).join("\n");
  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: order.customer_email,
      subject: `Saanjh Beauty order ${order.order_number} confirmed`,
      text: `Thank you, ${order.customer_name}!\n\nYour payment is confirmed.\nOrder: ${order.order_number}\n\n${itemLines}\n\nSubtotal: ₹${order.subtotal.toLocaleString("en-IN")}\nShipping: Free\nTotal (includes GST): ₹${order.total.toLocaleString("en-IN")}\n\nExpected delivery: 3–7 business days.\n\nSaanjh Beauty`
    });
    await db.run("UPDATE orders SET email_sent_at = ?, email_claimed_at = NULL WHERE id = ?", [new Date().toISOString(), orderId]);
  } catch (error) {
    await db.run("UPDATE orders SET email_claimed_at = NULL WHERE id = ? AND email_sent_at IS NULL", [orderId]);
    console.error("Order confirmation email could not be sent.", { orderId, code: error.code || "SMTP_ERROR" });
  }
}

function markOrderPaid(orderId, paymentId) {
  return db.run(
    "UPDATE orders SET status = 'paid', razorpay_payment_id = ?, paid_at = COALESCE(paid_at, ?), updated_at = ? WHERE id = ? AND status IN ('pending', 'failed') AND (razorpay_payment_id IS NULL OR razorpay_payment_id = ?)",
    [paymentId, new Date().toISOString(), new Date().toISOString(), orderId, paymentId]
  );
}

app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "256kb" }), async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !Buffer.isBuffer(req.body)) return jsonError(res, 503, "Webhook is not configured.");
  const received = req.get("x-razorpay-signature");
  const expected = webhookSignature(req.body, process.env.RAZORPAY_WEBHOOK_SECRET);
  if (!safeEqualHex(received, expected)) return jsonError(res, 400, "Webhook signature is invalid.");

  let event;
  try { event = JSON.parse(req.body.toString("utf8")); }
  catch { return jsonError(res, 400, "Webhook payload is invalid."); }
  const payment = event && event.payload && event.payload.payment && event.payload.payment.entity;
  if (!payment || typeof payment.order_id !== "string" || typeof payment.id !== "string") return res.sendStatus(200);
  const order = await db.get("SELECT id, status FROM orders WHERE razorpay_order_id = ?", [payment.order_id]);
  if (!order) return res.sendStatus(200);

  if (event.event === "payment.captured") {
    const result = await markOrderPaid(order.id, payment.id);
    if (!result.changes && order.status !== "paid") return jsonError(res, 409, "Payment could not be applied to this order.");
    await sendConfirmationOnce(order.id);
  } else if (event.event === "payment.failed") {
    await db.run(
      "UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending' AND razorpay_payment_id IS NULL",
      [new Date().toISOString(), order.id]
    );
  }
  return res.sendStatus(200);
});

app.use(express.json({ limit: "32kb", strict: true }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/products", (req, res) => res.json(products.map(({ id, name, variant, price }) => ({ id, name, variant, price }))));

app.post("/api/orders", orderLimiter, async (req, res) => {
  const method = req.get("x-checkout-method");
  if (!["online", "cod"].includes(method)) return jsonError(res, 400, "Choose online payment or cash on delivery.");
  const idempotencyKey = req.get("idempotency-key");
  if (!validIdempotencyKey(idempotencyKey)) return jsonError(res, 400, "A valid checkout request key is required.");
  if (method === "online" && !testGatewayReady()) return jsonError(res, 503, "Test payments are not configured. Add Razorpay test credentials on the server.");

  const checked = validateCheckout(req.body);
  if (checked.errors) return jsonError(res, 422, "Please correct the highlighted checkout details.", checked.errors);
  const requestHash = fingerprint({ ...checked.values, method });
  let order = await db.get("SELECT * FROM orders WHERE idempotency_key = ?", [idempotencyKey]);
  if (order && order.request_hash !== requestHash) return jsonError(res, 409, "This checkout key was already used for different details. Refresh checkout and try again.");

  if (!order) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const orderNumber = `SB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    try {
      await db.run(
        `INSERT INTO orders (
          id, order_number, idempotency_key, request_hash, customer_name, customer_email, customer_phone,
          address_line1, address_line2, address_city, address_state, address_pin, items_json,
          subtotal, shipping, total, status, payment_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, orderNumber, idempotencyKey, requestHash, checked.values.customer.name, checked.values.customer.email,
          checked.values.customer.phone, checked.values.address.line1, checked.values.address.line2,
          checked.values.address.city, checked.values.address.state, checked.values.address.pin,
          JSON.stringify(checked.values.items), checked.values.subtotal, checked.values.shipping, checked.values.total,
          method === "cod" ? "cod" : "pending", method, now, now
        ]
      );
    } catch (error) {
      if (error.code !== "SQLITE_CONSTRAINT_UNIQUE" && error.code !== "23505") {
        console.error("Order could not be saved.", { code: error.code || "DATABASE_ERROR" });
        return jsonError(res, 500, "We could not save your order. Please try again.");
      }
    }
    order = await db.get("SELECT * FROM orders WHERE idempotency_key = ?", [idempotencyKey]);
    if (!order) return jsonError(res, 409, "This order request is already being processed. Please retry.");
  }

  if (order.payment_method !== method) return jsonError(res, 409, "The payment choice does not match this checkout request.");
  if (method === "cod") return res.status(201).json({ ...orderResponse(order), paymentMethod: "cod" });

  try {
    order = await provisionOnlineOrder(order);
  } catch (error) {
    await db.run("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'", [new Date().toISOString(), order.id]);
    console.error("Razorpay order creation failed.", { orderId: order.id, code: error.status || error.code || "GATEWAY_ERROR" });
    return jsonError(res, 502, "We could not start the payment. Your cart is safe; please retry.");
  }
  return res.status(201).json({
    ...orderResponse(order),
    paymentMethod: "online",
    razorpayOrderId: order.razorpay_order_id,
    keyId: process.env.RAZORPAY_KEY_ID,
    currency: "INR"
  });
});

app.post("/api/payments/verify", verifyLimiter, async (req, res) => {
  const { razorpay_order_id: gatewayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (Object.keys(req.body || {}).some((key) => !["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"].includes(key))
    || typeof gatewayOrderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(gatewayOrderId)
    || typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId)
    || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
    return jsonError(res, 422, "Payment verification details are invalid.");
  }
  if (!process.env.RAZORPAY_KEY_SECRET) return jsonError(res, 503, "Payment verification is not configured.");
  const expected = paymentSignature(gatewayOrderId, paymentId, process.env.RAZORPAY_KEY_SECRET);
  if (!safeEqualHex(signature, expected)) return jsonError(res, 400, "Payment signature could not be verified.");
  const order = await db.get("SELECT * FROM orders WHERE razorpay_order_id = ?", [gatewayOrderId]);
  if (!order) return jsonError(res, 404, "The payment order was not found.");
  if (order.status === "paid" && order.razorpay_payment_id === paymentId) return res.json(orderResponse(order));
  if (!["pending", "failed"].includes(order.status)) return jsonError(res, 409, "This order cannot accept another payment.");
  try {
    const updated = await markOrderPaid(order.id, paymentId);
    if (!updated.changes) {
      const latest = await db.get("SELECT * FROM orders WHERE id = ?", [order.id]);
      if (latest.status !== "paid" || latest.razorpay_payment_id !== paymentId) return jsonError(res, 409, "This payment was already applied to another order.");
    }
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "23505") return jsonError(res, 409, "This payment was already applied to another order.");
    throw error;
  }
  await sendConfirmationOnce(order.id);
  return res.json(orderResponse(await db.get("SELECT * FROM orders WHERE id = ?", [order.id])));
});

app.get("/api/orders/:id/receipt", async (req, res) => {
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return jsonError(res, 404, "Order not found.");
  return res.json(orderResponse(order));
});

app.get("/admin.html", basicAuth, (req, res) => res.sendFile(path.join(PUBLIC_DIR, "admin.html")));
app.use("/api/admin", basicAuth);

app.get("/api/admin/orders", async (req, res) => {
  const rows = await db.all("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
  return res.json(rows.map((order) => ({
    ...orderResponse(order),
    customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
    address: { line1: order.address_line1, line2: order.address_line2, city: order.address_city, state: order.address_state, pin: order.address_pin },
    paymentMethod: order.payment_method,
    paymentId: order.razorpay_payment_id,
    createdAt: order.created_at
  })));
});

app.post("/api/admin/orders/:id/cancel", async (req, res) => {
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return jsonError(res, 404, "Order not found.");
  if (!["pending", "failed", "cod"].includes(order.status)) return jsonError(res, 409, "Only unpaid or COD orders can be cancelled here.");
  const now = new Date().toISOString();
  const result = await db.run(
    "UPDATE orders SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ? AND status IN ('pending', 'failed', 'cod')",
    [now, now, order.id]
  );
  if (!result.changes) return jsonError(res, 409, "Order status changed; reload the admin page.");
  return res.json({ status: "cancelled" });
});

app.post("/api/admin/orders/:id/refund", async (req, res) => {
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return jsonError(res, 404, "Order not found.");
  if (order.status !== "paid" || !order.razorpay_payment_id) return jsonError(res, 409, "Only captured online payments can be refunded.");
  if (!testGatewayReady()) return jsonError(res, 503, "Razorpay test credentials are not configured.");
  const now = new Date().toISOString();
  const claimed = await db.run(
    "UPDATE orders SET refund_status = 'processing', updated_at = ? WHERE id = ? AND status = 'paid' AND refund_status IS NULL",
    [now, order.id]
  );
  if (!claimed.changes) return jsonError(res, 409, "A refund has already been requested or is being processed.");
  try {
    const refund = await razorpayRequest(`payments/${encodeURIComponent(order.razorpay_payment_id)}/refund`, "POST", {
      amount: order.total * 100,
      notes: { store_order_id: order.id }
    });
    const refundedAt = new Date().toISOString();
    await db.run(
      "UPDATE orders SET status = 'refunded', refund_status = 'processed', razorpay_refund_id = ?, refunded_at = ?, updated_at = ? WHERE id = ? AND refund_status = 'processing'",
      [refund.id, refundedAt, refundedAt, order.id]
    );
    return res.json({ status: "refunded" });
  } catch (error) {
    console.error("Refund request failed.", { orderId: order.id, code: error.status || error.code || "GATEWAY_ERROR" });
    return jsonError(res, 502, "The refund could not be confirmed. Its status is held to prevent a duplicate refund; check Razorpay before taking further action.");
  }
});

app.use(express.static(PUBLIC_DIR, {
  dotfiles: "deny",
  index: "index.html",
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    return jsonError(res, error.type === "entity.too.large" ? 413 : 400, "Request data is invalid or too large.");
  }
  if (error.message === "Origin is not allowed.") return jsonError(res, 403, error.message);
  console.error("Request failed.", { method: req.method, path: req.path, code: error.code || "REQUEST_ERROR" });
  return jsonError(res, 500, "An unexpected error occurred. Please try again.");
});

async function start() {
  if (process.env.NODE_ENV === "production" && !APP_ORIGIN.startsWith("https://")) throw new Error("APP_ORIGIN must use HTTPS in production.");
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new Error("This build only permits Razorpay test keys. Live keys must not be used before business verification.");
  }
  await ensureDatabase();
  if (!emailConfigured()) console.warn("SMTP is not configured; payment confirmation emails will not be sent.");
  app.listen(PORT, () => console.log(`Saanjh Beauty is listening on port ${PORT}.`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Server startup failed.", { message: error.message });
    process.exitCode = 1;
  });
}

app.app = app;
app.markOrderPaid = markOrderPaid;
app.start = start;
module.exports = app;
