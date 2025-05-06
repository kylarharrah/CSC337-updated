document.addEventListener('DOMContentLoaded', () => {
    getUsers();
    getPendingListings();
    getAnalytics()
});

function getUsers() {
    console.log('get users called')
    fetch('/get_users') 
    .then(res => res.json())
    .then(data => {
        console.log("Fetched data:", data);
        var user_table = document.getElementById('user_table');
        var seller_table = document.getElementById('seller_table');
        console.log("User table:", user_table);
        console.log("Seller table:", seller_table);
        user_table.insertRow().insertCell().textContent = "TEST USER"
        data.users.forEach(user => {
            addToggleRow(user_table, user.username, user.active)
        })
        data.sellers.forEach(seller => {
            addToggleRow(seller_table, seller.username, seller.active)
        })
    })
}

function addToggleRow(table, username, active) {
    console.log(`Inserting row for: ${username}, active: ${active}`)
    var row = table.insertRow();
    row.id = "row_" + (table.children[0].children.length-1);
    var usernameCell = row.insertCell();
    usernameCell.innerHTML = username;
    var activeCell = row.insertCell();
    activeCell.innerHTML = active;
    var toggle = row.insertCell();
    var button = document.createElement("button");
    button.textContent = 'Toggle Active';
    button.onclick = function() {
        userToggle(username)
    };
    toggle.appendChild(button);
}

function addAdminButton(table) {
    for(let i = 1; i < table.rows.length; i++) {
        var lastCell = table.rows[i].cells[table.rows[i].cells.length - 1];
        var button = document.createElement('button');
        button.setAttribute("value", "Make Admin");
        button.onclick = function() {
            var row = this.closest('tr')
            var username = row.cells[0].textContent;
            var ans = window.prompt(`Are you sure you want ${username} to be an admin? (yes/no)`);
            if (ans.toLowerCase() == 'yes') {
                createAdmin(username);
            }
        }
        lastCell.appendChild(button)
    }
}

function userToggle(username) {
    fetch('/get_users') 
    .then(res => res.json())
    .then(data => {
        let user = data.users.find(u => u.username == username)
        if (!user) {
            user = data.sellers.find(u => u.username == username)
        }
        if (user) {
            user.active = !user.active
        }
        fetch('/update_user_status', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user.username, active: user.active})
        })
        .then(res=>res.json())
        .then(response=> {
            if (response.success) {
                getUsers()
            }
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => {
        console.log(err)
    })
}

function createAdmin(username) {
    fetch('/get_users') 
    .then(res => res.json())
    .then(data => {
        let admins = data.admins
        let users = data.users
        let user = users.find(u => u.username == username)
        admins.push({'username':user.username, 'password':user.password, 'active':true})
        users = users.filter(u => u.username != username)

        fetch('/update_users', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({users: users, admins: admins})
        })
        .then(res=>res.json())
        .then(response=> {
            if (response.success) {
                getUsers()
            }
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => {
        console.log(err)
    })
}

function getPendingListings() {
    var table = document.getElementById('listings');
    fetch('/get_pending_listings')
    .then(res=>res.json())
    .then(data => {
        for (const pending of data) {
            const row = table.insertRow();
            const productCell = row.insertCell();
            productCell.innerText = pending.product;
    
            const priceCell = row.insertCell(); 
            priceCell.innerText = parseFloat(pending.price).toFixed(2);
            const choice = row.insertCell();
    
            const sellerCell = row.insertCell()
            sellerCell.innerText = pending.seller
    
            const approve = document.createElement('button');
            approve.textContent = 'Approve';
            approve.onclick = function () {
                addListing(pending)
                removePending(pending)
            };
            const deny = document.createElement('button');
            deny.textContent = 'Deny';
            deny.onclick = function () {
                removePending(pending)
            };
    
            choice.appendChild(approve)
            choice.appendChild(deny)
        }
    })
    .catch(err => {
        console.log(err)
    })
}

function addListing(listing) {
    var {product, price, seller} = listing
    fetch('/get_users') 
    .then(res => res.json())
    .then(data => {
        let sellers = data.sellers
        let user = sellers.find(s => s.username == seller)
        user.products.push({
            product: product,
            price: parseFloat(parseFloat(price).toFixed(2))
        })
        fetch('/update_listings', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({sellers: sellers})
        })
        .then(res=>res.json())
        .then(response=> {
            if (response.success) {
                getPendingListings()
            }
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => {
        console.log(err)
    })
} 

function removePending(listing) {
    fetch('/get_pending_listings')
    .then(res=>res.json())
    .then(data => {
        let pendingArray = data.filter(item => {
            return !(
                item.product === listing.product &&
                item.price === listing.price &&
                item.seller === listing.seller
            )
        })
        fetch('/update_pending', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({pending: pendingArray})
        })  
        .then(res=>res.json())
        .then(response=> {
            if (response.success) {
                getPendingListings()
            }
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => {
        console.log(err)
    })
}

function getAnalytics() {
    var ul = document.getElementById('analytics');
    ul.innerHTML = ''
    fetch('/get_users') 
    .then(res => res.json())
    .then(data => {
        let sellers = data.sellers

        for (var seller of sellers) {
            var salesNumber = 0;
            for (var item of seller.sales) {
                salesNumber += parseFloat(item.price)
            }
            var listing = document.createElement('li');
            listing.innerHTML = `${seller.username}:${salesNumber}`
            ul.appendChild(listing);
        }
    })
    .catch(err => {
        console.log(err)
    })
}