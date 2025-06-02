const playerDAO = require('../daos/player.dao.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/app.error.js');

exports.searchPlayers = catchAsync(async (req, res, next) => {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.trim().length < 2) { // Require a minimum search term length
        return next(new AppError('Please provide a search term of at least 2 characters.', 400));
    }

    // For now, we just use a simple name search from our local DB.
    // Later, this could integrate with an external API (e.g., ESPN) to fetch and potentially store players.
    const players = await playerDAO.searchPlayersByName(searchTerm.trim());

    if (!players || players.length === 0) {
        // We can choose to return 404 or an empty array. Empty array is often better for search.
        // return next(new AppError('No players found matching your search term.', 404));
    }

    res.status(200).json({
        status: 'success',
        results: players.length,
        data: {
            players,
        },
    });
});

// Placeholder for creating a player (maybe for admin use or if fetching from external API and saving)
exports.createPlayer = catchAsync(async (req, res, next) => {
    // This would typically be more restricted (e.g., admin only)
    // or used internally when syncing with an external player DB
    const player = await playerDAO.createPlayer(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            player,
        },
    });
}); 