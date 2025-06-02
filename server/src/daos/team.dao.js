const Team = require('../models/team.model.js');
const mongoose = require('mongoose');

async function createTeam(teamData) {
    const team = new Team(teamData);
    return team.save();
}

async function findTeamById(teamId) {
    if (!mongoose.Types.ObjectId.isValid(teamId)) return null;
    return Team.findById(teamId).populate('userId', 'username email').populate('leagueId', 'leagueName').populate('roster.player');
}

async function findTeamByUserIdAndLeagueId(userId, leagueId) {
    return Team.findOne({ userId: userId, leagueId: leagueId });
}

async function findTeamsByLeagueId(leagueId) {
    return Team.find({ leagueId: leagueId });
}

async function updateTeamRosterAndBudget(teamId, playerId, purchasePrice, newRemainingBudget) {
    if (!mongoose.Types.ObjectId.isValid(teamId) || (playerId && !mongoose.Types.ObjectId.isValid(playerId))) return null;
    
    const update = {
        $push: { roster: { player: playerId, purchasePrice: purchasePrice } },
        $set: { remainingBudget: newRemainingBudget }
    };
    // If playerId is null, it means we are just updating budget (e.g. initial setup)
    if (!playerId) {
        delete update.$push; 
    }

    return Team.findByIdAndUpdate(teamId, update, { new: true });
}

async function updateTeam(teamId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(teamId)) return null;
    return Team.findByIdAndUpdate(teamId, updateData, { new: true, runValidators: true });
}

// Add other CRUD operations as needed

module.exports = {
    createTeam,
    findTeamById,
    findTeamByUserIdAndLeagueId,
    findTeamsByLeagueId,
    updateTeamRosterAndBudget,
    updateTeam,
}; 