// shop.html
function addToCart(productId) {
    const productCard = document.getElementById(productId);
    const size = productCard.querySelector('select[name="size"]').value;
    const quantity = productCard.querySelector('select[name="qt"]').value;
    
    if (!size || !quantity) {
        alert("Please select both a size and quantity.");
        return;
    }

    const productName = productCard.closest('.product-card').querySelector('h3').innerText;
    const priceText = productCard.closest('.product-card').querySelector('.price').innerText;
    const price = parseFloat(priceText.replace('$', ''));

    const item = {
        name: productName,
        size: size,
        quantity: parseInt(quantity),
        price: price,
        total: price * quantity
    };
    fetch('/get_user_info', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        let currentCart = Array.isArray(data.cart) ? data.cart : [];
        const existingItem = currentCart.find(cartItem => cartItem.name === item.name && cartItem.size === item.size);
        if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            currentCart.push(item);
            alert(`${quantity} ${productName} (Size ${size}) has been added to your cart.`)
        }

        return fetch('/update_cart', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cart: currentCart})
        })
        .then(res=>res.json())
        .then(response=> {
            if (response.success) console.log('Cart updated');
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err)
    })
}
// cart.html
function getCart() {
    return fetch('/get_user_info', {
        method: 'GET',
        credentials: 'include'  
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to fetch user info");
        }
        return res.json(); 
    })
    .then(data => {
        if (data.error) {
            console.warn("Error in user data:", data.error);
            return [];  
        }

        // Check for user session and return the cart
        if (data.cart && Array.isArray(data.cart)) {
            return data.cart;  
        } else {
            console.warn("No cart found, returning empty array.");
            return [];  
        }
    })
    .catch(err => {
        console.error("Error getting cart:", err);
        return []; 
    });
}

async function loadCart() {
    getCart().then(cart=> {
        const tbody = document.querySelector("#cart-table tbody");
        const totalEl = document.getElementById("grand-total");
        let grandTotal = 0;
        tbody.innerHTML = "";  // Clear any previous content

        if (cart.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5'>Your cart is empty.</td></tr>";
            totalEl.textContent = "$0.00";
            return;
        }

        // Loop through cart items and display them
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

        // Update the grand total
        totalEl.textContent = `$${grandTotal.toFixed(2)}`;
    }).catch(err => {
        console.error("Error loading cart:", err);
    });
}

async function clearCart() {
    try {
        const res = await fetch('/update_cart', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({cart: {}})
        });

        const response = await res.json();
        if (response.success) {
            console.log('Cart cleared');
        }
    } catch (err) {
        console.log(err);
    }
}
//
async function proceedToCheckout() {
    var cart = await getCart()
    if (cart.length === 0) {
        alert("Your cart is empty. Add items before proceeding to checkout.");
        return;
    }
    window.location.href = "payment.html";
}

// payment.html
async function submitted(event) {
    event.preventDefault()
    var form = document.getElementById("paymentForm");

    if (form.checkValidity()) {
        alert("Payment succeeded!");
        const cart = await getCart()
        await clearCart()
        window.location.href = '/login_action'
    } else {
        form.reportValidity();
    }
}

async function showAmountDue() {
    try {
        const cart = await getCart(); // Wait for the cart to be fetched
        if (!Array.isArray(cart)) {
            console.error("Cart data is not in the correct format.");
            document.getElementById("amountDue").textContent = "Error: Cart data is unavailable.";
            return;
        }

        let total = 0;
        cart.forEach(item => {
            total += item.total;
        });

        // Show the total amount due
        document.getElementById("amountDue").textContent = `Total Amount Due: $${total.toFixed(2)}`;
    } catch (err) {
        console.error("Error while calculating amount due:", err);
        document.getElementById("amountDue").textContent = "Error: Unable to calculate amount due.";
    }
}


