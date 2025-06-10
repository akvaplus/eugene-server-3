const express = require('express');
require('dotenv').config();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');

const UserRoute = require('./routes/user')
const SessionRoute = require('./routes/session')
const AuthRoute = require('./routes/auth');
const isAuthenticated = require('./middleware/auth');


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Databse Connected Successfully!!");    
}).catch(err => {
    console.log('Could not connect to the database', err);
    process.exit();
});
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});

app.use('/user', isAuthenticated, UserRoute)
app.use('/session', isAuthenticated, SessionRoute)
app.use('/', AuthRoute);
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', './views');
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 