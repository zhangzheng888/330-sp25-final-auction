const leagueDAO = require('../daos/league.dao.js');
const userDAO = require('../daos/user.dao.js');
const AppError = require('../utils/app.error.js');
const catchAsync = require('../utils/catchAsync.js');

// Middleware to check if the current user is the commissioner of the league
exports.isCommissioner = catchAsync(async (req, res, next) => {
    const leagueId = req.params.id || req.params.leagueId;
    if (!leagueId) {
        return next(new AppError('League ID not found in request parameters.', 400));
    }
    const league = await leagueDAO.findLeagueById(leagueId);

    if (!league) {
        return next(new AppError('No league found with that ID.', 404));
    }

    if (league.commissionerId.toString() !== req.user.id.toString()) {
        return next(new AppError('You are not the commissioner of this league.', 403));
    }

    req.league = league; 
    next();
});

/**
 * Creates a new league.
 * The user making the request will be set as the commissioner.
 */
exports.createLeague = catchAsync(async (req, res, next) => {
    const { leagueName, teamSize, playerBudget } = req.body;

    if (!leagueName || !teamSize || !playerBudget) {
        return next(new AppError('League name, team size, and player budget are required.', 400));
    }

    const newLeague = await leagueDAO.createLeague({
        leagueName,
        commissionerId: req.user.id, 
        teamSize,
        playerBudget,
    });

    res.status(201).json({
        status: 'success',
        data: {
            league: newLeague,
        },
    });
});

exports.getAllLeagues = catchAsync(async (req, res, next) => {
    const leagues = await leagueDAO.findAllLeagues();
    res.status(200).json({
        status: 'success',
        results: leagues.length,
        data: {
            leagues,
        },
    });
});

exports.getLeague = catchAsync(async (req, res, next) => {
    const league = await leagueDAO.findLeagueById(req.params.id);
    if (!league) {
        return next(new AppError('No league found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            league,
        },
    });
});

exports.updateLeague = catchAsync(async (req, res, next) => {
    const leagueId = req.params.id;
    let allowedUpdates = { ...req.body };

    if (req.user.role === 'commissioner') {
        const { leagueName, teamSize, playerBudget } = req.body;
        allowedUpdates = { leagueName, teamSize, playerBudget }; 
        Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
        if (Object.keys(allowedUpdates).length === 0) {
            return next(new AppError('No valid fields provided for update by commissioner.', 400));
        }
    }

    const updatedLeague = await leagueDAO.updateLeagueById(leagueId, allowedUpdates);

    if (!updatedLeague) {
        return next(new AppError('No league found with that ID to update', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            league: updatedLeague,
        },
    });
});

exports.deleteLeague = catchAsync(async (req, res, next) => {
    const league = await leagueDAO.deleteLeagueById(req.params.id);
    if (!league) {
        return next(new AppError('No league found with that ID to delete', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.removeUserFromLeague = catchAsync(async (req, res, next) => {
    const { leagueId, userId } = req.params;
    const user = await userDAO.findUserById(userId);

    if (!user) {
        return next(new AppError('User to remove not found.', 404));
    }
    if (!user.leagueId || user.leagueId.toString() !== leagueId) {
        return next(new AppError('User is not a member of this league.', 400));
    }

    if (user.id.toString() === req.league.commissionerId.toString()) {
        return next(new AppError('Commissioner cannot remove themselves from the league. Delete the league or transfer ownership.', 400));
    }

    await userDAO.updateUserById(userId, { leagueId: null });

    res.status(200).json({
        status: 'success',
        message: 'User removed from league successfully.'
    });
});

// TODO: Add other league controller methods (getLeague, getAllLeagues, updateLeague) 