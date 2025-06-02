const draftDAO = require('../daos/draft.dao.js');
const leagueDAO = require('../daos/league.dao.js');
const teamDAO = require('../daos/team.dao.js');
const userDAO = require('../daos/user.dao.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/app.error.js');
const mongoose = require('mongoose');
const playerDAO = require('../daos/player.dao.js');
const League = require('../models/league.model.js');

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

exports.createDraftForLeague = catchAsync(async (req, res, next) => {
    const { leagueId } = req.params;
    const { nominationTimer, auctionTimer } = req.body; // Optional custom settings

    const league = await leagueDAO.findLeagueById(leagueId);
    if (!league) {
        return next(new AppError('League not found.', 404));
    }

    // Check if user is commissioner or superadmin
    if (req.user.id.toString() !== league.commissionerId.toString() && req.user.role !== 'superadmin') {
        return next(new AppError('Only the league commissioner or a superadmin can create a draft.', 403));
    }

    // Check if a draft already exists for this league
    const existingDraft = await draftDAO.findDraftByLeagueId(leagueId);
    if (existingDraft) {
        return next(new AppError('A draft already exists for this league.', 400));
    }

    const draftSettings = {
        nominationTimer: nominationTimer || 30, // Default values
        auctionTimer: auctionTimer || 60,
    };

    const newDraft = await draftDAO.createDraft({
        leagueId: leagueId,
        draftStatus: 'pending', // Initial status
        settings: draftSettings,
    });

    res.status(201).json({
        status: 'success',
        data: {
            draft: newDraft,
        },
    });
});

exports.startLeagueDraft = catchAsync(async (req, res, next) => {
    const { draftId } = req.params;

    let draft = await draftDAO.findDraftById(draftId);
    if (!draft) {
        return next(new AppError('Draft not found.', 404));
    }
    const league = draft.leagueId; // Populated from findDraftById

    // Check if user is commissioner of this league or superadmin
    if (req.user.id.toString() !== league.commissionerId.toString() && req.user.role !== 'superadmin') {
        return next(new AppError('Only the league commissioner or a superadmin can start the draft.', 403));
    }

    if (draft.draftStatus !== 'pending') {
        return next(new AppError(`Draft cannot be started. Current status: ${draft.draftStatus}.`, 400));
    }

    // 1. Get all users in the league
    const usersInLeague = await userDAO.findUsersByLeagueId(league.id);
    if (!usersInLeague || usersInLeague.length === 0) {
        return next(new AppError('No users found in this league to start the draft.', 400));
    }
    
    // 2. Create Teams for each user if they don't exist, set initial budget
    const teamCreationPromises = usersInLeague.map(async (user) => {
        let team = await teamDAO.findTeamByUserIdAndLeagueId(user.id, league.id);
        if (!team) {
            team = await teamDAO.createTeam({
                userId: user.id,
                leagueId: league.id,
                teamName: `${user.username}\'s Team`, // Default team name
                remainingBudget: league.playerBudget, // Set budget from league settings
            });
        } else {
            // If team exists, ensure budget is reset/set from league settings for the draft
            team = await teamDAO.updateTeam(team.id, { remainingBudget: league.playerBudget, roster: [] });
        }
        return { userId: user.id, teamId: team.id, username: user.username }; // Include username for draft order
    });
    
    const teamsForDraftOrder = await Promise.all(teamCreationPromises);

    // 3. Generate randomized draft order
    const shuffledTeams = shuffleArray(teamsForDraftOrder);
    const draftOrder = shuffledTeams.map(t => ({ userId: t.userId, teamId: t.teamId }));

    // 4. Update Draft document
    const updatedDraft = await draftDAO.updateDraft(draftId, {
        draftOrder: draftOrder,
        draftStatus: 'active', // Or 'open' if there's a pre-nomination phase
        currentTurnIndex: 0,
    });

    res.status(200).json({
        status: 'success',
        message: 'Draft started successfully and draft order generated.',
        data: {
            draft: updatedDraft,
        },
    });
});

