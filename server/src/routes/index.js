const express = require('express');
const authRoutes = require('./auth.routes.js');
const leagueRoutes = require('./league.routes.js'); // Future league routes
// const teamRoutes = require('./teamRoutes');     // Future team routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/leagues', leagueRoutes);
// router.use('/teams', teamRoutes);

module.exports = router; 