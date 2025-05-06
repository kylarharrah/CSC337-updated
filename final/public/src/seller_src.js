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
    var user = updateCookies()
    const listings = user.products;
    const table = document.getElementById('listings');

    listings.forEach((listing) => {
        const row = table.insertRow();
        const nameCell = row.insertCell();
        const priceCell = row.insertCell();
        const actionCell = row.insertCell();

        nameCell.innerText = listing.product;
        priceCell.innerText = `$${parseFloat(listing.price).toFixed(2)}`;

        const button = document.createElement('button');
        button.textContent = 'Delete';
        button.onclick = () => deleteListing(listing.product);
        actionCell.appendChild(button);
    });
}

function deleteListing(productName) {
    if (confirm(`Delete ${productName}?`)) {
        let listings = JSON.parse(localStorage.getItem('products')) || [];
        listings = listings.filter(listing => listing.product !== productName);
        localStorage.setItem('products', JSON.stringify(listings));
        getListings();
    }
}

function requestNewListing(e) {
    e.preventDefault();
    if (!user || !user.username) {
        return alert('User info not loaded. Please try again.');
    }
    const product = document.getElementById('product').value;
    const price = parseFloat(document.getElementById('price').value);

    const listing = {
        product,
        price,
        seller: user.username
    };

    fetch('/create_listing', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing)
    })
    .then(res => res.json())
    .then(data => {
        alert('Listing submitted');
        getPendingListings();
    })
    .catch(err => {
        console.error('Submission failed:', err);
    });
}

function getPendingListings() {
    fetch('/api/pending_listings')
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById('pending_listings');
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
