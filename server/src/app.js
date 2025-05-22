const express = require('express');
const morgan = require('morgan'); // HTTP request logger
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorMiddleware'); // We'll create this
const mainRouter = require('./routes'); // Your main router from routes/index.js

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Log HTTP requests in dev mode
}

app.use(express.json()); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // For URL-encoded data

// Serve static files (if any, e.g., for a simple frontend or uploaded files)
// app.use(express.static(`${__dirname}/public`));

// API Routes
app.use('/api/v1', mainRouter); // Prefix all routes with /api/v1

// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app; 