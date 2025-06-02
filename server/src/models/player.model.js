const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    espnPlayerId: { // Or any unique ID from your chosen player data source
        type: String,
        // unique: true, // Depending on if you plan to populate a master player list or create on-the-fly
        // required: true,
    },
    fullName: {
        type: String,
        required: [true, 'Player name is required.'],
        trim: true,
    },
    position: { // e.g., QB, RB, WR, TE, K, DST
        type: String,
        trim: true,
        // required: true,
    },
    nflTeam: { // e.g., KC, PHI, SF
        type: String,
        trim: true,
        // required: true,
    },
    // You can add more fields like stats, injury status, bye week etc. later
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Example of an index if you plan to search players frequently by name
playerSchema.index({ fullName: 'text' }); // For text search capabilities
// playerSchema.index({ espnPlayerId: 1 }, { unique: true, sparse: true }); // If espnPlayerId should be unique when present

const Player = mongoose.model('Player', playerSchema);

module.exports = Player; 