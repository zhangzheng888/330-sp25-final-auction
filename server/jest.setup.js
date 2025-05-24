require('dotenv').config({ path: './.env' }); // Load environment variables for tests

const mongoose = require('mongoose');
// We will need to address the User model import casing issue later
// For now, assuming it will be 'user.model.js' as planned
const User = require('./src/models/user.model.js'); 
const League = require('./src/models/league.model.js');

// Before all tests, connect to MongoDB
beforeAll(async () => {
    // MONGO_URL is typically set by @shelf/jest-mongodb/environment
    if (!process.env.MONGO_URL) {
        // Fallback if MONGO_URL is not set by the environment (e.g. if mongodbMemoryServerOptions autoStart is false or misconfigured)
        // This often indicates a misconfiguration with @shelf/jest-mongodb if using its environment
        console.warn('MONGO_URL not set by test environment. Ensure @shelf/jest-mongodb is configured correctly.');
        // As a fallback, you might try to use the config from jest.config.js if absolutely necessary,
        // but it's better to rely on the environment variable provided by @shelf/jest-mongodb.
        // For now, we'll throw an error to highlight the setup issue.
        throw new Error('MongoDB test server URL not available. Check Jest and @shelf/jest-mongodb setup.');
    }
    await mongoose.connect(process.env.MONGO_URL, {
        // useNewUrlParser: true, // Deprecated
        // useUnifiedTopology: true, // Deprecated
    });
});

// After all tests, disconnect from MongoDB
afterAll(async () => {
    await mongoose.disconnect();
    // If @shelf/jest-mongodb doesn't automatically stop the server, you might need to do it manually
    // This depends on the version and configuration of @shelf/jest-mongodb
    // if (global.__MONGOD__) { // Check if the mongo instance is exposed globally
    //    await global.__MONGOD__.stop();
    // }
});

// Before each test, clear the relevant collections
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
    // Or, more explicitly if you prefer:
    // if (mongoose.models.User) await mongoose.models.User.deleteMany({});
    // if (mongoose.models.League) await mongoose.models.League.deleteMany({});
    // Add other models as they are created and imported
});
