const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model.js');
const AppError = require('../utils/app.error.js');

exports.protect = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return next(
                new AppError('You are not logged in! Please log in to get access.', 401)
            );
        }

        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError(
                    'The user belonging to this token does no longer exist.',
                    401
                )
            );
        }

        // 4) Check if user changed password after the token was issued
        // (This assumes your User model has a changedPasswordAfter instance method)
        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return next(
                new AppError('User recently changed password! Please log in again.', 401)
            );
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        res.locals.user = currentUser; // For template engines if used
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again!', 401));
        } else if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        next(error);
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['admin', 'lead-guide']. req.user.role is from protect middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action.', 403)
            );
        }
        next();
    };
};

// Optional: Middleware to check if the current user is the owner of a document
// exports.isOwner = (Model, foreignKey = 'userId') => async (req, res, next) => {
//     const doc = await Model.findById(req.params.id);
//     if (!doc) {
//         return next(new AppError('No document found with that ID', 404));
//     }
//     if (doc[foreignKey].toString() !== req.user.id.toString()) {
//         return next(new AppError('You do not have permission to perform this action on this document', 403));
//     }
//     next();
// }; 