const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/user');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/auth/google/callback",
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // If user exists, return the user
            return done(null, user);
        } else {
            // If user doesn't exist, create a new user
            user = await User.create({
                username: profile.emails[0].value.split('@')[0], // Use email prefix as username
                email: profile.emails[0].value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                isEmailVerified: true, // Since it's Google verified
                password: Math.random().toString(36).slice(-8), // Random password
            });
            return done(null, user);
        }
    } catch (error) {
        return done(error, null);
    }
  }
));

module.exports = passport; 