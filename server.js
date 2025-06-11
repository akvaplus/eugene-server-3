const express = require('express');
require('dotenv').config();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const MongoStore = require('connect-mongo');

const UserRoute = require('./routes/user')
const SessionRoute = require('./routes/session')

const AuthRoute = require('./routes/auth');
const { isAuthenticated } = require('./middleware/auth');
const UserModel = require('./model/user');

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
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/user-management' }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(async (req, res, next) => {
    res.locals.userId = req.session.userId || '';
    if (req.session.userId) {
        try {
            const user = await UserModel.findById(req.session.userId);
            res.locals.isAdmin = user ? user.isAdmin : false;
        } catch (err) {
            console.error('Error fetching user for isAdmin check:', err);
            res.locals.isAdmin = false;
        }
    } else {
        res.locals.isAdmin = false;
    }
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