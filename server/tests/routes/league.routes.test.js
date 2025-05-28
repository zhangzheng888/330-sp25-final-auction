const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/user.model');
const League = require('../../src/models/league.model');
const jwt = require('jsonwebtoken');
const { findOne, find } = require('../utils/db.testUtils.js');

describe('League Routes - /api/v1/leagues', () => {
    let commissionerUser;
    let otherUser;
    let commissionerToken;
    let otherUserToken;
    let testLeagueData;

    const generateTestToken = (userId, email, role = 'user') => {
        return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    };

    beforeAll(async () => {
        // jest.setup.js handles DB connection and clearing
    });

    beforeEach(async () => {
        // Create users for testing
        commissionerUser = await User.create({
            email: 'commissioner@example.com',
            password: 'password123',
            role: 'commissioner', // Assuming a user can start as commissioner
            username: 'commish',
        });
        commissionerToken = generateTestToken(commissionerUser._id, commissionerUser.email, commissionerUser.role);

        otherUser = await User.create({
            email: 'otheruser@example.com',
            password: 'password123',
            role: 'user',
            username: 'otherdude',
        });
        otherUserToken = generateTestToken(otherUser._id, otherUser.email, otherUser.role);

        testLeagueData = {
            leagueName: 'My Test League',
            teamSize: 12,
            playerBudget: 200,
        };
    });

    describe('POST /api/v1/leagues (Create League)', () => {
        it('should create a new league successfully for an authenticated user', async () => {
            const res = await request(app)
                .post('/api/v1/leagues')
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send(testLeagueData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.league).toBeDefined();
            expect(res.body.data.league.leagueName).toBe(testLeagueData.leagueName);
            expect(res.body.data.league.commissionerId).toBe(commissionerUser._id.toString());
            expect(res.body.data.league.leagueCode).toBeDefined();

            const leagueInDb = await findOne(League, { _id: res.body.data.league._id });
            expect(leagueInDb).not.toBeNull();
            expect(leagueInDb.leagueName).toBe(testLeagueData.leagueName);
        });

        it('should return 401 if no token is provided', async () => {
            const res = await request(app)
                .post('/api/v1/leagues')
                .send(testLeagueData);
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toContain('You are not logged in!');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/leagues')
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({ leagueName: 'Only Name League' }); // Missing teamSize, playerBudget
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('League name, team size, and player budget are required.');
        });
    });

    describe('DELETE /api/v1/leagues/:leagueId (Delete League)', () => {
        let createdLeague;

        beforeEach(async () => {
            // Create a league to be deleted in tests
            createdLeague = await League.create({
                ...testLeagueData,
                commissionerId: commissionerUser._id,
            });
        });

        it('should allow the commissioner to delete their own league', async () => {
            const res = await request(app)
                .delete(`/api/v1/leagues/${createdLeague._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`);

            expect(res.statusCode).toEqual(204); // No Content

            const leagueInDb = await findOne(League, { _id: createdLeague._id });
            expect(leagueInDb).toBeNull();
        });

        it('should return 401 if no token is provided for deletion', async () => {
            const res = await request(app)
                .delete(`/api/v1/leagues/${createdLeague._id}`);
            expect(res.statusCode).toEqual(401);
        });

        it('should return 403 if a non-commissioner user tries to delete the league', async () => {
            const res = await request(app)
                .delete(`/api/v1/leagues/${createdLeague._id}`)
                .set('Authorization', `Bearer ${otherUserToken}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toContain('User not authorized to delete this league.');

            const leagueInDb = await findOne(League, { _id: createdLeague._id });
            expect(leagueInDb).not.toBeNull(); // League should still exist
        });

        it('should return 404 if trying to delete a non-existent league ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/v1/leagues/${nonExistentId}`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toContain('No league found with that ID.');
        });

        it('should return 404 if league ID is invalid', async () => {
            const res = await request(app)
                .delete('/api/v1/leagues/invalidleagueid')
                .set('Authorization', `Bearer ${commissionerToken}`);
            
            // The DAO's ObjectId.isValid check should prevent a cast error if it returns null
            // and the controller sends a 404. If it throws, error middleware might catch it.
            // The specific behavior depends on how invalid IDs are handled before DB query.
            // For now, let's assume it results in a 404 as per controller logic for findLeagueById returning null.
            // If it were a CastError, it would be 500 then handled by errorMiddleware to be 400.
            // Our DAO for findLeagueById checks isValid and returns null, so controller sends 404.
            expect(res.statusCode).toEqual(404); 
            expect(res.body.message).toContain('No league found with that ID.');
        });
    });
}); 