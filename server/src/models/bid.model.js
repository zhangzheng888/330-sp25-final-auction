const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    draftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Draft',
        required: true,
    },
    playerId: { // The player being bid on
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
    },
    userId: { // The user who placed the bid
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teamId: { // The team of the user who placed the bid
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    bidAmount: {
        type: Number,
        required: true,
        min: [1, 'Bid amount must be at least $1'], // Assuming minimum bid is $1
    },
    isWinningBid: {
        type: Boolean,
        default: false, // Will be true for the final winning bid of an auction item
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    }
});

// Indexes to efficiently query bids
bidSchema.index({ draftId: 1, playerId: 1, timestamp: -1 }); // Get bids for a player in a draft, sorted by time
bidSchema.index({ draftId: 1, userId: 1 }); // Get all bids by a user in a draft

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid; 