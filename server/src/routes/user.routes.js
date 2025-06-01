const express = require('express');
const userController = require('../controllers/user.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const router = express.Router();

// All user routes should be protected, typically by superadmin or the user themselves
router.use(authMiddleware.protect);

// Superadmin routes for managing users
router.route('/')
    .get(authMiddleware.restrictTo('superadmin'), userController.getAllUsers);

router.route('/:id')
    .get(authMiddleware.restrictTo('superadmin'), userController.getUser)
    // Superadmin can delete any user (with safety checks in controller)
    .delete(authMiddleware.restrictTo('superadmin'), userController.deleteUser);

router.route('/:id/role')
    .patch(authMiddleware.restrictTo('superadmin'), userController.updateUserRole);

// TODO: Routes for users to manage their own profile (e.g., update password, view their own details)
// Example: router.patch('/updateMe', userController.updateMe);
// Example: router.delete('/deleteMe', userController.deleteMe);
// Example: router.get('/me', userController.getMe, userController.getUser); // getMe sets req.params.id = req.user.id

module.exports = router; 