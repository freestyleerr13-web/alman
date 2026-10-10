const crypto = require("node:crypto");
const products = require("./catalog");

const productById = new Map(products.map((product) => [product.id, product]));
const allowedStates = new Set([
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCheckout(body) {
  const errors = {};
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { form: "Please submit valid checkout details." } };
  }
  if (Object.keys(body).some((key) => !["items", "customer", "address"].includes(key))) {
    errors.form = "Unexpected checkout data was submitted.";
  }

  const customer = body.customer && typeof body.customer === "object" ? body.customer : {};
  const address = body.address && typeof body.address === "object" ? body.address : {};
  if (Object.keys(customer).some((key) => !["name", "email", "phone"].includes(key))
    || Object.keys(address).some((key) => !["line1", "line2", "city", "state", "pin"].includes(key))) {
    errors.form = "Unexpected checkout data was submitted.";
  }
  const name = text(customer.name);
  const email = text(customer.email).toLowerCase();
  const phone = text(customer.phone);
  const line1 = text(address.line1);
  const line2 = text(address.line2);
  const city = text(address.city);
  const state = text(address.state);
  const pin = text(address.pin);

  if (name.length < 2 || name.length > 100 || !/^[\p{L}\p{M} .'-]+$/u.test(name)) errors["customer.name"] = "Enter your name using letters, spaces, apostrophes or hyphens.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors["customer.email"] = "Enter a valid email address.";
  if (!/^[6-9]\d{9}$/.test(phone)) errors["customer.phone"] = "Enter a valid 10-digit Indian mobile number.";
  if (!line1 || line1.length > 160) errors["address.line1"] = "Enter address line 1 (up to 160 characters).";
  if (line2.length > 160) errors["address.line2"] = "Address line 2 must be 160 characters or fewer.";
  if (city.length < 2 || city.length > 80) errors["address.city"] = "Enter a city (2–80 characters).";
  if (!allowedStates.has(state)) errors["address.state"] = "Choose a state or union territory from the list.";
  if (!/^\d{6}$/.test(pin)) errors["address.pin"] = "Enter a valid 6-digit PIN code.";

  const submittedItems = body.items;
  const items = [];
  if (!Array.isArray(submittedItems) || submittedItems.length < 1 || submittedItems.length > 30) {
    errors.items = "Your cart is empty or contains too many items.";
  } else {
    const seen = new Set();
    for (const item of submittedItems) {
      if (!item || typeof item !== "object" || Array.isArray(item)
        || Object.keys(item).some((key) => !["id", "quantity"].includes(key))) {
        errors.form = "Unexpected checkout data was submitted.";
        break;
      }
      const id = Number(item && item.id);
      const quantity = Number(item && item.quantity);
      if (!Number.isSafeInteger(id) || !productById.has(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20 || seen.has(id)) {
        errors.items = "One or more cart items are invalid. Please review your cart.";
        break;
      }
      seen.add(id);
      const product = productById.get(id);
      items.push({ id, name: product.name, variant: product.variant, price: product.price, quantity });
    }
  }

  if (Object.keys(errors).length) return { errors };
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal > 10000000) return { errors: { items: "Order total exceeds the allowed limit." } };
  return {
    values: {
      customer: { name, email, phone },
      address: { line1, line2, city, state, pin },
      items,
      subtotal,
      shipping: 0,
      total: subtotal
    }
  };
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function safeEqualHex(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || !/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function paymentSignature(orderId, paymentId, secret) {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

function webhookSignature(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

module.exports = { allowedStates, fingerprint, paymentSignature, productById, safeEqualHex, validateCheckout, webhookSignature };
