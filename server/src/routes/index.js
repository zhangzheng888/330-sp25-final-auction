const express = require('express');
const authRoutes = require('./authRoutes');
// const leagueRoutes = require('./leagueRoutes'); // Future league routes
// const teamRoutes = require('./teamRoutes');     // Future team routes

const router = express.Router();

router.use('/auth', authRoutes);
// router.use('/leagues', leagueRoutes);
// router.use('/teams', teamRoutes);

module.exports = router; 