(function () {
  "use strict";

  var CART_KEY = "saanjh-cart";
  var ATTEMPT_KEY = "saanjh-checkout-idempotency";
  var PENDING_PAYMENT_KEY = "saanjh-pending-payment";
  var states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];
  var form = document.getElementById("checkout-form");
  var button = document.getElementById("pay-button");
  var retryVerification = document.getElementById("verify-retry");
  var formError = document.getElementById("form-error");
  var working = document.getElementById("working");
  var catalog = new Map();
  var cart = readCart();
  var idempotencyKey = sessionStorage.getItem(ATTEMPT_KEY) || newKey();
  sessionStorage.setItem(ATTEMPT_KEY, idempotencyKey);

  function newKey() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "checkout-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }
  function inr(amount) { return "₹" + Number(amount).toLocaleString("en-IN"); }
  function readCart() {
    try {
      var value = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) { return {}; }
  }
  function setBusy(isBusy, message) {
    button.disabled = isBusy;
    working.textContent = message || "";
  }
  function fieldError(id, message) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
  }
  function validate() {
    var values = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      line1: document.getElementById("line1").value.trim(),
      line2: document.getElementById("line2").value.trim(),
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value,
      pin: document.getElementById("pin").value.trim()
    };
    var errors = {
      name: values.name.length < 2 || values.name.length > 100 || !/^[\p{L}\p{M} .'-]+$/u.test(values.name) ? "Enter your name using letters, spaces, apostrophes or hyphens." : "",
      email: values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "Enter a valid email address." : "",
      phone: !/^[6-9]\d{9}$/.test(values.phone) ? "Enter a valid 10-digit Indian mobile number." : "",
      line1: !values.line1 || values.line1.length > 160 ? "Enter address line 1 (up to 160 characters)." : "",
      line2: values.line2.length > 160 ? "Address line 2 must be 160 characters or fewer." : "",
      city: values.city.length < 2 || values.city.length > 80 ? "Enter a city (2–80 characters)." : "",
      state: states.indexOf(values.state) < 0 ? "Choose a state or union territory from the list." : "",
      pin: !/^\d{6}$/.test(values.pin) ? "Enter a valid 6-digit PIN code." : ""
    };
    Object.keys(errors).forEach(function (key) { fieldError(key, errors[key]); });
    return Object.keys(errors).every(function (key) { return !errors[key]; }) ? values : null;
  }
  function showServerErrors(details) {
    var mapping = {
      "customer.name": "name", "customer.email": "email", "customer.phone": "phone",
      "address.line1": "line1", "address.line2": "line2", "address.city": "city",
      "address.state": "state", "address.pin": "pin"
    };
    Object.keys(mapping).forEach(function (key) {
      if (details && details[key]) fieldError(mapping[key], details[key]);
    });
    formError.textContent = details && (details.form || details.items) || "";
  }
  function renderSummary() {
    var container = document.getElementById("summary-items");
    container.replaceChildren();
    var subtotal = 0;
    Object.keys(cart).forEach(function (key) {
      var product = catalog.get(Number(key));
      var quantity = Number(cart[key]);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
      subtotal += product.price * quantity;
      var row = document.createElement("div");
      row.className = "summary-item";
      var title = document.createElement("span");
      var name = document.createElement("strong");
      name.textContent = product.name;
      var variant = document.createElement("small");
      variant.textContent = product.variant + " · Qty " + quantity;
      title.append(name, variant);
      var price = document.createElement("span");
      price.textContent = inr(product.price * quantity);
      row.append(title, price);
      container.appendChild(row);
    });
    document.getElementById("subtotal").textContent = inr(subtotal);
    document.getElementById("total").textContent = inr(subtotal);
    if (!container.children.length) {
      container.textContent = "Your cart is empty.";
      button.disabled = true;
    }
  }
  function checkoutPayload(customer) {
    return {
      items: Object.keys(cart).map(function (id) { return { id: Number(id), quantity: Number(cart[id]) }; }),
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      address: {
        line1: customer.line1, line2: customer.line2, city: customer.city,
        state: customer.state, pin: customer.pin
      }
    };
  }
  async function postOrder(method, customer) {
    var response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-Checkout-Method": method
      },
      body: JSON.stringify(checkoutPayload(customer))
    });
    var result = await response.json();
    if (!response.ok) {
      showServerErrors(result.details);
      throw new Error(result.error || "Order could not be created.");
    }
    return result;
  }
  function goToResult(state, orderId) {
    var params = new URLSearchParams({ state: state });
    if (orderId) params.set("order", orderId);
    window.location.href = "result.html?" + params.toString();
  }
  async function verifyPayment(payment) {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
    setBusy(true, "Confirming your payment…");
    retryVerification.hidden = true;
    try {
      var response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment)
      });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment confirmation is taking longer than expected.");
      sessionStorage.removeItem(PENDING_PAYMENT_KEY);
      goToResult("success", result.orderId);
    } catch (error) {
      formError.textContent = error.message + " Please retry confirmation; do not make another payment.";
      retryVerification.hidden = false;
      setBusy(false, "");
    }
  }

  states.forEach(function (state) {
    var option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    document.getElementById("state").appendChild(option);
  });

  form.addEventListener("input", function (event) {
    if (event.target.name === "payment") return;
    idempotencyKey = newKey();
    sessionStorage.setItem(ATTEMPT_KEY, idempotencyKey);
    formError.textContent = "";
  });
  form.addEventListener("change", function (event) {
    if (event.target.name === "payment") {
      idempotencyKey = newKey();
      sessionStorage.setItem(ATTEMPT_KEY, idempotencyKey);
      button.textContent = event.target.value === "cod" ? "Place COD order" : "Continue to payment";
    }
  });
  retryVerification.addEventListener("click", function () {
    var payment;
    try { payment = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) || "null"); } catch (error) { payment = null; }
    if (payment) verifyPayment(payment);
  });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    formError.textContent = "";
    var customer = validate();
    if (!customer) {
      formError.textContent = "Please correct the highlighted fields.";
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    if (!Object.keys(cart).length) {
      formError.textContent = "Your cart is empty. Return to the shop to add products.";
      return;
    }
    var method = form.querySelector('input[name="payment"]:checked').value;
    setBusy(true, method === "cod" ? "Placing your order…" : "Preparing secure payment…");
    try {
      var order = await postOrder(method, customer);
      if (method === "cod") {
        sessionStorage.removeItem(ATTEMPT_KEY);
        goToResult("success", order.orderId);
        return;
      }
      if (typeof window.Razorpay !== "function") throw new Error("Secure checkout could not load. Check your connection and retry.");
      var checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.total * 100,
        currency: order.currency,
        name: "Saanjh Beauty",
        description: "Order " + order.orderNumber,
        order_id: order.razorpayOrderId,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        notes: { order_number: order.orderNumber },
        theme: { color: "#9b2253" },
        modal: { ondismiss: function () { goToResult("cancelled", order.orderId); } },
        handler: function (result) {
          verifyPayment({
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature
          });
        }
      });
      checkout.on("payment.failed", function () { goToResult("failed", order.orderId); });
      setBusy(false, "");
      checkout.open();
    } catch (error) {
      setBusy(false, "");
      formError.textContent = error.message;
    }
  });

  async function initialize() {
    try {
      var response = await fetch("/api/products");
      if (!response.ok) throw new Error("Product prices could not be loaded.");
      var products = await response.json();
      products.forEach(function (product) { catalog.set(product.id, product); });
      renderSummary();
      var pending;
      try { pending = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) || "null"); } catch (error) { pending = null; }
      if (pending) {
        formError.textContent = "A payment was submitted and needs confirmation. Do not pay again.";
        retryVerification.hidden = false;
        button.disabled = true;
      }
    } catch (error) {
      formError.textContent = error.message;
      button.disabled = true;
    }
  }
  initialize();
})();
