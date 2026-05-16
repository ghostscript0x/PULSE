const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const compression = require('compression');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorMiddleware');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"], // Required for EJS logic
            "script-src-attr": ["'unsafe-inline'"], // Allow event handlers in HTML if necessary
            "img-src": ["'self'", "data:", "https://*"],
            "connect-src": ["'self'", "https://zeroauthoritydao.com"],
        },
    },
}));
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Compress responses

// Database Connectivity
console.log('[DB CONNECTING]');
connectDB();

// View Engine (Maintaining frontend support)
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api', require('./routes/api'));
app.use('/', require('./routes/index'));

// SPA Catch-all for Vercel - serve index for non-API routes
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.render('index');
    } else {
        next();
    }
});

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[INIT] Backend running on port ${PORT}`);
});
