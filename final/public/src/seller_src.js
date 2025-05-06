document.addEventListener('DOMContentLoaded', () => {
    getListings();
    getPendingListings();
    getSales()
});

function updateCookies() {
    return fetch('/get_user_info', {
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
        console.log(err);
    });
}

function getListings() {
    fetch('/get_user_info', {
        method: 'GET',
        credentials: 'include', // Include cookies if using session-based auth
    })
    .then(res => res.json())
    .then(data => {
        if (!data || !data.username) {
            return alert('User info not loaded. Please try again.');
        }
        const listings = data.products;
        const table = document.getElementById('listings');
        table.innerHTML = ''
        listings.forEach((listing) => {
            const row = table.insertRow();
            const nameCell = row.insertCell();
            const priceCell = row.insertCell();
            const actionCell = row.insertCell();

            nameCell.innerText = listing.product;
            priceCell.innerText = `$${parseFloat(listing.price).toFixed(2)}`;

            const button = document.createElement('button');
            button.textContent = 'Delete';
            button.onclick = () => deleteListing({
                product: listing.product,
                price: listing.price,
                seller: data.username
            });
            actionCell.appendChild(button);
        });
    })
}

function deleteListing(listing) {
    return fetch('/get_users')
        .then(res => res.json())
        .then(data => {
            const sellers = data.sellers;
            const user = sellers.find(s => s.username === listing.seller);

            if (!user || !Array.isArray(user.products)) {
                console.warn("User or products not found for:", listing.seller);
                return;
            }

            // Filter out the matching product
            user.products = user.products.filter(p =>
                !(p.product === listing.product && parseFloat(p.price) === parseFloat(listing.price))
            );

            return fetch('/update_listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellers })
            });
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                console.log("Listing deleted.");
                getListings(); 
            } else {
                console.warn("Failed to delete listing.");
            }
        })
        .catch(err => {
            console.error("Error during deleteListing:", err);
        });
}

function requestNewListing(e) {
    e.preventDefault();
    fetch('/get_user_info', {
        method: 'GET',
        credentials: 'include', // Include cookies if using session-based auth
    })
    .then(res => res.json())
    .then(data => {
        if (!data || !data.username) {
            return alert('User info not loaded. Please try again.');
        }
        const product = document.getElementById('product').value;
        const price = parseFloat(document.getElementById('price').value);

        if (!product || isNaN(price) || price <= 0) {
            return alert('Please provide valid product and price.');
        }

        const listing = {
            product,
            price,
            seller: data.username
        };

        fetch('/create_listing', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listing)
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                alert('Listing submitted');
                getPendingListings();
            }
        })
        .catch(err => {
            console.error('Submission failed:', err);
        });
    })
}

function getPendingListings() {
    fetch('/get_pending_listings')
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById('pending_listings');
            table.innerHTML = ''
            data.forEach(item => {
                const row = table.insertRow();
                row.insertCell().innerText = item.product;
                row.insertCell().innerText = `$${parseFloat(item.price).toFixed(2)}`;
            });
        })
        .catch(err => {
            console.error('Failed to fetch pending listings:', err);
        });
}

function getSales() {
    if (!user || !user.sales) return;

    const sales = Array.isArray(user.sales) ? user.sales : JSON.parse(user.sales);
    const list = document.getElementById('sales');
    const profitDisplay = document.getElementById('total_profit');
    list.innerHTML = '';
    let totalProfit = 0;

    sales.forEach(sale => {
        const quantity = sale.quantity || 1;
        const price = parseFloat(sale.price || 0);
        const profit = quantity * price;
        totalProfit += profit;

        const li = document.createElement('li');
        li.textContent = `${sale.product} has been sold ${quantity} time(s)`;
        list.insertBefore(li, list.firstChild);
    });

    if (profitDisplay) {
        profitDisplay.textContent = `$${totalProfit.toFixed(2)}`;
    }
}
