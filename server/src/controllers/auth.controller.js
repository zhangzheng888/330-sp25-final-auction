const jwt = require('jsonwebtoken');
const userDAO = require('../daos/user.dao.js');
const leagueDAO = require('../daos/league.dao.js');
const AppError = require('../utils/app.error.js');

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
        let role = 'user';

        if (leagueCode) {
            const league = await leagueDAO.findLeagueByCode(leagueCode);
            if (!league) {
                return next(new AppError('Invalid league code.', 400));
            }
            leagueId = league._id;
        } else {
            return next(new AppError('League code is required for registration.', 400));
        }

        const newUser = await userDAO.createUser({
            email,
            password,
            role,
            leagueId,
            username,
        });

        const token = generateToken(newUser._id);
        newUser.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser,
            },
        });
    } catch (error) {
        if (error.statusCode === 409) {
             return next(new AppError(error.message, 409));
        }
        next(error);
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