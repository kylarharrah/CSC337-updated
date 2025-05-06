var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
var path = require('path');
var app = express();
const session = require('express-session')
const cors = require('cors')

app.use(express.json())
app.use(session({
    secret: generateString(), //random cookie key
    resave: false,
    saveUninitialized: false, 
    cookie: {
        maxAge: 3600000,
    }
}))

var publicFolder = path.join(__dirname, 'public')
app.use(express.static(publicFolder))

const jsonFolder = path.join(__dirname, 'public', 'JSON');
const userListPath = path.join(jsonFolder, 'userList.JSON');
const sellerListPath = path.join(jsonFolder, 'sellerList.JSON');
const adminListPath = path.join(jsonFolder, 'adminList.JSON');
const pendingListPath = path.join(jsonFolder, 'pendingListings.JSON');

function loadUsers(filename) {
    const filePath = path.join(__dirname, 'public', 'JSON', filename)
    try {
        return JSON.parse(fs.readFileSync(filePath, {'encoding':'utf8'}));
    } catch(err) {
        console.log(err);
    } 
}

var userList = loadUsers('userList.JSON');
var sellerList = loadUsers('sellerList.JSON');
var adminList = loadUsers('adminList.JSON');

function loadPending() {
    try {
        return JSON.parse(fs.readFileSync(pendingListPath, {'encoding':'utf8'}));
    } catch(err) {
        console.log(err);
    }
}

function isUser(username, password) {
    var userResult = userList.find(user=>user.username === username)
    var sellerResult = sellerList.find(user=>user.username === username)
    var adminResult = adminList.find(user=>user.username === username)
    if (userResult) var user = userResult
    else if (sellerResult) var user = sellerResult
    else if (adminResult) var user = adminResult
    else return false
    if (user.password === password && user.active === true) return true
    return false;
}

function generateString(length = 16) {
    const characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let retval = '';
    for ( let i = 0; i < length; i++ ) {
        retval += characters.charAt(Math.floor(Math.random() * 62));
    }
    return retval;
}

app.get(['/', '/home', '/index'], function(req, res) {
    if(req.session.user) {
        if (req.session.user.role == 'admin') res.sendFile(path.join(publicFolder, 'manage.html'));
        else if (req.session.user.role == 'seller') res.sendFile(path.join(publicFolder, 'seller_dash.html'));
        else res.sendFile(path.join(publicFolder, 'user_home.html'));
    } else {
        res.sendFile(path.join(publicFolder, 'guest_home.html'));
    }  
});

// send to web pages
app.get('/create_user', function(req, res) {res.sendFile(path.join(publicFolder, 'create_user.html'));});

app.post('/create_action', express.urlencoded({'extended':true}), function(req, res){
    // Make sure 2 users cant have the same username
    
    var hashedPass = crypto.createHash('sha256').update(req.body.password).digest('hex');
    if (req.body.type == 'user'){
        userList.push({
            'username':req.body.username, 
            'password':hashedPass, 
            'active':true, 
            'cart':{},
            'orderhistory':{}
        });
        try {
            var userListJSON = JSON.stringify(userList);
            fs.writeFileSync(userListPath, userListJSON, {'encoding':'utf8'})
        } catch(err) {
            console.log(err);
        }
    } else if (req.body.type=='seller') {
        sellerList.push({
            'username':req.body.username, 
            'password':hashedPass, 
            'active':true, 
            'products':{},
            'sales':{}
        });
        try {
            var sellerListJSON = JSON.stringify(sellerList);
            fs.writeFileSync(sellerListPath, sellerListJSON, {'encoding':'utf8'})
        } catch(err) {
            console.log(err);
        }
    }
    res.sendFile(path.join(publicFolder, '/guest_home.html'));
});

app.post('/login_action', express.urlencoded({'extended':true}), function(req, res) {
    var hashedPass = crypto.createHash('sha256').update(req.body.password).digest('hex');
    var username = req.body.username
    if(isUser(username, hashedPass)) {
        console.log(`Attempting to login as ${username}`);
        let user = adminList.find(user => user.username === username) ||
                   sellerList.find(user => user.username === req.body.username) ||
                   userList.find(user => user.username === req.body.username)
        let role = adminList.includes(user) ? 'admin'
                 : sellerList.includes(user) ? 'seller'
                 : 'user';

        req.session.user = {
            username: user.username,
            role: role
        }
        if (adminList.includes(user)) {
            res.sendFile(path.join(publicFolder,'manage.html'));
        } else if (sellerList.includes(user)) {
            res.sendFile(path.join(publicFolder, 'seller_dash.html'));
        } else {
            res.sendFile(path.join(publicFolder,'user_home.html'));
        }
    }
    else {
        console.log('Invalid login.');
        res.sendFile(path.join(publicFolder, 'guest_home.html'));
    }
});

