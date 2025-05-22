const jwt = require('jsonwebtoken');
const userDAO = require('../daos/userDAO');
const AppError = require('../utils/appError'); // TODO

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
};

exports.register = async (req, res, next) => {
    try {
        const { email, password, leagueCode, username } = req.body;

        if (!email || !password) {
            return next(new AppError('Email and password are required.', 400));
        }

        let leagueId = null;
        let role = 'user'; // Default role

        // If a leagueCode is provided, try to find the league
        if (leagueCode) {
            const league = await userDAO.findLeagueByCode(leagueCode);
            if (!league) {
                return next(new AppError('Invalid league code.', 400));
            }
            leagueId = league._id;
            // For now, anyone registering with a league code is a 'user'.
            // Commissioner assignment logic can be handled separately (e.g., by superadmin).
        } else {
            // Scenario: User registering without a league code.
            // This could be a superadmin, or a user who will join/create a league later.
            // For now, not allow general registration without a league code unless defined.
            // To allow superadmin creation, this route would need protection or a special flag.
            return next(new AppError('League code is required for registration.', 400));
            // If I allow registration without a league code for a different role:
            // role = 'some_other_role_if_no_league_code';
        }

        const newUser = await userDAO.createUser({
            email,
            password,
            role,
            leagueId,
            username, // Optional username from request
        });

        const token = generateToken(newUser._id);

        // Remove password from output
        newUser.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser,
            },
        });
    } catch (error) {
        if (error.statusCode === 409) { // Email exists from DAO
             return next(new AppError(error.message, 409));
        }
        next(error); // Forward to global error handler
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        const user = await userDAO.findUserByEmail(email);

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        const token = generateToken(user._id);

        // Remove password from output
        user.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
}; 