const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model.js');
const AppError = require('../utils/app.error.js');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }

        req.user = currentUser;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again!', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        next(error);
    }
};

// Middleware to restrict access to certain roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['admin', 'lead-guide']. req.user.role is set by 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403)); // 403 Forbidden
        }
        next();
    };
};

// Example: Check if the current user is the owner of a resource
// exports.checkOwnership = (Model, resourceIdField = '_id', userIdFieldInResource = 'user') => {
//     return async (req, res, next) => {
//         try {
//             const resourceId = req.params[resourceIdField] || req.body[resourceIdField] || req.query[resourceIdField];
//             if (!resourceId) {
//                 return next(new AppError(`Resource ID not found in request.`, 400));
//             }

//             const resource = await Model.findById(resourceId);

//             if (!resource) {
//                 return next(new AppError(`No resource found with that ID.`, 404));
//             }

//             // Check if the user field (e.g., 'user' or 'commissionerId') in the resource matches the logged-in user's ID
//             if (resource[userIdFieldInResource].toString() !== req.user.id.toString()) {
//                 return next(new AppError('You are not authorized to perform this action on this resource.', 403));
//             }

//             req.resource = resource; // Attach resource to request object for further use
//             next();
//         } catch (error) {
//             next(error);
//         }
//     };
// };

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