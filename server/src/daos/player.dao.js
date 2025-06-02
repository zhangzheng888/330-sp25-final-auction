const Player = require('../models/player.model.js');

async function createPlayer(playerData) {
    const player = new Player(playerData);
    return player.save();
}

async function findPlayerById(playerId) {
    return Player.findById(playerId);
}

async function findPlayerByEspnId(espnPlayerId) {
    return Player.findOne({ espnPlayerId });
}

// For searching players by name (case-insensitive)
async function searchPlayersByName(searchTerm, limit = 10) {
    // Using a regex for a simple case-insensitive search on fullName
    // For more advanced search, you might use the $text index if it was set up on name fields
    return Player.find({
        fullName: { $regex: searchTerm, $options: 'i' } 
    }).limit(limit);
}

// Add other CRUD operations or specific queries as needed

module.exports = {
    createPlayer,
    findPlayerById,
    findPlayerByEspnId,
    searchPlayersByName,
}; 