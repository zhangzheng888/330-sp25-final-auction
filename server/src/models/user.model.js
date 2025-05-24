const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['superadmin', 'commissioner', 'user'],
        required: [true, 'User role is required.']
    },
    leagueId: { // Reference to the league the user belongs to (if not superadmin)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        default: null
    },
    username: { // Optional: maybe display name separate from email
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allows multiple documents to have a null value for username if not provided
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // timestamps will automatically add createdAt and updatedAt

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes - unique: true in field definitions is usually sufficient for those fields.
// userSchema.index({ email: 1 }); // Redundant, email has unique:true
// userSchema.index({ username: 1 }, { unique: true, sparse: true }); // Redundant, username has unique:true and sparse:true
// Add index for leagueId if you frequently query users by league
userSchema.index({ leagueId: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
