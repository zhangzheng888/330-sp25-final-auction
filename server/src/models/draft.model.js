const mongoose = require('mongoose');

const draftStatusEnum = ['pending', 'open', 'active', 'paused', 'completed'];

const draftSchema = new mongoose.Schema({
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true,
        unique: true, // One draft per league
    },
    draftStatus: {
        type: String,
        enum: draftStatusEnum,
        default: 'pending',
        required: true,
    },
    draftOrder: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // For easier lookup
        // pickNumber: Number, // Can be inferred from array index + 1
    }],
    currentTurnIndex: {
        type: Number,
        default: 0, // Index in the draftOrder array
    },
    currentPlayerNomination: {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
        nominatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        startingBid: { type: Number, default: 0 },
        auctionStartTime: { type: Date, default: null }, // When the current player auction started
        auctionEndTime: { type: Date, default: null },   // When the current player auction is set to end
    },
    settings: {
        // Example: timePerPick: { type: Number, default: 60 }, // seconds
        nominationTimer: { type: Number, default: 30 }, // seconds for player nomination
        auctionTimer: { type: Number, default: 60 }, // seconds for bidding on a player
        // budget: { type: Number, required: true }, // This is likely tied to League settings
    },
    history: [{ // Optional: to log draft events like nominations, bids, player acquisitions
        event_type: String, // e.g., 'nomination', 'bid', 'player_won'
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        bidAmount: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

draftSchema.index({ leagueId: 1, draftStatus: 1 });

const Draft = mongoose.model('Draft', draftSchema);

module.exports = Draft; 