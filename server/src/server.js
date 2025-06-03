const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require("socket.io"); // Import Socket.IO Server

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

const port = process.env.PORT || 3000; // Changed to 3000 to match client config
const server = app.listen(port, () => {
    console.log(`App running on port ${port}... (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);
});

// Initialize Socket.IO and attach to app
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production to your client's URL
        methods: ["GET", "POST"]
    }
});
app.set('io', io); // Make io accessible in request handlers via req.app.get('io')

io.on('connection', (socket) => {
    console.log('A user connected via WebSocket:', socket.id);

    socket.on('joinDraftRoom', (draftId) => {
        if (!draftId) {
            console.log(`Socket ${socket.id} attempt to join room with invalid draftId:`, draftId);
            socket.emit('errorJoiningRoom', 'Invalid Draft ID provided.');
            return;
        }
        console.log(`Socket ${socket.id} trying to join draft room: ${draftId}`);
        socket.join(draftId);
        console.log(`Socket ${socket.id} joined draft room: ${draftId}`);
        socket.emit('draftRoomJoined', { draftId, message: `Successfully joined draft room ${draftId}` });
    });

    socket.on('leaveDraftRoom', (draftId) => {
        if (!draftId) {
            console.log(`Socket ${socket.id} attempt to leave room with invalid draftId:`, draftId);
            return;
        }
        console.log(`Socket ${socket.id} leaving draft room: ${draftId}`);
        socket.leave(draftId);
        socket.emit('draftRoomLeft', { draftId, message: `Successfully left draft room ${draftId}` });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // TODO: Add any necessary cleanup for when a user disconnects from a room
    });
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
