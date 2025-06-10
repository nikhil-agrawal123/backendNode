const session = require('express-session');

const sessionConfig = {
    secret: import.meta.env.SESSION_SECRET || 'healthcare-default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: import.meta.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'healthcare.sid'
};

module.exports = sessionConfig;
