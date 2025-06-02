const Bid = require('../models/bid.model.js');
const mongoose = require('mongoose');

async function createBid(bidData) {
    const bid = new Bid(bidData);
    return bid.save();
}

async function findBidsByDraftAndPlayer(draftId, playerId) {
    if (!mongoose.Types.ObjectId.isValid(draftId) || !mongoose.Types.ObjectId.isValid(playerId)) return [];
    return Bid.find({ draftId, playerId })
        .sort({ timestamp: -1 }) // Get newest bids first
        .populate('userId', 'username')
        .populate('teamId', 'teamName');
}

async function findHighestBidForPlayer(draftId, playerId) {
    if (!mongoose.Types.ObjectId.isValid(draftId) || !mongoose.Types.ObjectId.isValid(playerId)) return null;
    return Bid.findOne({ draftId, playerId })
        .sort({ bidAmount: -1, timestamp: 1 }) // Highest bid, then earliest of those if tied
        .populate('userId', 'username')
        .populate('teamId', 'teamName');
}

async function findBidsByDraft(draftId) {
    if (!mongoose.Types.ObjectId.isValid(draftId)) return [];
    return Bid.find({ draftId })
        .sort({ timestamp: -1 })
        .populate('userId', 'username')
        .populate('teamId', 'teamName')
        .populate('playerId', 'fullName');
}

// Potentially a function to mark a bid as winning, though this might be handled in draft logic directly
// async function markBidAsWinning(bidId) {
//     return Bid.findByIdAndUpdate(bidId, { isWinningBid: true }, { new: true });
// }

module.exports = {
    createBid,
    findBidsByDraftAndPlayer,
    findHighestBidForPlayer,
    findBidsByDraft,
    // markBidAsWinning,
}; 