const User = require('../models/user.model.js'); // Direct model usage for simplicity here
const userDAO = require('../daos/user.dao.js');
const AppError = require('../utils/app.error.js');
const catchAsync = require('../utils/catchAsync.js');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

exports.updateUserRole = catchAsync(async (req, res, next) => {
    // This should only be accessible by superadmin
    const { role } = req.body;
    if (!role || !['superadmin', 'commissioner', 'user'].includes(role)) {
        return next(new AppError('Invalid role specified. Must be superadmin, commissioner, or user.', 400));
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
        return next(new AppError('No user found with that ID to update', 404));
    }

    // Prevent a superadmin from accidentally demoting themselves if they are the only one.
    // More complex logic might be needed for multiple superadmins.
    if (req.user.id === userToUpdate.id && req.user.role === 'superadmin' && role !== 'superadmin') {
         const superadminCount = await User.countDocuments({ role: 'superadmin' });
         if (superadminCount <= 1) {
            return next(new AppError('Cannot change the role of the only superadmin.', 400));
         }
    }

    // Prevent changing role to superadmin if the updater is not a superadmin (should be caught by restrictTo, but good defense)
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
         return next(new AppError('Only another superadmin can assign superadmin role.', 403));
    }

    userToUpdate.role = role;
    // If demoting from commissioner, or changing league, consider implications for league.commissionerId
    // For now, role update is direct.
    await userToUpdate.save({ validateBeforeSave: false }); // Bypass password validation if not changing it

    userToUpdate.password = undefined; // Don't send password back

    res.status(200).json({
        status: 'success',
        data: {
            user: userToUpdate,
        },
    });
});

// Placeholder for user deleting their own account or admin deleting a user
exports.deleteUser = catchAsync(async (req, res, next) => {
    // Superadmin can delete any user (except themselves if they are the only superadmin - add check)
    // Users might be able to delete their own accounts (different route/logic)
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
        return next(new AppError('No user found with that ID', 404));
    }

    if (req.user.id === userToDelete.id && req.user.role === 'superadmin') {
        const superadminCount = await User.countDocuments({ role: 'superadmin' });
        if (superadminCount <= 1) {
            return next(new AppError('The only superadmin cannot delete themselves.', 400));
        }
    }

    // TODO: Consider what happens to a league if its commissioner is deleted.
    // Option 1: Prevent deletion if they are an active commissioner.
    // Option 2: League becomes commissioner-less (needs handling).
    // Option 3: Assign a new commissioner (complex).

    await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
}); 