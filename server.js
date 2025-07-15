const express = require('express');
require('dotenv').config();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const methodOverride = require('method-override');

const UserRoute = require('./routes/user')
const SessionRoute = require('./routes/session')
const AuthRoute = require('./routes/auth');
const ApiRoute = require('./routes/api');
const { isAuthenticated } = require('./middleware/auth');
const UserModel = require('./model/user');

mongoose.Promise = global.Promise;
const mongoUri = process.env.MONGODB_URI;
console.log('Attempting to connect to MongoDB with URI:', mongoUri.replace(/:[^:@]+@/, ':****@'));
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
    appName: 'eugene-server-3'
}).then(() => {
    console.log("Database Connected Successfully!!");    
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
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

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

app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('home', { error: req.query.error });
});

app.use('/user', isAuthenticated, UserRoute)
app.use('/session', isAuthenticated, SessionRoute)
app.use('/auth', AuthRoute);
app.use('/api', ApiRoute);
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', './views');
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 