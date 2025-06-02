const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Assuming one team per user in the system for now
                      // If a user can have teams in multiple leagues, this needs to be a compound unique index with leagueId or removed.
    },
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true,
    },
    teamName: {
        type: String,
        required: [true, 'Team name is required.'],
        trim: true,
        default: function() {
            // Consider setting a default team name, perhaps based on username if available early enough
            // or just a generic "My Team"
            return 'My Team'; // Placeholder
        }
    },
    roster: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        purchasePrice: { type: Number, default: 0 }
    }],
    remainingBudget: {
        type: Number,
        required: true,
        // Default will be set by league settings when team is created for a draft
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a user can only have one team per league
teamSchema.index({ userId: 1, leagueId: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team; 