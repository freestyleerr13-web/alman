(function () {
  "use strict";
  var tbody = document.getElementById("orders");
  var message = document.getElementById("admin-message");

  function inr(value) { return "₹" + Number(value).toLocaleString("en-IN"); }
  function addTextCell(row, value) {
    var cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }
  function actionButton(container, label, action) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", function () { mutate(action, button); });
    container.appendChild(button);
  }
  async function mutate(action, button) {
    button.disabled = true;
    message.textContent = "Updating order…";
    try {
      var response = await fetch(action.url, {
        method: "POST",
        headers: { "X-Admin-Action": "1" }
      });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || "Order could not be updated.");
      message.textContent = "Order updated.";
      await load();
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  }
  async function load() {
    message.textContent = "Loading orders…";
    try {
      var response = await fetch("/api/admin/orders");
      if (!response.ok) throw new Error(response.status === 401 ? "Admin sign-in is required." : "Orders could not be loaded.");
      var orders = await response.json();
      tbody.replaceChildren();
      orders.forEach(function (order) {
        var row = document.createElement("tr");
        addTextCell(row, order.orderNumber);
        addTextCell(row, order.customer.name + "\n" + order.customer.email + "\n" + order.customer.phone);
        addTextCell(row, order.items.map(function (item) { return item.name + " × " + item.quantity; }).join("\n"));
        addTextCell(row, inr(order.total));
        addTextCell(row, order.status);
        addTextCell(row, new Date(order.createdAt).toLocaleString());
        var actionCell = document.createElement("td");
        var actions = document.createElement("div");
        actions.className = "admin-actions";
        if (["pending", "failed", "cod"].indexOf(order.status) >= 0) {
          actionButton(actions, "Cancel", { url: "/api/admin/orders/" + encodeURIComponent(order.orderId) + "/cancel" });
        }
        if (order.status === "paid") {
          actionButton(actions, "Refund", { url: "/api/admin/orders/" + encodeURIComponent(order.orderId) + "/refund" });
        }
        actionCell.appendChild(actions);
        row.appendChild(actionCell);
        tbody.appendChild(row);
      });
      message.textContent = orders.length ? "Showing up to 200 most recent orders." : "No orders yet.";
    } catch (error) {
      message.textContent = error.message;
    }
  }
  load();
})();
