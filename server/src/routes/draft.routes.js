const express = require('express');
const draftController = require('../controllers/draft.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');
const leagueController = require('../controllers/league.controller.js'); // For isCommissioner middleware

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// POST /api/v1/drafts/league/:leagueId  - Create a new draft for a league
// Only commissioner or superadmin
router.post('/league/:leagueId', draftController.createDraftForLeague);

// PATCH /api/v1/drafts/:draftId/start - Start the draft, generate order, create teams
// Only commissioner or superadmin (commissioner check is within controller based on draft's league)
router.patch('/:draftId/start', draftController.startLeagueDraft);

// GET /api/v1/drafts/:draftId - Get details of a specific draft
// Accessible to members of the league, commissioner, or superadmin
router.get('/:draftId', draftController.getDraftDetails);

// TODO: Routes for nomination, bidding (will likely involve WebSockets too)

module.exports = router; 