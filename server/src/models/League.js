const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
    leagueName: {
        type: String,
        required: [true, 'League name is required.'],
        trim: true
    },
    commissionerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Commissioner ID is required.']
    },
    leagueCode: { // Unique code for users to join this specific league
        type: String,
        required: [true, 'League code is required.'],
        unique: true,
        trim: true
    },
    teamSize: {
        type: Number,
        default: 10 // Value default, can be modified
    },
    playerBudget: {
        type: Number,
        default: 200 // Value default, can be modified
    },
    rosterSettings: { // Example: { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DEF: 1, BENCH: 5 }
        type: Map,
        of: Number
    },
    draftStatus: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    // teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] // Teams can be a separate collection referencing leagueId
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // `timestamps: true` will automatically add createdAt and updatedAt

// Ensure leagueCode is indexed for quick lookups and uniqueness
leagueSchema.index({ leagueCode: 1 });
leagueSchema.index({ commissionerId: 1 });

const League = mongoose.model('League', leagueSchema);

module.exports = League; 