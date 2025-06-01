const User = require('../models/user.model.js');
// const League = require('../models/league.model.js'); // No longer needed here
const mongoose = require('mongoose');

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

/**
 * Finds a user by their ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<User|null>} The user document or null if not found.
 */
async function findUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return User.findById(userId);
}

/**
 * Updates a user by their ID.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - An object containing the fields to update.
 * @returns {Promise<User|null>} The updated user document or null if not found.
 */
async function updateUserById(userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }
    // When updating, ensure password isn't directly updated here without hashing
    // Role updates and other fields are fine.
    // If password needs updating, it should go through a specific service that hashes it.
    // For general updates like setting leagueId to null, this is fine.
    return User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true // Be cautious with runValidators if only updating specific non-validated fields
    });
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUserById,
    // findLeagueByCode, // Removed as it's now in league.dao.js
};