// fetching
app.get('/get_users', (req, res) => {
    res.json({users: userList, sellers: sellerList, admins: adminList})
})

app.post('/update_users', express.json(), (req, res) => {
    const {users, admins} = req.body
    userList = users
    adminList = admins
    try {
        fs.writeFileSync(userListPath, JSON.stringify(userList), 'utf8')
        fs.writeFileSync(adminListPathListPath, JSON.stringify(adminList), 'utf8')
        res.json({success: true})
    }
    catch(err) {
        console.log(err)
    }
})

app.get('/get_user_info', (req, res) => {
    const userSession = req.session.user
    let user = adminList.find(user => user.username === userSession.username) ||
               sellerList.find(user => user.username === userSession.username) ||
               userList.find(user => user.username === userSession.username)

    if (userSession.role == 'user') {
        res.json({
            username: user.username,
            cart: user.cart,
            orderhistory: user.orderhistory
        })
    }
    else if (userSession.role == 'seller') {
        res.json({
            username: user.name,
            products: user.product,
            sales: user.sales
        })
    }
}) 

app.get('/get_pending_listings', (req, res) => {
    res.json(loadPending())
})

app.post('/update_pending', express.json(), (req, res) => {
    let pending = req.body.pending
    try {
        fs.writeFileSync(pendingListPathath, JSON.stringify(pending), 'utf8')
        res.json({success: true})
    }
    catch(err) {
        console.log(err)
    }
})

app.post('/update_listings', express.json(), (req, res) => {
    let sellers = req.body.sellers
    sellerList = sellers
    try {
        fs.writeFileSync(sellerListPath, JSON.stringify(sellerList), 'utf8')
        res.json({success: true})
    }
    catch(err) {
        console.log(err)
    }
})

app.post('/update_sales', express.json(), (req, res) => {
    let sellers = req.body.sellers;
    sellerList = sellers;
})

app.post('/update_user_status', express.json(), (req, res) => {
    const {username, active} = req.body
    let found = false

    let user = userList.find(u => u.username == username)
    if (user) {
        user.active = active
        found = 'userList'
    }
    else {
        user = sellerList.find(u => u.username == username)
        found = 'sellerList'
    } 
    
    try {
        if (found == 'userList') {
            fs.writeFileSync(userListPath, JSON.stringify(userList), 'utf8')
        }
        else {
            fs.writeFileSync(sellerListPath, JSON.stringify(sellerList), 'utf8')
        }
    }
    catch(err) {
        console.log(err)
    }
})

app.post('/update_cart' , express.json(), (req, res) => {
    let userSession = req.session.user
    let user = userList.find(u => u.username == userSession.username)
    user.cart = req.body.cart
    try {
        fs.writeFileSync(userListPath, JSON.stringify(userList), 'utf8')
        res.json({success : true})
    }
    catch(err) {
        console.log(err)
    }
})

app.post('/update_orderhistory', express.json(), (req, res) => {
    let userSession = req.session.user
    let user = userList.find(u => u.username == userSession.username)
    user.orderhistory = req.body.orderhistory
    try {
        fs.writeFileSync(userListPath, JSON.stringify(userList), 'utf8')
        res.json({success : true})
    }
    catch(err) {
        console.log(err)
    }
})

// accessing pages

app.post('/create_listing', function(req, res) {
    //add to listing
    if (session.user.role == 'seller') {
        var pending = loadPending()
        pending.push({
            'product':req.body.product,
            'price':req.body.price,
            'seller':req.session.user.username
        })
        try {
            var pendingListJSON = JSON.stringify(pending);
            fs.writeFileSync(pendingListPath, pendingListJSON, {'encoding':'utf8'}); 
        } catch(err) {
            console.log(err);
        }
        res.sendFile(path.join(publicFolder, 'seller_dash.html'))
    }
})


// DONT WORK
app.get('/logout', express.urlencoded({'extended':true}), function(req, res) {
    req.session.destroy();
    res.sendFile(path.join(publicFolder, 'guest_home.html'))
});


app.get('/shop', express.urlencoded({'extended':true}), function(req, res) {
    res.sendFile(path.join(publicFolder, 'shop.html'));
});

app.get('/cart', express.urlencoded({'extended':true}), function(req, res) {
    res.sendFile(path.join(publicFolder, 'cart.html'));
});

app.get('/checkout', express.urlencoded({'extended':true}), function(req, res) {
    if (!req.session.user) {
        alert('Please make an account or sign in.');
        res.sendFile(path.join(publicFolder, 'guest_home.html'));
    } else {
        res.sendFile(path.join(publicFolder, 'payment.html'));
    }
});

app.listen(3000, function(){
    console.log('Server online at localhost:3000')
});