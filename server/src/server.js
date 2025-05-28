const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught Exception Handler (sync code)
process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1); // Exit immediately, as the process is in an unclean state
});

dotenv.config({ path: './.env' }); // Load env variables from .env file

const app = require('./app'); // Get the Express app

const DB = process.env.MONGODB_URI;

if (!DB) {
    console.error('ERROR: MONGODB_URI is not defined in the .env file.');
    process.exit(1);
}

mongoose.connect(DB, {
    // No options needed for Mongoose 6+ with modern MongoDB drivers
}).then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

const port = process.env.PORT || 3001; // Fallback to 3001 if PORT not set
const server = app.listen(port, () => {
    console.log(`App running on port ${port}... (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);
});

// Unhandled Rejection Handler (async code, e.g. DB connection issues)
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => { // Gracefully close the server first
        process.exit(1); // Then exit
    });
});

// Handle SIGTERM for graceful shutdown (e.g. from Docker or PaaS)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
        // Mongoose connection will be closed by Node.js runtime
        process.exit(0);
    });
});
