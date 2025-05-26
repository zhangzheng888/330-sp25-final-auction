const League = require('../models/league.model.js');
const AppError = require('../utils/app.error.js');

/**
 * Creates a new league in the database.
 * @param {object} leagueData - Object containing league details.
 * @returns {Promise<League>} The created league document.
 */
async function createLeague(leagueData) {
    try {
        const newLeague = await League.create(leagueData);
        return newLeague;
    } catch (error) {
        // Handle potential duplicate leagueCode errors if not auto-generated or other DB errors
        if (error.code === 11000) {
            throw new AppError('League code might already exist or another unique field conflict.', 409);
        }
        throw error; // Rethrow other errors
    }
}

/**
 * Finds a league by its ID.
 * @param {string} leagueId - The ID of the league.
 * @returns {Promise<League|null>} The league document or null if not found.
 */
async function findLeagueById(leagueId) {
    return League.findById(leagueId);
}

/**
 * Deletes a league by its ID.
 * @param {string} leagueId - The ID of the league to delete.
 * @returns {Promise<League|null>} The deleted league document or null if not found.
 */
async function deleteLeagueById(leagueId) {
    return League.findByIdAndDelete(leagueId);
}

module.exports = {
    createLeague,
    findLeagueById,
    deleteLeagueById,
}; 