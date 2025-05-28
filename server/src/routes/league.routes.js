const express = require('express');
const leagueController = require('../controllers/league.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const router = express.Router();

// All league routes should be protected and require authentication
router.use(authMiddleware.protect);

// POST /api/v1/leagues - Create a new league
router.post('/', leagueController.createLeague);

// DELETE /api/v1/leagues/:leagueId - Delete a league
// Only commissioner (or superadmin) should be able to delete
// The authorization for commissioner is handled in the controller/DAO
// We might add role-based authorization middleware here later if needed (e.g. authMiddleware.restrictTo('commissioner', 'superadmin'))
router.delete('/:leagueId', leagueController.deleteLeague);

// TODO: Add GET (all, one) and PATCH (update) routes with appropriate protections

module.exports = router; 