exports.getDraftDetails = catchAsync(async (req, res, next) => {
    const { draftId } = req.params; // Can be leagueId too, then find draft by leagueId

    const draft = await draftDAO.findDraftById(draftId); // Or findDraftByLeagueId if using leagueId in route
    
    if (!draft) {
        return next(new AppError('Draft not found.', 404));
    }

    // Security: Check if user is part of this league to view draft details
    // This requires knowing the leagueId from the draft and checking if req.user.leagueId matches
    // or if the user is listed in draft.draftOrder
    const isUserInLeague = draft.leagueId.id.toString() === req.user.leagueId?.toString() || 
                           draft.draftOrder.some(orderItem => orderItem.userId.id.toString() === req.user.id.toString());

    if (!isUserInLeague && req.user.role !== 'superadmin' && req.user.id.toString() !== draft.leagueId.commissionerId.toString()) {
        return next(new AppError('You are not authorized to view this draft.', 403));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            draft,
        },
    });
});

exports.nominatePlayer = catchAsync(async (req, res, next) => {
    const { draftId } = req.params;
    const { playerId, startingBid } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(draftId) || !mongoose.Types.ObjectId.isValid(playerId)) {
        return next(new AppError('Invalid Draft or Player ID format', 400));
    }

    const draft = await draftDAO.findDraftById(draftId);
    if (!draft) {
        return next(new AppError('No draft found with that ID', 404));
    }

    if (draft.draftStatus !== 'active') {
        return next(new AppError('Draft is not active. Cannot nominate player.', 400));
    }

    if (draft.currentPlayerNomination && draft.currentPlayerNomination.playerId && draft.currentPlayerNomination.auctionEndTime && new Date(draft.currentPlayerNomination.auctionEndTime) > new Date()) {
        return next(new AppError('Another player is currently up for auction.', 400));
    }

    const currentTurnUserEntry = draft.draftOrder[draft.currentTurnIndex];
    // If draftOrder.userId is populated, currentTurnUserEntry.userId is a User object.
    // If not populated, it's an ObjectId.
    // req.user.id is a string.

    let currentTurnUserIdString;
    if (currentTurnUserEntry.userId && currentTurnUserEntry.userId._id) { // Check if populated
        currentTurnUserIdString = currentTurnUserEntry.userId._id.toString();
    } else if (currentTurnUserEntry.userId) { // Assume it's an ObjectId if not populated
        currentTurnUserIdString = currentTurnUserEntry.userId.toString();
    } else {
        return next(new AppError('Current turn user ID not found in draft order.', 500)); // Should not happen
    }

    if (!currentTurnUserEntry || currentTurnUserIdString !== userId) {
        return next(new AppError('It is not your turn to nominate a player.', 403));
    }

    const leagueIdForTeamLookup = draft.leagueId._id ? draft.leagueId._id : draft.leagueId;
    const nominatorTeam = await teamDAO.findTeamByUserIdAndLeagueId(userId, leagueIdForTeamLookup);
    if (!nominatorTeam) {
        return next(new AppError('Nominating user does not have a team in this league.', 404));
    }

    const playerToNominate = await playerDAO.findPlayerById(playerId);
    if (!playerToNominate) {
        return next(new AppError('Player to nominate not found.', 404));
    }
    
    const numericStartingBid = Number(startingBid);
    if (isNaN(numericStartingBid) || numericStartingBid < 1) {
        return next(new AppError('Starting bid must be a number and at least $1.', 400));
    }

    if (nominatorTeam.remainingBudget < numericStartingBid) {
        return next(new AppError(`Your remaining budget ($${nominatorTeam.remainingBudget}) is less than the starting bid ($${numericStartingBid}).`, 400));
    }

    const teamsInLeague = await teamDAO.findTeamsByLeagueId(leagueIdForTeamLookup);
    const isPlayerDrafted = teamsInLeague.some(team => 
        team.roster.some(rosterItem => rosterItem.player.toString() === playerId)
    );
    if (isPlayerDrafted) {
        return next(new AppError('This player has already been drafted in your league.', 400));
    }

    const auctionStartTime = new Date();
    const auctionEndTime = new Date(auctionStartTime.getTime() + draft.settings.auctionTimer * 1000);

    draft.currentPlayerNomination = {
        playerId: playerToNominate._id,
        nominatedByUserId: userId,
        nominatedByTeamId: nominatorTeam._id,
        startingBid: numericStartingBid,
        currentBidAmount: numericStartingBid,
        currentHighestBidderTeamId: nominatorTeam._id,
        auctionStartTime,
        auctionEndTime,
    };

    draft.history.push({
        event: 'nomination',
        userId,
        teamId: nominatorTeam._id,
        playerId: playerToNominate._id,
        bidAmount: numericStartingBid,
        timestamp: new Date(),
        description: `${nominatorTeam.teamName} (User: ${req.user.username}) nominated ${playerToNominate.fullName} for $${numericStartingBid}.`
    });
    
    const updatedDraft = await draftDAO.updateDraft(draft._id, draft);

    res.status(200).json({
        status: 'success',
        message: 'Player nominated successfully',
        data: {
            draft: updatedDraft,
        },
    });
});

