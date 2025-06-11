const session = require('express-session');

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "none",
        domain: process.env.NODE_ENV === 'production' ? 'health-chat-nexus.vercel.app' : "none" // Set domain for production
    },
    name: 'healthcare.sid'
};

module.exports = sessionConfig;
