const express = require('express');
const leagueController = require('../controllers/league.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const router = express.Router();

// All routes below this are protected
router.use(authMiddleware.protect);

router.route('/')
    .get(leagueController.getAllLeagues) // Public for logged-in users, or restrict further if needed
    .post(authMiddleware.restrictTo('superadmin', 'commissioner'), leagueController.createLeague);

router.route('/:id')
    .get(leagueController.getLeague) // Public for logged-in users, or restrict if league details are private
    .patch(
        authMiddleware.restrictTo('superadmin', 'commissioner'), 
        (req, res, next) => { // Conditional middleware for commissioner check
            if (req.user.role === 'commissioner') {
                return leagueController.isCommissioner(req, res, next);
            }
            next(); // Superadmin doesn't need to be the commissioner
        },
        leagueController.updateLeague
    )
    .delete(
        authMiddleware.restrictTo('superadmin', 'commissioner'),
        (req, res, next) => { // Conditional middleware for commissioner check
            if (req.user.role === 'commissioner') {
                return leagueController.isCommissioner(req, res, next);
            }
            next(); // Superadmin doesn't need to be the commissioner
        },
        leagueController.deleteLeague
    );

// Route for a commissioner to remove a user from their league
router.delete(
    '/:leagueId/users/:userId',
    authMiddleware.restrictTo('commissioner', 'superadmin'), // superadmin for potential moderation
    leagueController.isCommissioner, // Ensures the requester is the commissioner of :leagueId
    leagueController.removeUserFromLeague
);

// TODO: Routes for managing users within a league (e.g., by commissioner)
// Example: POST /:leagueId/users - to add/invite (if not using leagueCode for self-join)
// Example: DELETE /:leagueId/users/:userId - for commissioner to remove a user

module.exports = router; 