exports.placeBid = catchAsync(async (req, res, next) => {
    const { draftId } = req.params;
    const { bidAmount } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return next(new AppError('Invalid Draft ID format', 400));
    }

    const draft = await draftDAO.findDraftById(draftId);
    if (!draft) {
        return next(new AppError('No draft found with that ID', 404));
    }

    if (draft.draftStatus !== 'active') {
        return next(new AppError('Draft is not active. Cannot place bid.', 400));
    }

    if (!draft.currentPlayerNomination || !draft.currentPlayerNomination.playerId || !draft.currentPlayerNomination.auctionEndTime) {
        return next(new AppError('No player is currently up for auction.', 400));
    }

    if (new Date(draft.currentPlayerNomination.auctionEndTime) <= new Date()) {
        return next(new AppError('The auction for this player has ended.', 400));
    }

    const numericBidAmount = Number(bidAmount);
    if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
        return next(new AppError('Invalid bid amount.', 400));
    }

    if (numericBidAmount <= draft.currentPlayerNomination.currentBidAmount) {
        return next(new AppError(`Your bid ($${numericBidAmount}) must be higher than the current bid ($${draft.currentPlayerNomination.currentBidAmount}).`, 400));
    }

    // leagueId might be populated or just an ID. Ensure we get the actual ID string.
    const leagueIdForTeamLookup = draft.leagueId._id ? draft.leagueId._id.toString() : draft.leagueId.toString();
    const biddingTeam = await teamDAO.findTeamByUserIdAndLeagueId(userId, leagueIdForTeamLookup);

    if (!biddingTeam) {
        return next(new AppError('Bidding user does not have a team in this league.', 404));
    }
    
    // Prevent user from bidding if they are already the highest bidder
    if (draft.currentPlayerNomination.currentHighestBidderTeamId && draft.currentPlayerNomination.currentHighestBidderTeamId.toString() === biddingTeam._id.toString()) {
        return next(new AppError('You are already the highest bidder.', 400));
    }

    if (biddingTeam.remainingBudget < numericBidAmount) {
        return next(new AppError(`Your remaining budget ($${biddingTeam.remainingBudget}) is insufficient for this bid ($${numericBidAmount}).`, 400));
    }

    draft.currentPlayerNomination.currentBidAmount = numericBidAmount;
    draft.currentPlayerNomination.currentHighestBidderTeamId = biddingTeam._id;

    // Extend auction time if bid is placed in the last, e.g., 10 seconds of auctionTimer
    const auctionTimeRemaining = (new Date(draft.currentPlayerNomination.auctionEndTime).getTime() - new Date().getTime()) / 1000;
    const AUCTION_EXTENSION_SECONDS = 10; // Make this configurable from draft.settings if desired
    if (auctionTimeRemaining < AUCTION_EXTENSION_SECONDS) {
        draft.currentPlayerNomination.auctionEndTime = new Date(new Date().getTime() + AUCTION_EXTENSION_SECONDS * 1000);
    }
    
    const playerBeingAuctioned = await playerDAO.findPlayerById(draft.currentPlayerNomination.playerId);

    draft.history.push({
        event: 'bid',
        userId,
        teamId: biddingTeam._id,
        playerId: draft.currentPlayerNomination.playerId,
        bidAmount: numericBidAmount,
        timestamp: new Date(),
        description: `${biddingTeam.teamName} (User: ${req.user.username}) bid $${numericBidAmount} for ${playerBeingAuctioned ? playerBeingAuctioned.fullName : 'Player ID ' + draft.currentPlayerNomination.playerId}.`
    });

    const updatedDraft = await draftDAO.updateDraft(draft._id, draft);

    res.status(200).json({
        status: 'success',
        message: 'Bid placed successfully',
        data: {
            draft: updatedDraft,
        },
    });
});

