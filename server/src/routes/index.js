const express = require('express');
const authRoutes = require('./auth.routes.js');
const leagueRoutes = require('./league.routes.js'); // Future league routes
const userRoutes = require('./user.routes.js'); // Added user routes
const playerRoutes = require('./player.routes.js'); // Added
// const draftRoutes = require('./draft.routes.js');   // Temporarily commented out
// const teamRoutes = require('./teamRoutes');     // Future team routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/leagues', leagueRoutes);
router.use('/users', userRoutes); // Added user routes
router.use('/players', playerRoutes); // Added
// router.use('/drafts', draftRoutes);   // Temporarily commented out
// router.use('/teams', teamRoutes);

module.exports = router; 