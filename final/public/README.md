# CSC337_Project
Final Project for CSC337

Required Packages:
    node.js
    npm
    express
    express-session
    cors

Running:
    1 - open terminal and navigate to directory primary 
        file is held in and into the final folder
    2 - start server with node server.js
    3 - open browser and go to: http://localhost:3000


Built-in Login Credentails:
    Use the following credentials to log in as different user roles:

    Admin -
        username - Admin1
        Passord - default
    User - 
        username - User1
        password - default
    Seller -
        username - Seller1
        password - default

Folder Structure:
    final/
    |
    |--- server.js
    |
    |--- public/
            |
            |--- imgs/
            |
            |--- JSON/
            |
            |--- src/
            |
            |--- [remaing html files]

Known Issues/TODO:
    Issue:
        - User credentials sometimes fail to load properly, requiring a fresh login.
        - Users can return to previous pages even after logging out (session handling issue)
    TODO:
        - Expand the User module with an orderHistory feature to track purchases
        - Expand the Seller module with a salesHistory feature to track sales
