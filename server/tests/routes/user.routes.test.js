const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/user.model.js');
const League = require('../../src/models/league.model.js');
// const jwt = require('jsonwebtoken'); // Not directly used for token generation here if createTestUser handles it
const { createTestUser, createTestLeague } = require('../utils/db.testUtils'); 

// connectDB, clearDB, disconnectDB are globally available from jest.setup.js

describe('User Routes - /api/v1/users', () => {
    let superAdminUser, commissionerUser, regularUser1, regularUser2;
    let superAdminToken, commissionerToken, regularUser1Token;
    let testLeague;

    // Using createTestUser which returns a token, so direct token generation might not be needed here
    // const generateTestToken = (userId, email, role = 'user') => {
    //     return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // };

    beforeAll(async () => {
        // REMOVED await connectDB(); - Handled by jest.setup.js
    });

    beforeEach(async () => {
        // REMOVED await clearDB(); - Handled by jest.setup.js

        const superAdminData = await createTestUser({
            email: 'superadmin@example.com',
            password: 'password123',
            role: 'superadmin',
            username: 'super',
        });
        superAdminUser = superAdminData.user;
        superAdminToken = superAdminData.token;

        // Create a league first, as commissionerUser and regularUser1 will be part of it.
        testLeague = await createTestLeague(superAdminUser, { // superAdminUser can be initial commish
            leagueName: 'Main Test League',
        });

        const commissionerData = await createTestUser({
            email: 'commissioner.user@example.com',
            password: 'password123',
            role: 'commissioner',
            username: 'testcommish',
            leagueId: testLeague._id // Assign to the created league
        });
        commissionerUser = commissionerData.user;
        commissionerToken = commissionerData.token;
        // Update league with actual commissioner if superAdmin was placeholder
        await League.findByIdAndUpdate(testLeague._id, { commissionerId: commissionerUser._id });


        const regularUser1Data = await createTestUser({
            email: 'user1@example.com',
            password: 'password123',
            role: 'user',
            username: 'userone',
            leagueId: testLeague._id // Assign to the created league
        });
        regularUser1 = regularUser1Data.user;
        regularUser1Token = regularUser1Data.token;
        
        const regularUser2Data = await createTestUser({
            email: 'user2@example.com',
            password: 'password123',
            role: 'user',
            username: 'usertwo',
        }); // User not in any league initially
        regularUser2 = regularUser2Data.user; 
        // token for regularUser2 if needed for some tests: regularUser2Token = regularUser2Data.token;
    });

    afterAll(async () => {
        // REMOVED await disconnectDB(); - Handled by jest.setup.js
    });

    describe('GET /api/v1/users', () => {
        it('should allow superadmin to get all users', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.results).toBeGreaterThanOrEqual(4); // superAdmin, commissioner, regularUser1, regularUser2
            expect(Array.isArray(res.body.data.users)).toBe(true);
            res.body.data.users.forEach(user => expect(user.password).toBeUndefined());
        });

        it('should prevent commissioner from getting all users', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(403);
        });

        it('should prevent regular user from getting all users', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${regularUser1Token}`);
            expect(res.statusCode).toEqual(403);
        });

        it('should return 401 if no token is provided', async () => {
            const res = await request(app).get('/api/v1/users');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('should allow superadmin to get any user by ID', async () => {
            const res = await request(app)
                .get(`/api/v1/users/${regularUser1._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.user._id).toBe(regularUser1._id.toString());
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should prevent commissioner from getting a user by ID', async () => {
            const res = await request(app)
                .get(`/api/v1/users/${regularUser1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 for non-existent user ID by superadmin', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/users/${nonExistentId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('PATCH /api/v1/users/:id/role', () => {
        it('should allow superadmin to change a user role to commissioner', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${regularUser1._id}/role`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ role: 'commissioner' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.user.role).toBe('commissioner');
            const updatedUser = await User.findById(regularUser1._id);
            expect(updatedUser.role).toBe('commissioner');
        });

        it('should allow superadmin to change a commissioner role to user', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${commissionerUser._id}/role`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ role: 'user' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.user.role).toBe('user');
        });

        it('should prevent superadmin from demoting the only superadmin', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${superAdminUser._id}/role`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ role: 'commissioner' });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Cannot change the role of the only superadmin');
        });
        
        it('should allow superadmin to change another superadmin role if more than one exists', async () => {
            const anotherSuperAdminData = await createTestUser({ email: 'super2@ex.com', password: 'password123', role: 'superadmin', username: 'super2' });
            const res = await request(app)
                .patch(`/api/v1/users/${anotherSuperAdminData.user._id}/role`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ role: 'commissioner' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.user.role).toBe('commissioner');
        });

        it('should prevent commissioner from changing user roles', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${regularUser1._id}/role`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({ role: 'commissioner' });
            expect(res.statusCode).toEqual(403);
        });

        it('should return 400 for invalid role value', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${regularUser1._id}/role`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ role: 'invalidRole' });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Invalid role specified');
        });
    });

    describe('DELETE /api/v1/users/:id', () => {
        it('should allow superadmin to delete a user', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${regularUser1._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(204);
            const deletedUser = await User.findById(regularUser1._id);
            expect(deletedUser).toBeNull();
        });

        it('should prevent superadmin from deleting themselves if they are the only one', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${superAdminUser._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('The only superadmin cannot delete themselves');
        });

        it('should allow superadmin to delete another superadmin if more than one exists', async () => {
            const anotherSuperAdminData = await createTestUser({ email: 'super2@ex.com', password: 'password123', role: 'superadmin', username: 'super2' });
            const res = await request(app)
                .delete(`/api/v1/users/${anotherSuperAdminData.user._id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(204);
        });

        it('should prevent commissioner from deleting a user', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${regularUser1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 if superadmin tries to delete non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/v1/users/${nonExistentId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.statusCode).toEqual(404);
        });

        // TODO: Test implications of deleting a commissioner - e.g., what happens to their league(s).
        // The controller currently has a TODO for this. For now, deletion is direct.
    });
}); 