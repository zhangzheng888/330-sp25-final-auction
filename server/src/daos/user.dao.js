const User = require('../models/user.model.js');
const League = require('../models/league.model.js');

/**
 * Finds a league by its unique league code.
 * @param {string} leagueCode - The unique code of the league.
 * @returns {Promise<League|null>} The league document or null if not found.
 */
async function findLeagueByCode(leagueCode) {
    return League.findOne({ leagueCode });
}

/**
 * Creates a new user in the database.
 * @param {object} userData - Object containing user details (email, password, role, leagueId).
 * @returns {Promise<User>} The created user document.
 * @throws {Error} If email already exists or other database errors occur.
 */
async function createUser(userData) {
    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        const error = new Error('Email already exists.');
        error.statusCode = 409; // Conflict
        throw error;
    }

    const user = new User(userData);
    return user.save();
}

/**
 * Finds a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<User|null>} The user document or null if not found.
 */
async function findUserByEmail(email) {
    return User.findOne({ email });
}


module.exports = {
    createUser,
    findUserByEmail,
    findLeagueByCode,
};
