const request = require('supertest');
const app = require('../../src/app'); // Express app
const { createTestUser, createTestPlayer } = require('../utils/db.testUtils');

describe('Player Routes - /api/v1/players', () => {
    let superadminToken;
    let userToken;
    let testSuperAdmin;
    let testUser;

    beforeAll(async () => {
        // REMOVED await connectDB(); - Handled by jest.setup.js
    });

    beforeEach(async () => {
        // REMOVED await clearDB(); - Handled by jest.setup.js
        // Create users and get tokens
        testSuperAdmin = await createTestUser({
            email: 'superadmin@test.com',
            password: 'password123',
            username: 'superadmin',
            role: 'superadmin'
        });
        superadminToken = testSuperAdmin.token;

        testUser = await createTestUser({
            email: 'user@test.com',
            password: 'password123',
            username: 'normaluser',
            role: 'user'
        });
        userToken = testUser.token;

        // Pre-populate some players
        await createTestPlayer({ fullName: 'Patrick Mahomes', position: 'QB', nflTeam: 'KC' });
        await createTestPlayer({ fullName: 'Christian McCaffrey', position: 'RB', nflTeam: 'SF' });
        await createTestPlayer({ fullName: 'Justin Jefferson', position: 'WR', nflTeam: 'MIN' });
        await createTestPlayer({ fullName: 'Pat Freiermuth', position: 'TE', nflTeam: 'PIT' });

    });

    afterAll(async () => {
        // REMOVED await disconnectDB(); - Handled by jest.setup.js
    });

    describe('GET /search', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/api/v1/players/search?q=mahomes');
            expect(res.statusCode).toEqual(401);
        });

        it('should return 400 if search query q is missing', async () => {
            const res = await request(app)
                .get('/api/v1/players/search')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('at least 2 characters');
        });

        it('should return 400 if search query q is too short', async () => {
            const res = await request(app)
                .get('/api/v1/players/search?q=p')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('at least 2 characters');
        });

        it('should find players matching the search term (case-insensitive)', async () => {
            const res = await request(app)
                .get('/api/v1/players/search?q=mahomes')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.results).toBe(1);
            expect(res.body.data.players[0].fullName).toBe('Patrick Mahomes');
        });

        it('should find multiple players if search term is general', async () => {
            const res = await request(app)
                .get('/api/v1/players/search?q=pat')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.results).toBeGreaterThanOrEqual(2); // Patrick Mahomes, Pat Freiermuth
            expect(res.body.data.players.some(p => p.fullName === 'Patrick Mahomes')).toBe(true);
            expect(res.body.data.players.some(p => p.fullName === 'Pat Freiermuth')).toBe(true);
        });

        it('should return empty array if no players match', async () => {
            const res = await request(app)
                .get('/api/v1/players/search?q=nonexistentplayer')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.results).toBe(0);
            expect(res.body.data.players).toEqual([]);
        });
    });

    describe('POST /', () => {
        const newPlayerData = {
            fullName: 'Travis Kelce',
            position: 'TE',
            nflTeam: 'KC'
        };

        it('should allow superadmin to create a player', async () => {
            const res = await request(app)
                .post('/api/v1/players')
                .set('Authorization', `Bearer ${superadminToken}`)
                .send(newPlayerData);
            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.player.fullName).toBe(newPlayerData.fullName);
        });

        it('should return 403 if a non-superadmin tries to create a player', async () => {
            const res = await request(app)
                .post('/api/v1/players')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newPlayerData);
            expect(res.statusCode).toEqual(403);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/players')
                .send(newPlayerData);
            expect(res.statusCode).toEqual(401);
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/players')
                .set('Authorization', `Bearer ${superadminToken}`)
                .send({ position: 'QB' }); // Missing fullName
            expect(res.statusCode).toEqual(400); // Or 500 if not caught by Mongoose validation before controller
            // Depending on how error handling is set up, could be 400 for validation error
        });
    });
}); 