exports.processAuctionOutcome = catchAsync(async (req, res, next) => {
    const { draftId } = req.params;
    // const userId = req.user.id; // For logging who triggered it, if manual. Not used directly for now.

    if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return next(new AppError('Invalid Draft ID format', 400));
    }

    const draft = await draftDAO.findDraftById(draftId);
    if (!draft) {
        return next(new AppError('No draft found with that ID', 404));
    }

    if (draft.draftStatus !== 'active') {
        return next(new AppError('Draft is not active. Cannot process auction.', 400));
    }

    const nomination = draft.currentPlayerNomination;
    if (!nomination || !nomination.playerId) {
        return next(new AppError('No player is currently nominated to process.', 400));
    }

    // It might be desirable for an admin/commish to force process, but for now, strict time check.
    if (new Date(nomination.auctionEndTime) > new Date()) {
        return next(new AppError('Auction for this player has not ended yet.', 400));
    }

    const winningTeamId = nomination.currentHighestBidderTeamId;
    const winningBidAmount = nomination.currentBidAmount;
    const wonPlayerId = nomination.playerId;

    const playerWon = await playerDAO.findPlayerById(wonPlayerId);
    if (!playerWon) {
        return next(new AppError('Player data for the won player not found. Critical error.', 500));
    }

    let winningTeam;
    let message;

    if (winningTeamId && winningBidAmount > 0) { // Ensure there was a valid bid
        winningTeam = await teamDAO.findTeamById(winningTeamId);
        if (!winningTeam) {
            return next(new AppError('Winning team not found. Critical error.', 500));
        }

        // Update winning team's roster and budget
        // Ensure teamDAO.updateTeam can handle this update correctly, or use a specific DAO function.
        // For now, assuming a general update is okay if Team model allows direct roster/budget set.
        const newRosterEntry = { player: wonPlayerId, purchasePrice: winningBidAmount };
        
        // It's safer to call a dedicated DAO method if available, e.g., teamDAO.addPlayerToRosterAndAdjustBudget
        // For now, direct manipulation and save/update via generic method.
        const updatedTeam = await teamDAO.updateTeam(winningTeam._id, {
            $push: { roster: newRosterEntry },
            $inc: { remainingBudget: -winningBidAmount }
        });

        if(!updatedTeam){
            return next(new AppError('Failed to update winning team roster and budget.', 500));
        }

        draft.history.push({
            event: 'playerWon',
            teamId: winningTeamId,
            playerId: wonPlayerId,
            bidAmount: winningBidAmount,
            timestamp: new Date(),
            description: `${winningTeam.teamName} won ${playerWon.fullName} for $${winningBidAmount}.`
        });
        message = `Auction processed. ${playerWon.fullName} awarded to ${winningTeam.teamName}.`;

    } else {
        draft.history.push({
            event: 'unsold',
            userId: nomination.nominatedByUserId, // Person who nominated
            playerId: wonPlayerId,
            bidAmount: nomination.startingBid, 
            timestamp: new Date(),
            description: `${playerWon.fullName} went unsold. Nominated with starting bid $${nomination.startingBid}.`
        });
        message = `Auction processed. ${playerWon.fullName} was not sold.`;
    }

    draft.currentPlayerNomination = { 
        playerId: null, nominatedByUserId: null, nominatedByTeamId: null,
        startingBid: 1, currentBidAmount: null, currentHighestBidderTeamId: null,
        auctionStartTime: null, auctionEndTime: null
    };
    draft.currentTurnIndex = (draft.currentTurnIndex + 1) % draft.draftOrder.length;

    const updatedDraft = await draftDAO.updateDraft(draft._id, draft);

    res.status(200).json({
        status: 'success',
        message,
        data: {
            draft: updatedDraft,
        },
    });
}); 