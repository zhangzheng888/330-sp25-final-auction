const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/user.model.js'); 
const League = require('../../src/models/league.model.js');
// db.testUtils.js is used for creating test data, not for DB connection management here.
const { createTestUser, createTestLeague, findOne } = require('../utils/db.testUtils'); 

// connectDB, clearDB, disconnectDB are globally available from jest.setup.js

describe('Auth Routes - /api/v1/auth', () => {
    let league;
    let existingUser;

    beforeAll(async () => {
        // REMOVED await connectDB(); - Handled by jest.setup.js
    });

    beforeEach(async () => {
        // REMOVED await clearDB(); - Handled by jest.setup.js

        // Create a dummy league for registration tests
        // Use createTestLeague for consistency if it fits, or manual creation like this is fine.
        const commissionerForTestLeague = await createTestUser({ 
            email: 'authcommish@example.com', 
            password: 'password123', 
            username: 'authcommish', 
            role: 'commissioner' 
        });
        league = await createTestLeague(commissionerForTestLeague.user, { 
            leagueCode: 'TEST123', 
            // ensure other required fields are present or handled by createTestLeague defaults
        });

        // Create an existing user for login tests and duplicate email tests
        const existingUserData = await createTestUser({
            email: 'existing@example.com',
            password: 'password123',
            role: 'user',
            leagueId: league._id, // Assign to the created league
            username: 'existingUser'
        });
        existingUser = existingUserData.user;
    });

    afterAll(async () => {
        // REMOVED await disconnectDB(); - Handled by jest.setup.js
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
