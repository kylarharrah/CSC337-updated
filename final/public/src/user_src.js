// getter
function updateCookies() {
    fetch('/get_user_info', {
        method: 'GET',
        credentials: 'include'
        })
    .then(res => res.json())
    .then(data => {
        if (!data.error) {
            return data
        }
    })
    .catch(err => {
        console.log(err)
    })
}

// orderhistory.html
function addToOrderHistory(cart) {
    fetch('/update_orderhistory', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cart: cart})
    })
    .then(res=>res.json())
    .then(response=> {
        if (response.success) console.log('Orderhistory updated');
    })
    .catch(err => {
        console.log(err);
    });
}

function loadOrderHistory() {
    var user = updateCookies();
    var history = user.orderhistory
    var table = document.getElementById('orderhistory')
    for (var obj of history) {
        var row = table.insertRow();
        var productCell = row.insertCell();
        productCell.innerText = obj.product;

        var quantityCell = row.insertCell();
        quantityCell.innerText = obj.quantity;

        var priceCell = row.insertCell()
        priceCell.innerText = parseFloat(obj.price).toFixed(2);
    }
}

// shop.html
function addToCart(divID) {
    const div = document.getElementById(divID); // size and quantity div
    const name = div.parentElement.children[1];
    const price = div.parentElement.children[2].value;
    const size = div.children[1].value // value of the size select
    const quantity = parseInt(card.querySelector("select[name='qt']").value);

    if (!size || !quantity) {
        console.log("Incorrect quantity selected.");
        return;
    }
    const item = {
        'product':name,
        'quantity':quantity,
        'price':price,
        'size':size,
    };

    // Get existing cart
    var cart = getCart();
    cart.push(item);
    //alert(`${quantity} ${name} (Size ${size}) added to cart.`);
    
    // updating cart
    fetch('/update_cart', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cart: cart})
    })
    .then(res=>res.json())
    .then(response=> {
        if (response.success) console.log('Cart updated');
    })
    .catch(err => {
        console.log(err);
    });
}

// cart.html
function getCart() {
    var user = updateCookies()
    return user.cart;
}

function loadCart() {
    var cart = getCart()
    var tbody = document.querySelector("#cart-table tbody");
    var totalEl = document.getElementById("grand-total");
    let grandTotal = 0;

    tbody.innerHTML = "";

    if (cart.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>Your cart is empty.</td></tr>";
        return;
    }
    // EDIT
    cart.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.size}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${item.total.toFixed(2)}</td>
        `;
        grandTotal += item.total;
        tbody.appendChild(row);
    });

    totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

function clearCart() {
    var cart = {}
    fetch('/update_cart', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cart: cart})
    })
    .then(res=>res.json())
    .then(response=> {
        if (response.success) console.log('Cart cleared');
    })
    .catch(err => {
        console.log(err);
    });
    document.querySelector("#cart-table tbody").innerHTML = "<tr><td colspan='5'>Your cart is empty.</td></tr>";
    document.getElementById("grand-total").textContent = "$0.00";
}
//
function proceedToCheckout() {
    var cart = getCart()
    if (cart.length === 0) {
        alert("Your cart is empty. Add items before proceeding to checkout.");
        return;
    }
    window.location.href = "payment.html";
}

// payment.html
function submitted(event) {
    event.preventDefault();
    var form = document.getElementById("paymentForm");

    if (form.checkValidity()) {
        alert("Payment succeeded!");
        addToOrderHistory(getCart())
        clearCart()
        window.location.href = "user_home.html";
    } else {
        form.reportValidity();
    }
}

function showAmountDue() {
    var cart = getCart();
    let total = 0;

    cart.forEach(item => {
        total += item.total;
    });

    document.getElementById("amountDue").textContent = `Total Amount Due: $${total.toFixed(2)}`;
}

