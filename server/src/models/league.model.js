const mongoose = require('mongoose');
const crypto = require('crypto'); // For generating unique league codes

const leagueSchema = new mongoose.Schema({
    leagueName: {
        type: String,
        required: [true, 'League name is required.'],
        trim: true,
        minlength: [3, 'League name must be at least 3 characters long.'],
        maxlength: [100, 'League name cannot exceed 100 characters.']
    },
    commissionerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Commissioner ID is required.']
    },
    leagueCode: {
        type: String,
        unique: true,
        // Will be auto-generated if not provided
    },
    teamSize: {
        type: Number,
        required: [true, 'Team size is required.'],
        min: [4, 'Team size must be at least 4.'],
        max: [20, 'Team size cannot exceed 20.'] // Adjust max as needed
    },
    playerBudget: {
        type: Number,
        required: [true, 'Player budget is required.'],
        min: [0, 'Player budget cannot be negative.'],
        default: 200 // Default budget, adjust as needed
    },
    // Add other league settings as needed, e.g.:
    // scoringType: { type: String, enum: ['PPR', 'Standard', 'HalfPPR'], default: 'PPR' },
    // rosterSpots: { type: Map, of: Number }, // e.g. { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, BENCH: 6 }
    // draftStatus: { type: String, enum:['pending', 'open', 'in-progress', 'completed'], default: 'pending'}
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Pre-save hook to generate a unique league code if not provided
leagueSchema.pre('save', function(next) {
    if (!this.leagueCode) {
        // Generate a random 6-character uppercase alphanumeric code
        this.leagueCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    next();
});

// Indexes
// leagueSchema.index({ leagueCode: 1 }); // unique:true in schema definition is sufficient
leagueSchema.index({ commissionerId: 1 });

const League = mongoose.model('League', leagueSchema);

module.exports = League; 