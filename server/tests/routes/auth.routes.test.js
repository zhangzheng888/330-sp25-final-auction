const request = require('supertest');
const app = require('../../src/app.js'); // Path to your Express app
const mongoose = require('mongoose');
// We'll need to import User and League models. Will use planned new names.
const User = require('../../src/models/user.model.js'); 
const League = require('../../src/models/league.model.js');
const { findOne } = require('../utils/db.testUtils.js'); // DB test helpers

// JWT_SECRET needs to be loaded for token generation/verification if authController does that
// jest.setup.js should handle dotenv.config()

describe('Auth Routes - /api/v1/auth', () => {
    let league;
    let existingUser;

    beforeAll(async () => {
        // It's good practice to ensure models are registered if not already by imports
        // This is especially true if jest.setup.js doesn't explicitly import them all.
        // However, if User and League are imported above, they should be registered.
    });

    beforeEach(async () => {
        // Clear collections is handled by jest.setup.js

        // Create a dummy league for registration tests
        const LeagueModel = mongoose.model('League'); // Get model instance
        league = await LeagueModel.create({
            leagueName: 'Test League',
            commissionerId: new mongoose.Types.ObjectId(), // Dummy ID
            leagueCode: 'TEST123',
            teamSize: 10,
            playerBudget: 200,
            // Add other required fields from your League model
        });

        // Create an existing user for login tests and duplicate email tests
        const UserModel = mongoose.model('User'); // Get model instance
        existingUser = await UserModel.create({
            email: 'existing@example.com',
            password: 'password123',
            role: 'user',
            leagueId: league._id,
            username: 'existingUser'
        });
    });

    describe('POST /register', () => {
        it('should register a new user successfully with a valid league code', async () => {
            const validUserData = {
                email: 'test@example.com',
                password: 'password123',
                leagueCode: 'TEST123',
                username: 'testuser'
            };
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUserData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user.email).toBe(validUserData.email);
            expect(res.body.data.user.username).toBe(validUserData.username);
            expect(res.body.data.user.leagueId).toBe(league._id.toString());

            // Verify user in DB
            const userInDb = await findOne(mongoose.model('User'), { email: validUserData.email });
            expect(userInDb).not.toBeNull();
            expect(userInDb.email).toBe(validUserData.email);
        });

        it('should return 400 if email or password is not provided', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ leagueCode: 'TEST123', username: 'nouser' });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Email and password are required');
        });

        it('should return 400 if league code is invalid', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'invalid@example.com', password: 'password123', leagueCode: 'INVALID', username: 'invalidcode' });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Invalid league code');
        });

        it('should return 400 if league code is not provided', async () => {
             const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'noleague@example.com', password: 'password123', username: 'noleagueuser' });
            expect(res.statusCode).toEqual(400);
            // The message depends on your authController logic for missing leagueCode
            expect(res.body.message).toContain('League code is required for registration');
        });

        it('should return 409 if email already exists', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: existingUser.email, password: 'newpassword', leagueCode: league.leagueCode, username: 'newuserwithexistingemail' });
            expect(res.statusCode).toEqual(409);
            expect(res.body.message).toContain('Email already exists');
        });
    });

    describe('POST /login', () => {
        it('should login an existing user successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: existingUser.email, password: 'password123' }); // Use the plain password
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user.email).toBe(existingUser.email);
        });

        it('should return 400 if email or password is not provided for login', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Please provide email and password');
        });

        it('should return 401 for incorrect email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'wrong@example.com', password: 'password123' });
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toContain('Incorrect email or password');
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: existingUser.email, password: 'wrongpassword' });
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toContain('Incorrect email or password');
        });
    });
});
