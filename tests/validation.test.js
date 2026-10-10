const test = require("node:test");
const assert = require("node:assert/strict");
const {
  fingerprint,
  paymentSignature,
  safeEqualHex,
  validateCheckout,
  webhookSignature
} = require("../server/validation");

function validPayload() {
  return {
    items: [{ id: 1, quantity: 2 }, { id: 18, quantity: 1 }],
    customer: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    address: {
      line1: "12 Market Road",
      line2: "",
      city: "Mumbai",
      state: "Maharashtra",
      pin: "400001"
    }
  };
}

test("checkout validation computes amount from authoritative catalog prices", () => {
  const result = validateCheckout(validPayload());
  assert.equal(result.errors, undefined);
  assert.equal(result.values.subtotal, 1997);
  assert.equal(result.values.total, 1997);
  assert.equal(result.values.shipping, 0);
  assert.equal(result.values.items[0].name, "Matte Lip Crayon");
  assert.equal(result.values.items[0].price, 649);
});

test("checkout validation rejects browser price fields and unknown products", () => {
  const payload = validPayload();
  payload.items[0].price = 1;
  assert.equal(validateCheckout(payload).errors.form, "Unexpected checkout data was submitted.");
  const unknown = validPayload();
  unknown.items[0].id = 999;
  assert.ok(validateCheckout(unknown).errors.items);
});

test("checkout validation rejects invalid Indian phone, state, PIN and quantity", () => {
  const payload = validPayload();
  payload.customer.phone = "123";
  payload.address.state = "Not a state";
  payload.address.pin = "12345";
  payload.items[0].quantity = 21;
  const result = validateCheckout(payload);
  assert.ok(result.errors["customer.phone"]);
  assert.ok(result.errors["address.state"]);
  assert.ok(result.errors["address.pin"]);
  assert.ok(result.errors.items);
});

test("gateway payment signature is HMAC-SHA256 over order and payment ids", () => {
  const signature = paymentSignature("order_123", "pay_456", "test-secret");
  assert.match(signature, /^[a-f0-9]{64}$/);
  assert.equal(safeEqualHex(signature, paymentSignature("order_123", "pay_456", "test-secret")), true);
  assert.equal(safeEqualHex(signature, paymentSignature("order_123", "pay_789", "test-secret")), false);
  assert.equal(safeEqualHex(signature, "not-a-signature"), false);
});

test("webhook signature uses exact raw request bytes", () => {
  const rawBody = Buffer.from('{"event":"payment.captured"}');
  const signature = webhookSignature(rawBody, "webhook-secret");
  assert.equal(safeEqualHex(signature, webhookSignature(rawBody, "webhook-secret")), true);
  assert.notEqual(signature, webhookSignature(Buffer.from('{"event": "payment.captured"}'), "webhook-secret"));
});

test("request fingerprints are deterministic and change with order details", () => {
  assert.equal(fingerprint({ total: 10 }), fingerprint({ total: 10 }));
  assert.notEqual(fingerprint({ total: 10 }), fingerprint({ total: 11 }));
});
