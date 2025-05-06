var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
var path = require('path');
var app = express();

function loadUsers() {
    try {
        var users = JSON.parse(fs.readFileSync('userlist.JSON', {'encoding':'utf8'})).split('\n');
        var retuser = [];
        for (var user in users) {
            user = user.split(',');
            var userobj = {'username':user[0], 'password':user[1], 'usertype':user[2], 'active':user[3], 'cart':user[4], 'sales':user[5]};
            retuser.push(userobj);
        }
        return retuser;
    } catch(err) {
        console.log(err);
    } 
}

var userList = loadUsers();

// Call this after signing in?
function loadOrders() {
    try {
        var orders = JSON.paese(fs.readFileSync('orderlist.JSON', {'encoding':'utf8'})).split('\n');
        var retorder = [];
        for (var order in orders) {
            order = order.split(',');
            var orderobj = {'name':order[0], 'price':order[1], 'quantity':order[2]};
            retorder.push(orderobj);
        }
    } catch(err) {
        console.log(err)
    }
}

function isUser(username, password) {
    for(var user in userList) {
        var hashedPass = crypto.createHash('sha256').update(password).digest('hex');
        if((user.username==username)&&(user.password==hashedPass)) {
            return true;
        }
    }
    return false;
}

function checkAdmin(username) {
    for(var user in userList) {
        if((user.username==username)&&(user.usertype=='admin')) {
            return true;
        }
    }
    return false;
}

function checkSeller(username) {
    for(var user in userList) {
        if((user.username==username)&&(user.usertype=='seller')) {
            return true;
        }
    }
    return false;
}

var publicFolder = path.join(__dirname, 'public/')
// We can rename the folder that holds the htmls if you guys want

app.get('/home', function(req, res) {
    // shop main screen?
    res.sendFile(path.join(publicFolder, 'home.html'));
});

// add other source files depending on pages using them
app.get('/source.js', function(req, res) {
    res.sendFile(path.join(publicFolder, 'source.js'));
});

app.post('/create_user', express.json(), function(req, res) {
    res.sendFile(path.join(publicFolder, 'create_user.html'));
});

app.post('/create_action', express.urlencoded({'extended':true}), function(req, res){
    var hashedPass = crypto.createHash('sha256').update(req.body.password).digest('hex');
    // how do we stop people from creating an admin/seller account?
    userList.push({'username':req.body.username, 'password':hashedPass, 'usertype':req.body.usertype});
    try {
        var user = `${req.body.username},${hashedPass},${req.body.usertype}\n`;
        fs.appendFileSync('users.txt', user, {'encoding':'utf8'});
    } catch(err) {
        console.log(err);
    }
    res.sendFile(path.join(publicFolder, 'create_action.html'));
});

app.post('/login', express.json(), function(req, res) {
    res.sendFile(path.join(publicFolder, 'login.html'));
});

app.post('/login_action', express.urlencoded({'extended':true}), function(req, res) {
    if(isUser(req.body.username, req.body.password) && (req.body.active != false)) {
        // Instead of sending them to login_action, send them to the homepage?
        if (checkAdmin(req.body.username)) {
            res.sendFile(path.join(publicFolder, 'login_action_admin.html'));
        } else if (checkSeller(req.body.username)) {
            res.sendFile(path.join(publicFolder, 'login_action_seller.html'));
        } else {
            res.sendFile(path.join(publicFolder, 'login_action.html'));
        }
    }
    else {
        res.sendFile(path.join(publicFolder, 'login_action_failure.html'));
    }
});

app.post('/manage', express.urlencoded({'extended':true}), function(req, res) {
    // manage website and sellers?
    if(checkAdmin(req.body.usertype)) {
        res.sendFile(path.join(publicFolder, 'manage.html'));
    }
    else {
        res.sendFile(path.join(publicFolder, 'manage_action_failure.html'));
    }
})


// Independent and Cart
app.get('/store')

app.post('/store_action')
// adding items to store?

app.post('/cart')

app.post('/cart_action')

app.listen(3000, function(){});