const express = require('express');
const leagueController = require('../controllers/league.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const router = express.Router();

// All routes below are protected by default by being included after this middleware if needed globally for this router
// router.use(authMiddleware.protect); // Or apply protect selectively

router.post(
    '/',
    authMiddleware.protect, // Ensure user is logged in
    authMiddleware.restrictTo('commissioner', 'superadmin'), // Only commissioners or superadmins can create
    leagueController.createLeague
);

router.delete(
    '/:leagueId',
    authMiddleware.protect, // Ensure user is logged in
    // Specific authorization (superadmin or owner commissioner) is handled in the controller
    leagueController.deleteLeague 
);

// TODO: Add GET (all, one) and PATCH (update) routes with appropriate protections

module.exports = router; 