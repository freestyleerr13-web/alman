const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "saanjh-api-"));
process.env.DATA_DIR = dataDir;
process.env.RAZORPAY_KEY_ID = "rzp_test_integration";
process.env.RAZORPAY_KEY_SECRET = "integration-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "integration-webhook-secret";
process.env.ADMIN_PASSWORD = "integration-admin-password";
delete process.env.SMTP_HOST;

const db = require("../server/database");
const { app } = require("../server/server");
const { paymentSignature, webhookSignature } = require("../server/validation");
const originalFetch = global.fetch;
let server;
let baseUrl;
let createdGatewayOrders = 0;

function payload() {
  return {
    items: [{ id: 1, quantity: 2 }],
    customer: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    address: { line1: "12 Market Road", line2: "", city: "Mumbai", state: "Maharashtra", pin: "400001" }
  };
}

async function createOnlineOrder(idempotencyKey) {
  const response = await originalFetch(baseUrl + "/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Checkout-Method": "online"
    },
    body: JSON.stringify(payload())
  });
  return { response, body: await response.json() };
}

test("API creates and reuses online orders, verifies payments and handles captured webhooks idempotently", async (t) => {
  const originalGatewayFetch = global.fetch;
  global.fetch = async function (url, options) {
    if (String(url).startsWith("https://api.razorpay.com/v1/orders")) {
      createdGatewayOrders += 1;
      const request = JSON.parse(options.body);
      return new Response(JSON.stringify({
        id: `order_integration${createdGatewayOrders}`,
        amount: request.amount,
        currency: request.currency
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return originalGatewayFetch(url, options);
  };

  await db.initialize();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    global.fetch = originalGatewayFetch;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  const health = await originalFetch(baseUrl + "/api/health");
  assert.equal(health.status, 200);

  const unauthenticatedAdmin = await originalFetch(baseUrl + "/api/admin/orders");
  assert.equal(unauthenticatedAdmin.status, 401);

  const first = await createOnlineOrder("integration-order-key-0001");
  assert.equal(first.response.status, 201);
  assert.equal(first.body.total, 1298);
  assert.equal(first.body.currency, "INR");
  assert.equal(first.body.keyId, "rzp_test_integration");
  assert.equal(createdGatewayOrders, 1);

  const repeated = await createOnlineOrder("integration-order-key-0001");
  assert.equal(repeated.response.status, 201);
  assert.equal(repeated.body.orderId, first.body.orderId);
  assert.equal(createdGatewayOrders, 1);

  const tampered = await originalFetch(baseUrl + "/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: first.body.razorpayOrderId,
      razorpay_payment_id: "pay_integration123",
      razorpay_signature: "0".repeat(64)
    })
  });
  assert.equal(tampered.status, 400);
  assert.equal((await db.get("SELECT status FROM orders WHERE id = ?", [first.body.orderId])).status, "pending");

  const verification = {
    razorpay_order_id: first.body.razorpayOrderId,
    razorpay_payment_id: "pay_integration123",
    razorpay_signature: paymentSignature(first.body.razorpayOrderId, "pay_integration123", process.env.RAZORPAY_KEY_SECRET)
  };
  const verified = await originalFetch(baseUrl + "/api/payments/verify", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(verification)
  });
  assert.equal(verified.status, 200);
  const repeatedVerification = await originalFetch(baseUrl + "/api/payments/verify", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(verification)
  });
  assert.equal(repeatedVerification.status, 200);
  assert.equal((await db.get("SELECT status FROM orders WHERE id = ?", [first.body.orderId])).status, "paid");

  const event = {
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_integration123", order_id: first.body.razorpayOrderId } } }
  };
  const raw = Buffer.from(JSON.stringify(event));
  const headers = { "Content-Type": "application/json", "X-Razorpay-Signature": webhookSignature(raw, process.env.RAZORPAY_WEBHOOK_SECRET) };
  const webhook = await originalFetch(baseUrl + "/api/webhooks/razorpay", { method: "POST", headers, body: raw });
  const webhookRetry = await originalFetch(baseUrl + "/api/webhooks/razorpay", { method: "POST", headers, body: raw });
  assert.equal(webhook.status, 200);
  assert.equal(webhookRetry.status, 200);
  assert.equal((await db.get("SELECT status FROM orders WHERE id = ?", [first.body.orderId])).status, "paid");

  const failed = await createOnlineOrder("integration-failed-key-0001");
  assert.equal(failed.response.status, 201);
  const failedEvent = {
    event: "payment.failed",
    payload: { payment: { entity: { id: "pay_integration_failed", order_id: failed.body.razorpayOrderId } } }
  };
  const failedRaw = Buffer.from(JSON.stringify(failedEvent));
  const failedWebhook = await originalFetch(baseUrl + "/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": webhookSignature(failedRaw, process.env.RAZORPAY_WEBHOOK_SECRET)
    },
    body: failedRaw
  });
  assert.equal(failedWebhook.status, 200);
  assert.equal((await db.get("SELECT status FROM orders WHERE id = ?", [failed.body.orderId])).status, "failed");

  const codResponse = await originalFetch(baseUrl + "/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "integration-cod-key-00001",
      "X-Checkout-Method": "cod"
    },
    body: JSON.stringify(payload())
  });
  const codOrder = await codResponse.json();
  assert.equal(codResponse.status, 201);
  assert.equal(codOrder.status, "cod");
});
