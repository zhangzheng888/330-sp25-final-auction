const express = require('express');
const playerController = require('../controllers/player.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const router = express.Router();

// All routes below require authentication
router.use(authMiddleware.protect);

// GET /api/v1/players/search?q=<searchTerm>
router.get('/search', playerController.searchPlayers);

// POST /api/v1/players (Example: for admin to add players, or internal sync)
// For now, let's restrict player creation to superadmin
router.post('/', authMiddleware.restrictTo('superadmin'), playerController.createPlayer);

module.exports = router; 