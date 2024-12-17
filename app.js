const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const operations = require('./operations'); // Import the reusable module

const app = express();
const port = 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(cookieParser());
app.use(express.static('public')); // Static files
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to track recently visited pages
app.use((req, res, next) => {
    if (!req.session.visitedPages) req.session.visitedPages = [];
    const currentPage = { name: req.url, url: req.url };

    req.session.visitedPages = req.session.visitedPages.filter(page => page.url !== currentPage.url);
    req.session.visitedPages.unshift(currentPage);
    req.session.visitedPages = req.session.visitedPages.slice(0, 10);

    next();
});

// Home route
app.get('/', (req, res) => {
    res.render('home', { visitedPages: req.session.visitedPages });
});
app.get('/home', (req, res) => {
    res.render('home', { visitedPages: req.session.visitedPages });
});

// Query handlers
app.get('/queryhandler', (req, res) => {
    console.log(req.query);
    res.send('Query parameters logged on the server console.');
});

app.get('/queryhandler2', (req, res) => {
    res.render('show', { params: req.query });
});

// Add book form and handler
app.get('/add-book', (req, res) => {
    res.render('add-book');
});

app.post('/add-book', (req, res) => {
    const { title, author, year, publisher } = req.body;
    const file = req.files?.cover;

    const coverPath = file ? `/images/${file.name}` : null;
    if (file) file.mv(`./public${coverPath}`);

    const book = { title, author, year, publisher, coverPath };
    let books = [];

    if (fs.existsSync('books.json')) {
        books = JSON.parse(fs.readFileSync('books.json'));
    }

    books.push(book);
    fs.writeFileSync('books.json', JSON.stringify(books, null, 2));

    res.render('show-book-info', { book });
});

// Dashboard to list books
app.get('/dashboard', (req, res) => {
    let books = [];

    if (fs.existsSync('books.json')) {
        books = JSON.parse(fs.readFileSync('books.json'));
    }

    res.render('dashboard', { books });
});

// Cookie management
app.get('/cookie1', (req, res) => {
    const currentTime = Date.now();
    const lastVisit = req.cookies.last_visit_timestamp;

    res.cookie('last_visit_timestamp', currentTime);
    res.cookie('token', 'sample_token');

    const secondsElapsed = lastVisit ? (currentTime - lastVisit) / 1000 : 0;
    res.render('cookie1', { secondsElapsed });
});

app.get('/add-cookie', (req, res) => {
    res.render('add-cookie');
});

app.post('/add-cookie', (req, res) => {
    const cookieName = req.body['cookie-name']; // Get the cookie name
    const cookieValue = req.body['cookie-value']; // Get the cookie value

    // Check if the cookie name and value are provided
    if (cookieName && cookieValue) {
        // Set the cookie
        res.cookie(cookieName, cookieValue, { maxAge: 900000, httpOnly: true });
        console.log(`Cookie set: ${cookieName} = ${cookieValue}`);
    } else {
        console.log('Cookie name or value is missing.');
    }

    res.redirect('/show-cookies');
});


// Show all cookies
app.get('/show-cookies', (req, res) => {
    res.render('cookies-manager', { cookies: req.cookies });
});

// Remove cookie
app.post('/remove-cookie', (req, res) => {
    const { name } = req.body;
    res.clearCookie(name);
    res.redirect('/home');
});

// AJAX remove cookie handler
app.delete('/remove-cookie-ajax', (req, res) => {
    const { name } = req.body;
    res.clearCookie(name);
    res.json({ success: true });
});

// Operations demo
app.get('/add-update-user', (req, res) => {
    const userId = req.query.id;
    let user = null;
    if (userId) {
        user = operations.get(userId); // Get user by ID if present
    }
    res.render('add-update-user', { user });
});

// Save User (Add or Update)
app.post('/save-user', (req, res) => {
    const { id, name, email } = req.body;
    if (id) {
        // Update user
        operations.update(id, { name, email });
    } else {
        // Add new user
        const newUser = { id: Date.now().toString(), name, email };
        operations.add(newUser);
    }
    res.redirect('/manage-users');
});

// Manage Users (Display List of Users)
app.get('/manage-users', (req, res) => {
    const users = operations.getAll();
    res.render('manage-users', { users });
});

// Delete User
app.post('/delete-user', (req, res) => {
    const { id } = req.body;
    operations.delete(id);  // Delete user by ID
    res.redirect('/manage-users');
});


app.get('/clear-pages', (req, res) => {
    if (req.session.visitedPages) {
        req.session.visitedPages = []; // Clear the visited pages array
    }
    res.redirect('/home'); // Redirect back to home page
});


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
