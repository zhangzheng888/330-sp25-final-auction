const draftDAO = require('../daos/draft.dao.js');
const leagueDAO = require('../daos/league.dao.js');
const teamDAO = require('../daos/team.dao.js');
const userDAO = require('../daos/user.dao.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/app.error.js');

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