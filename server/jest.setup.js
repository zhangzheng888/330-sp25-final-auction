require('dotenv').config({ path: './.env' }); // Load environment variables for tests

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// We will need to address the User model import casing issue later
// For now, assuming it will be 'user.model.js' as planned
const User = require('./src/models/user.model.js'); 
const League = require('./src/models/league.model.js');

let mongoServer;

// Before all tests, connect to MongoDB
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        // No options needed for Mongoose 6+ with modern MongoDB drivers
    });
    // console.log(`MongoDB Memory Server started at ${mongoUri}`);
});

// After all tests, disconnect from MongoDB
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // console.log('MongoDB Memory Server stopped.');
});

// Before each test, clear the relevant collections
beforeEach(async () => {
    const models = Object.values(mongoose.connection.models);
    for (const model of models) {
        await model.deleteMany({});
    }
    // Or, more explicitly if you prefer:
    // if (mongoose.models.User) await mongoose.models.User.deleteMany({});
    // if (mongoose.models.League) await mongoose.models.League.deleteMany({});
    // Add other models as they are created and imported
});
