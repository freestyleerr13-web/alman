(function () {
  "use strict";
  var params = new URLSearchParams(window.location.search);
  var state = params.get("state");
  var orderId = params.get("order");
  var title = document.getElementById("status-title");
  var message = document.getElementById("status-message");
  var retry = document.getElementById("retry");
  var card = document.getElementById("status-card");
  var error = document.getElementById("receipt-error");
  var CART_KEY = "saanjh-cart";

  function inr(value) { return "₹" + Number(value).toLocaleString("en-IN"); }
  function fail(messageText) {
    card.setAttribute("aria-busy", "false");
    title.textContent = "We could not load this order";
    message.textContent = messageText;
    error.textContent = "Your cart has not been cleared.";
    retry.hidden = false;
  }
  function render(order) {
    var items = document.getElementById("receipt-items");
    items.replaceChildren();
    order.items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "summary-item";
      var name = document.createElement("span");
      var strong = document.createElement("strong");
      strong.textContent = item.name;
      var details = document.createElement("small");
      details.textContent = item.variant + " · Qty " + item.quantity;
      name.append(strong, details);
      var price = document.createElement("span");
      price.textContent = inr(item.price * item.quantity);
      row.append(name, price);
      items.appendChild(row);
    });
    document.getElementById("receipt-subtotal").textContent = inr(order.subtotal);
    document.getElementById("receipt-total").textContent = inr(order.total);
    document.getElementById("receipt-totals").hidden = false;
    title.textContent = order.status === "paid" || order.status === "cod" ? "Thank you for your order" : "Order " + order.orderNumber;
    document.getElementById("status-icon").textContent = order.status === "paid" || order.status === "cod" ? "✓" : "!";
    var orderLine = document.createElement("strong");
    orderLine.textContent = "Order number: " + order.orderNumber;
    message.replaceChildren(orderLine);
    if (order.status === "paid" || order.status === "cod") {
      try { localStorage.removeItem(CART_KEY); } catch (storageError) { error.textContent = "Order confirmed. Your browser could not clear its saved cart."; }
      document.getElementById("delivery").textContent = order.status === "paid"
        ? "Payment confirmed. Expected delivery: 3–7 business days. A confirmation email will be sent to the address provided."
        : "Cash on delivery selected. Expected delivery: 3–7 business days.";
      retry.hidden = true;
      error.textContent = "";
    } else if (order.status === "pending") {
      message.append(document.createTextNode(state === "cancelled"
        ? " — checkout was closed before we received a payment confirmation."
        : " — payment confirmation is still pending."));
      document.getElementById("delivery").textContent = state === "cancelled"
        ? "Your cart is saved. You can retry checkout; if you completed a payment, please wait for confirmation before paying again."
        : "Do not make another payment while this order is being confirmed.";
      retry.hidden = state !== "cancelled" && state !== "failed";
    } else {
      message.append(document.createTextNode(" — status: " + order.status + "."));
      document.getElementById("delivery").textContent = "Your cart is saved, and no new payment has been started.";
      retry.hidden = false;
    }
    card.setAttribute("aria-busy", "false");
  }

  if (!orderId) {
    card.setAttribute("aria-busy", "false");
    if (state === "cancelled" || state === "failed") {
      title.textContent = state === "cancelled" ? "Checkout was closed" : "Payment was not completed";
      message.textContent = "Your cart is still saved. You can try again whenever you are ready.";
      document.getElementById("status-icon").textContent = "!";
      retry.hidden = false;
    } else fail("No order number was provided.");
    return;
  }

  fetch("/api/orders/" + encodeURIComponent(orderId) + "/receipt")
    .then(function (response) {
      if (!response.ok) throw new Error("We could not find this order.");
      return response.json();
    })
    .then(render)
    .catch(function () { fail("We could not confirm the order status right now. Your cart has been kept; check again shortly."); });
})();
