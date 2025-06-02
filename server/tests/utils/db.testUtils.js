const mongoose = require('mongoose');
const User = require('../../src/models/user.model.js');
const League = require('../../src/models/league.model.js');
const Player = require('../../src/models/player.model.js');
const jwt = require('jsonwebtoken');

/**
 * Finds a single document in the specified collection that matches the query.
 * Converts _id to string if it exists.
 * @param {mongoose.Model} model - The Mongoose model to query.
 * @param {object} query - The query object to match.
 * @returns {Promise<object|null>} The found document as a plain object, or null.
 */
async function findOne(model, query) {
    const result = await model.findOne(query).lean(); // .lean() returns a plain JS object
    if (result && result._id) {
        result._id = result._id.toString();
    }
    // Recursively convert any other ObjectId instances to strings if needed
    // This is a simple version; a more robust one would traverse nested objects/arrays
    for (const key in result) {
        if (result[key] instanceof mongoose.Types.ObjectId) {
            result[key] = result[key].toString();
        }
    }
    return result;
}

/**
 * Finds all documents in the specified collection that match the query.
 * Converts _id to string for all found documents.
 * @param {mongoose.Model} model - The Mongoose model to query.
 * @param {object} query - The query object to match.
 * @returns {Promise<Array<object>>} An array of found documents as plain objects.
 */
async function find(model, query) {
    const results = await model.find(query).lean();
    return results.map(doc => {
        if (doc && doc._id) {
            doc._id = doc._id.toString();
        }
        // Recursively convert any other ObjectId instances to strings if needed
        for (const key in doc) {
            if (doc[key] instanceof mongoose.Types.ObjectId) {
                doc[key] = doc[key].toString();
            }
        }
        return doc;
    });
}

// Helper to create a user and generate a token for testing
async function createTestUser(userData) {
    const user = new User(userData);
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    return { user, token };
}

// Helper to create a league for testing
async function createTestLeague(commissionerUser, overrideData = {}) {
    if (!commissionerUser || !commissionerUser._id) {
        throw new Error('Valid commissionerUser with _id is required to create a test league.');
    }
    const leagueData = {
        leagueName: overrideData.leagueName || 'Test League',
        commissionerId: commissionerUser._id,
        teamSize: overrideData.teamSize || 10,
        playerBudget: overrideData.playerBudget || 200,
        ...overrideData,
    };
    const league = new League(leagueData);
    await league.save();
    return league;
}

// Helper to create a player directly in the DB for testing purposes
async function createTestPlayer(playerData) {
    const player = new Player(playerData);
    await player.save();
    return player;
}

module.exports = {
    findOne,
    find,
    createTestUser,
    createTestLeague,
    createTestPlayer,
};
