const AppError = require('../utils/app.error');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    // Extract value from the error message if possible
    let value = 'Unknown value';
    if (err.message && typeof err.message === 'string') {
        const match = err.message.match(/(["'])(\?.)*?\1/);
        if (match && match[0]) {
            value = match[0];
        } else if (err.keyValue) {
            value = JSON.stringify(err.keyValue);
        }
    } else if (err.keyValue) {
         value = JSON.stringify(err.keyValue);
    }

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // RENDERED WEBSITE (if you had one)
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).send('Something went wrong on the server (DEV)!');
};

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // A.1) Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // A.2) Programming or other unknown error: don't leak error details
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }

    // B) RENDERED WEBSITE (if you had one)
    // B.1) Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).send(`Error: ${err.message}`);
    }
    // B.2) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(err.statusCode).send('Something went wrong on the server!');
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, name: err.name, message: err.message, stack: err.stack, code: err.code, keyValue: err.keyValue }; // Ensure all relevant properties are copied

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        // Mongoose duplicate key errors have 'code: 11000'
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    } else if (process.env.NODE_ENV === 'test') {
        // For test environment, send detailed error similar to development
        // but without the console.error spam if not desired, or use sendErrorDev directly
        // If you still want to log to console during tests, you can call sendErrorDev
        // sendErrorDev(err, req, res); 
        // Or, for cleaner test output, just send the JSON response:
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err, // Include full error object for debugging tests
            stack: err.stack,
        });
    } else {
        // Fallback for environments where NODE_ENV is not explicitly set
        console.error('ERROR (Unknown Env - NODE_ENV not set to development, production, or test) ❓', err);
        // Provide a default response that's somewhat informative but safe
        res.status(err.statusCode).json({
            status: err.status,
            message: err.isOperational ? err.message : 'An unexpected error occurred on the server.',
            // Optionally include more details if it's explicitly a test environment and not production
            ...(process.env.NODE_ENV === 'test' && !err.isOperational ? { error: { name: err.name, message: err.message, stack: err.stack } } : {})
        });
    }
}; 