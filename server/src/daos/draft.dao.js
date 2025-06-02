const Draft = require('../models/draft.model.js');
const mongoose = require('mongoose');

async function createDraft(draftData) {
    const draft = new Draft(draftData);
    return draft.save();
}

async function findDraftById(draftId) {
    if (!mongoose.Types.ObjectId.isValid(draftId)) return null;
    return Draft.findById(draftId)
        .populate('leagueId', 'leagueName commissionerId playerBudget')
        .populate('draftOrder.userId', 'username email')
        .populate('draftOrder.teamId', 'teamName remainingBudget')
        .populate('currentPlayerNomination.playerId', 'fullName position nflTeam')
        .populate('currentPlayerNomination.nominatedByUserId', 'username');
}

async function findDraftByLeagueId(leagueId) {
    if (!mongoose.Types.ObjectId.isValid(leagueId)) return null;
    return Draft.findOne({ leagueId })
        .populate('leagueId', 'leagueName commissionerId playerBudget')
        .populate('draftOrder.userId', 'username email')
        .populate('draftOrder.teamId', 'teamName remainingBudget')
        .populate('currentPlayerNomination.playerId', 'fullName position nflTeam')
        .populate('currentPlayerNomination.nominatedByUserId', 'username');
}

async function updateDraft(draftId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(draftId)) return null;
    return Draft.findByIdAndUpdate(draftId, updateData, { new: true, runValidators: true })
        .populate('leagueId', 'leagueName commissionerId playerBudget')
        .populate('draftOrder.userId', 'username email')
        .populate('draftOrder.teamId', 'teamName remainingBudget')
        .populate('currentPlayerNomination.playerId', 'fullName position nflTeam')
        .populate('currentPlayerNomination.nominatedByUserId', 'username');
}

// Add more specific update functions as needed, e.g., for nominations, bids, changing turn

module.exports = {
    createDraft,
    findDraftById,
    findDraftByLeagueId,
    updateDraft,
}; 