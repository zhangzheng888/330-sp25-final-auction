const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestLeague, createTestPlayer, findOne } = require('../utils/db.testUtils');
const User = require('../../src/models/user.model.js');
const League = require('../../src/models/league.model.js');
const Draft = require('../../src/models/draft.model.js');
const Team = require('../../src/models/team.model.js');
const Player = require('../../src/models/player.model.js');
const mongoose = require('mongoose');
const teamDAO = require('../../src/daos/team.dao.js'); // Import teamDAO

describe.skip('Draft Routes - /api/v1/drafts', () => {
    let superadminToken, commissionerToken, userToken1, userToken2;
    let testSuperAdmin, testCommissioner, testUser1, testUser2;
    let testLeague1, testLeague2;
    let testPlayer1, testPlayer2;
    let activeDraftData;

    beforeAll(async () => {
        // Jest.setup.js handles DB connection
    });

    beforeEach(async () => {
        // Jest.setup.js handles clearing DB collections

        testSuperAdmin = await createTestUser({ email: 'superdraft@test.com', username: 'superdraft', role: 'superadmin', password: 'password123' });
        superadminToken = testSuperAdmin.token;

        testCommissioner = await createTestUser({ email: 'commishdraft@test.com', username: 'commishdraft', role: 'commissioner', password: 'password123' });
        commissionerToken = testCommissioner.token;

        testUser1 = await createTestUser({ email: 'user1draft@test.com', username: 'user1draft', role: 'user', password: 'password123' });
        userToken1 = testUser1.token;
        testUser2 = await createTestUser({ email: 'user2draft@test.com', username: 'user2draft', role: 'user', password: 'password123' });
        userToken2 = testUser2.token;

        testLeague1 = await createTestLeague(testCommissioner.user, { leagueName: 'Active Draft League', playerBudget: 200, teamSize: 10 });

        await User.findByIdAndUpdate(testCommissioner.user._id, { leagueId: testLeague1._id });
        await User.findByIdAndUpdate(testUser1.user._id, { leagueId: testLeague1._id });
        await User.findByIdAndUpdate(testUser2.user._id, { leagueId: testLeague1._id });
        
        testPlayer1 = await createTestPlayer({ fullName: 'Player One', position: 'QB', nflTeam: 'KC', espnPlayerId: 'p1' });
        testPlayer2 = await createTestPlayer({ fullName: 'Player Two', position: 'WR', nflTeam: 'BUF', espnPlayerId: 'p2' });

        const createDraftRes = await request(app)
            .post(`/api/v1/drafts/league/${testLeague1._id}`)
            .set('Authorization', `Bearer ${commissionerToken}`)
            .send({ nominationTimer: 5, auctionTimer: 5 });
        
        expect(createDraftRes.statusCode).toBe(201);
        const createdDraftId = createDraftRes.body.data.draft._id;

        const startDraftRes = await request(app)
            .patch(`/api/v1/drafts/${createdDraftId}/start`)
            .set('Authorization', `Bearer ${commissionerToken}`);

        expect(startDraftRes.statusCode).toBe(200);
        activeDraftData = startDraftRes.body.data.draft;
        
        const teamsInLeague = await Team.find({ leagueId: testLeague1._id });
        expect(teamsInLeague.length).toBe(3);
        teamsInLeague.forEach(team => {
            expect(team.remainingBudget).toBe(testLeague1.playerBudget);
        });
    });

    afterAll(async () => {
        // Jest.setup.js handles DB disconnection
    });

    describe.skip('POST /league/:leagueId', () => { // SKIPPED FOR NOW
        it('should allow commissioner to create a draft for their league', async () => {
            const res = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({ nominationTimer: 45, auctionTimer: 75 });
            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.draft.leagueId).toBe(testLeague1._id.toString());
            expect(res.body.data.draft.draftStatus).toBe('pending');
            expect(res.body.data.draft.settings.nominationTimer).toBe(45);
            expect(res.body.data.draft.settings.auctionTimer).toBe(75);

            const draftInDb = await Draft.findOne({ leagueId: testLeague1._id });
            expect(draftInDb).not.toBeNull();
        });

        it('should allow superadmin to create a draft for any league', async () => {
            const res = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${superadminToken}`)
                .send({}); // Use default timers
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.draft.leagueId).toBe(testLeague1._id.toString());
            expect(res.body.data.draft.settings.nominationTimer).toBe(30); // default
        });

        it('should return 403 if a regular user tries to create a draft', async () => {
            const res = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${userToken1}`)
                .send({});
            expect(res.statusCode).toEqual(403);
        });

        it('should return 403 if a commissioner tries to create a draft for another league', async () => {
            const res = await request(app)
                .post(`/api/v1/drafts/league/${testLeague2._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({});
            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 if league does not exist', async () => {
            const nonExistentLeagueId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post(`/api/v1/drafts/league/${nonExistentLeagueId}`)
                .set('Authorization', `Bearer ${superadminToken}`)
                .send({});
            expect(res.statusCode).toEqual(404);
        });

        it('should return 400 if a draft already exists for the league', async () => {
            await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({});
            
            const res = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('draft already exists');
        });
    });

    describe.skip('PATCH /:draftId/start', () => { // SKIPPED FOR NOW
        let pendingDraft;

        beforeEach(async () => {
            const draftRes = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({});
            pendingDraft = draftRes.body.data.draft;
        });

        it('should allow commissioner to start a pending draft for their league', async () => {
            const res = await request(app)
                .patch(`/api/v1/drafts/${pendingDraft._id}/start`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toContain('Draft started successfully');
            expect(res.body.data.draft.draftStatus).toBe('active');
            expect(res.body.data.draft.draftOrder.length).toBe(3); // Commissioner + 2 users
            expect(res.body.data.draft.currentTurnIndex).toBe(0);

            const leagueDetails = await League.findById(testLeague1._id);
            const teamsInDb = await Team.find({ leagueId: testLeague1._id });
            expect(teamsInDb.length).toBe(3);
            teamsInDb.forEach(team => {
                expect(team.remainingBudget).toBe(leagueDetails.playerBudget);
                expect(team.roster.length).toBe(0); // Roster should be empty at start
            });
        });

        it('should allow superadmin to start a pending draft', async () => {
            const res = await request(app)
                .patch(`/api/v1/drafts/${pendingDraft._id}/start`)
                .set('Authorization', `Bearer ${superadminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.draft.draftStatus).toBe('active');
            expect(res.body.data.draft.draftOrder.length).toBe(3);
        });

        it('should return 403 if a regular user tries to start a draft', async () => {
            const res = await request(app)
                .patch(`/api/v1/drafts/${pendingDraft._id}/start`)
                .set('Authorization', `Bearer ${userToken1}`);
            expect(res.statusCode).toEqual(403);
        });
        
        it('should return 400 if draft is not in pending state', async () => {
            await request(app)
                .patch(`/api/v1/drafts/${pendingDraft._id}/start`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            
            const res = await request(app)
                .patch(`/api/v1/drafts/${pendingDraft._id}/start`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Draft cannot be started');
        });

        it('should return 404 if draft ID is invalid', async () => {
            const nonExistentDraftId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch(`/api/v1/drafts/${nonExistentDraftId}/start`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(404);
        });

        it('should return 400 if league has no users (excluding commissioner if they are not also a regular user)', async () => {
            const soloCommishUser = await createTestUser({ email: 'solocommish@test.com', username: 'solocommish', role: 'commissioner', password: 'password123' });
            const soloCommishToken = soloCommishUser.token;
            const soloLeague = await createTestLeague(soloCommishUser.user, { leagueName: 'Solo League'});
            await User.findByIdAndUpdate(soloCommishUser.user.id, { leagueId: soloLeague._id });

            const draftRes = await request(app)
                .post(`/api/v1/drafts/league/${soloLeague._id}`)
                .set('Authorization', `Bearer ${soloCommishToken}`)
                .send({});
            const soloDraft = draftRes.body.data.draft;

            const res = await request(app)
                .patch(`/api/v1/drafts/${soloDraft._id}/start`)
                .set('Authorization', `Bearer ${soloCommishToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.draft.draftOrder.length).toBe(1);
        });
    });

    describe.skip('GET /:draftId', () => { // SKIPPED FOR NOW
        let activeDraft;

        beforeEach(async () => {
            const draftRes = await request(app)
                .post(`/api/v1/drafts/league/${testLeague1._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`)
                .send({});
            const pDraft = draftRes.body.data.draft;
            const startRes = await request(app)
                .patch(`/api/v1/drafts/${pDraft._id}/start`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            activeDraft = startRes.body.data.draft;
        });

        it('should allow a league member to get draft details', async () => {
            const res = await request(app)
                .get(`/api/v1/drafts/${activeDraft._id}`)
                .set('Authorization', `Bearer ${userToken1}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.draft._id).toBe(activeDraft._id);
        });

        it('should allow the commissioner to get draft details', async () => {
            const res = await request(app)
                .get(`/api/v1/drafts/${activeDraft._id}`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should allow a superadmin to get draft details', async () => {
            const res = await request(app)
                .get(`/api/v1/drafts/${activeDraft._id}`)
                .set('Authorization', `Bearer ${superadminToken}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should return 403 if user is not part of the league and not admin/commish', async () => {
            const otherUserData = await createTestUser({email: 'otherdraft@test.com', username: 'otherdraft', password: 'password123', role: 'user'});
            const otherToken = otherUserData.token;
            const res = await request(app)
                .get(`/api/v1/drafts/${activeDraft._id}`)
                .set('Authorization', `Bearer ${otherToken}`);
            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 if draft ID is invalid', async () => {
            const nonExistentDraftId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/drafts/${nonExistentDraftId}`)
                .set('Authorization', `Bearer ${commissionerToken}`);
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('POST /:draftId/nominate - Player Nomination', () => {
        it('should allow the current turn user to nominate a player', async () => {
            // Fetch the current state of the draft to ensure currentTurnIndex and draftOrder are fresh
            const currentDraftState = await Draft.findById(activeDraftData._id).lean(); // Use .lean() for plain JS object
            if (!currentDraftState) throw new Error ('Draft not found for nomination test');

            const currentTurnTeamInfo = currentDraftState.draftOrder[currentDraftState.currentTurnIndex];
            let nominatingUserToken;
            const currentTurnUserId = currentTurnTeamInfo.userId.toString(); // userId in draftOrder is an ObjectId

            if (currentTurnUserId === testCommissioner.user._id.toString()) nominatingUserToken = commissionerToken;
            else if (currentTurnUserId === testUser1.user._id.toString()) nominatingUserToken = userToken1;
            else if (currentTurnUserId === testUser2.user._id.toString()) nominatingUserToken = userToken2;
            else throw new Error('Could not determine nominating user token for current turn.');

            const res = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nominatingUserToken}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 10 });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toBe('Player nominated successfully');
            const updatedDraft = res.body.data.draft;
            // When draft is returned from controller after update, playerId is populated.
            expect(updatedDraft.currentPlayerNomination.playerId._id.toString()).toBe(testPlayer1._id.toString());
            expect(updatedDraft.currentPlayerNomination.startingBid).toBe(10);
            expect(updatedDraft.currentPlayerNomination.currentBidAmount).toBe(10);
            // nominatedByTeamId and currentHighestBidderTeamId should be ObjectIds, convert to string for comparison
            expect(updatedDraft.currentPlayerNomination.nominatedByTeamId.toString()).toBe(currentTurnTeamInfo.teamId.toString());
            expect(updatedDraft.currentPlayerNomination.currentHighestBidderTeamId.toString()).toBe(currentTurnTeamInfo.teamId.toString());
            expect(new Date(updatedDraft.currentPlayerNomination.auctionEndTime) > new Date()).toBe(true);
            // Ensure playerId in history is also compared as a string
            expect(updatedDraft.history.some(h => h.event === 'nomination' && h.playerId.toString() === testPlayer1._id.toString())).toBe(true);
        });

        it('should return 403 if it is not the user\'s turn to nominate', async () => {
            const currentTurnTeamInfo = activeDraftData.draftOrder[activeDraftData.currentTurnIndex];
            let nonTurnUserToken = userToken1;
            if (currentTurnTeamInfo.userId.toString() === testUser1.user._id.toString()) {
                nonTurnUserToken = userToken2;
            }
            
            const res = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nonTurnUserToken}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 5 });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('It is not your turn to nominate a player.');
        });
        
        it('should return 400 if player has already been drafted', async () => {
            const initialDraftState = await Draft.findById(activeDraftData._id).lean();
            const currentTurnTeamInfo = initialDraftState.draftOrder[initialDraftState.currentTurnIndex];
            let nominatingUserToken;
            let nominatorTeamId = currentTurnTeamInfo.teamId.toString(); 

            const nominatorUserId = currentTurnTeamInfo.userId.toString();
            if (nominatorUserId === testCommissioner.user._id.toString()) nominatingUserToken = commissionerToken;
            else if (nominatorUserId === testUser1.user._id.toString()) nominatingUserToken = userToken1;
            else if (nominatorUserId === testUser2.user._id.toString()) nominatingUserToken = userToken2;
            else throw new Error('Could not determine token for first nomination in already drafted test');

            const firstNomRes = await request(app) 
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nominatingUserToken}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 1 });
            expect(firstNomRes.statusCode).toBe(200);
            
            const draftDoc = await Draft.findById(activeDraftData._id);
            draftDoc.currentPlayerNomination.auctionEndTime = new Date(Date.now() - 1000);
            await draftDoc.save();

            const processRes = await request(app) 
                .post(`/api/v1/drafts/${activeDraftData._id}/process-auction`)
                .set('Authorization', `Bearer ${commissionerToken}`); 
            expect(processRes.statusCode).toBe(200);

            const winningTeamAfterAuction = await Team.findById(nominatorTeamId).lean();
            const playerIsOnRoster = winningTeamAfterAuction.roster.some(p => p.player.toString() === testPlayer1._id.toString());
            expect(playerIsOnRoster).toBe(true);

            const updatedDraftAfterWin = await Draft.findById(activeDraftData._id).lean();
            const nextTurnTeamInfo = updatedDraftAfterWin.draftOrder[updatedDraftAfterWin.currentTurnIndex];
            let nextNominatingUserToken;
            const nextNominatorUserId = nextTurnTeamInfo.userId.toString();

            if (nextNominatorUserId === testCommissioner.user._id.toString()) nextNominatingUserToken = commissionerToken;
            else if (nextNominatorUserId === testUser1.user._id.toString()) nextNominatingUserToken = userToken1;
            else if (nextNominatorUserId === testUser2.user._id.toString()) nextNominatingUserToken = userToken2;
            else throw new Error('Could not determine token for second nomination in already drafted test');
            
            const res = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nextNominatingUserToken}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 5 });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('This player has already been drafted in your league.');
        });

        it('should return 400 if another player auction is ongoing', async () => {
            // Fetch fresh draft state to get the current turn user accurately
            const draftStateForTest = await Draft.findById(activeDraftData._id).lean();
            if (!draftStateForTest) throw new Error('Draft not found for ongoing auction test');

            const currentTurnTeamInfo = draftStateForTest.draftOrder[draftStateForTest.currentTurnIndex];
            let nominatingUserToken;
            const currentTurnUserId = currentTurnTeamInfo.userId.toString();

            if (currentTurnUserId === testCommissioner.user._id.toString()) nominatingUserToken = commissionerToken;
            else if (currentTurnUserId === testUser1.user._id.toString()) nominatingUserToken = userToken1;
            else if (currentTurnUserId === testUser2.user._id.toString()) nominatingUserToken = userToken2;
            else throw new Error('Could not determine nominating user token for ongoing auction test.');

            // Nominate first player
            const firstNominationRes = await request(app)
                .post(`/api/v1/drafts/${draftStateForTest._id}/nominate`)
                .set('Authorization', `Bearer ${nominatingUserToken}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 10 });
            
            expect(firstNominationRes.statusCode).toBe(200); // Ensure first nomination is successful
            
            // Try to nominate another player while first auction is active, USING THE SAME TOKEN
            const res = await request(app)
                .post(`/api/v1/drafts/${draftStateForTest._id}/nominate`) // Use same draft ID
                .set('Authorization', `Bearer ${nominatingUserToken}`)
                .send({ playerId: testPlayer2._id.toString(), startingBid: 5 });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Another player is currently up for auction.');
        });
    });

    describe('POST /:draftId/bid - Placing Bids', () => {
        let nominatedPlayerDraft;
        let nominatorTokenForBidTests;
        let nominatorTeamIdForBidTests;

        beforeEach(async () => {
            const draftStateBeforeNomination = await Draft.findById(activeDraftData._id).lean();
            const currentTurnTeamInfo = draftStateBeforeNomination.draftOrder[draftStateBeforeNomination.currentTurnIndex];
            const nominatingUserId = currentTurnTeamInfo.userId.toString();
            nominatorTeamIdForBidTests = currentTurnTeamInfo.teamId.toString();

            if (nominatingUserId === testCommissioner.user._id.toString()) {
                nominatorTokenForBidTests = commissionerToken;
            } else if (nominatingUserId === testUser1.user._id.toString()) {
                nominatorTokenForBidTests = userToken1;
            } else if (nominatingUserId === testUser2.user._id.toString()) {
                nominatorTokenForBidTests = userToken2;
            } else {
                throw new Error('Could not determine nominator token for bidding test setup.');
            }

            const nominationRes = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nominatorTokenForBidTests}`)
                .send({ playerId: testPlayer1._id.toString(), startingBid: 5 });
            
            if (nominationRes.statusCode !== 200) {
                console.error('Nomination failed in bid test setup:', nominationRes.body);
            }
            expect(nominationRes.statusCode).toBe(200);
            nominatedPlayerDraft = nominationRes.body.data.draft;
        });

        it('should allow a user to place a valid bid', async () => {
            let bidderToken;
            let bidderTeamId;

            if (nominatorTokenForBidTests === commissionerToken) {
                bidderToken = userToken1;
                const team = await Team.findOne({ userId: testUser1.user._id, leagueId: testLeague1._id });
                bidderTeamId = team._id;
            } else if (nominatorTokenForBidTests === userToken1) {
                bidderToken = userToken2;
                const team = await Team.findOne({ userId: testUser2.user._id, leagueId: testLeague1._id });
                bidderTeamId = team._id;
            } else {
                bidderToken = commissionerToken;
                const team = await Team.findOne({ userId: testCommissioner.user._id, leagueId: testLeague1._id });
                bidderTeamId = team._id;
            }
            
            const res = await request(app)
                .post(`/api/v1/drafts/${nominatedPlayerDraft._id}/bid`)
                .set('Authorization', `Bearer ${bidderToken}`)
                .send({ bidAmount: 15 });

            expect(res.statusCode).toBe(200);
            const updatedDraft = res.body.data.draft;
            expect(updatedDraft.currentPlayerNomination.currentBidAmount).toBe(15);
            expect(updatedDraft.currentPlayerNomination.currentHighestBidderTeamId.toString()).toBe(bidderTeamId.toString());
            expect(updatedDraft.history.some(h => h.event === 'bid' && h.bidAmount === 15)).toBe(true);
        });

        it('should return 400 if bid amount is not higher than current bid', async () => {
            let bidderToken = userToken2;
            if (nominatorTokenForBidTests === userToken2) bidderToken = userToken1;

            const res = await request(app)
                .post(`/api/v1/drafts/${nominatedPlayerDraft._id}/bid`)
                .set('Authorization', `Bearer ${bidderToken}`)
                .send({ bidAmount: nominatedPlayerDraft.currentPlayerNomination.currentBidAmount });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('must be higher than the current bid');
        });

        it('should return 400 if bidder has insufficient budget', async () => {
            let bidderToken = userToken2;
            if (nominatorTokenForBidTests === userToken2) bidderToken = userToken1;

            const res = await request(app)
                .post(`/api/v1/drafts/${nominatedPlayerDraft._id}/bid`)
                .set('Authorization', `Bearer ${bidderToken}`)
                .send({ bidAmount: 300 });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('insufficient for this bid');
        });
        
        it('should return 400 if user is already the highest bidder', async () => {
            const res = await request(app)
                .post(`/api/v1/drafts/${nominatedPlayerDraft._id}/bid`)
                .set('Authorization', `Bearer ${nominatorTokenForBidTests}`)
                .send({ bidAmount: nominatedPlayerDraft.currentPlayerNomination.currentBidAmount + 5 });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('You are already the highest bidder.');
        });

        it('should extend auction end time if bid is placed near the end', async () => {
            const draftDoc = await Draft.findById(nominatedPlayerDraft._id);
            const almostEndTime = new Date(Date.now() + 3 * 1000);
            draftDoc.currentPlayerNomination.auctionEndTime = almostEndTime;
            await draftDoc.save();

            let bidderToken = userToken2;
            if (nominatorTokenForBidTests === userToken2) bidderToken = userToken1;
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            const res = await request(app)
                .post(`/api/v1/drafts/${nominatedPlayerDraft._id}/bid`)
                .set('Authorization', `Bearer ${bidderToken}`)
                .send({ bidAmount: nominatedPlayerDraft.currentPlayerNomination.currentBidAmount + 1 });
            
            expect(res.statusCode).toBe(200);
            const newAuctionEndTime = new Date(res.body.data.draft.currentPlayerNomination.auctionEndTime);
            expect(newAuctionEndTime > almostEndTime).toBe(true);
            expect(newAuctionEndTime > new Date(Date.now() + 8 * 1000)).toBe(true); 
        });
    });

    describe('POST /:draftId/process-auction - Process Auction Outcome', () => {
        let draftStateReadyForProcessing;
        let winningBidderToken;
        let winningTeamId;
        let playerNominatedForProcessing;
        let nominatorTeamIdForAuctionTestScope;

        beforeEach(async () => {
            let draftAfterNomination;
            let nominatorToken;

            const initialDraftState = await Draft.findById(activeDraftData._id).lean();
            const currentTurnInfo_Nomination = initialDraftState.draftOrder[initialDraftState.currentTurnIndex];
            const nominatorUserId = currentTurnInfo_Nomination.userId.toString();
            nominatorTeamIdForAuctionTestScope = currentTurnInfo_Nomination.teamId.toString();
            playerNominatedForProcessing = testPlayer1;

            if (nominatorUserId === testCommissioner.user._id.toString()) nominatorToken = commissionerToken;
            else if (nominatorUserId === testUser1.user._id.toString()) nominatorToken = userToken1;
            else if (nominatorUserId === testUser2.user._id.toString()) nominatorToken = userToken2;
            else throw new Error('Cannot determine nominator for process-auction setup');

            const nominationRes = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nominatorToken}`)
                .send({ playerId: playerNominatedForProcessing._id.toString(), startingBid: 5 });

            if (nominationRes.statusCode !== 200) {
                console.error('Nomination failed in process-auction setup:', nominationRes.body);
                throw new Error('Nomination failed during setup for process-auction tests');
            }
            draftAfterNomination = nominationRes.body.data.draft;

            if (nominatorToken === commissionerToken) winningBidderToken = userToken1;
            else if (nominatorToken === userToken1) winningBidderToken = userToken2;
            else winningBidderToken = commissionerToken;
            
            const bidderUserDoc = await User.findOne({ _id: Object.keys(global).find(key => global[key] === winningBidderToken && key.startsWith('test'))?.replace('Token','') });
            const bidderUserObject = (winningBidderToken === commissionerToken) ? testCommissioner.user :
                                   (winningBidderToken === userToken1) ? testUser1.user :
                                   testUser2.user;

            const bidderTeam = await Team.findOne({ userId: bidderUserObject._id, leagueId: testLeague1._id });
            if (!bidderTeam) throw new Error ('Bidder team not found in process-auction setup');
            winningTeamId = bidderTeam._id.toString();

            const bidRes = await request(app)
                .post(`/api/v1/drafts/${draftAfterNomination._id}/bid`)
                .set('Authorization', `Bearer ${winningBidderToken}`)
                .send({ bidAmount: 10 });
            
            if (bidRes.statusCode !== 200) {
                console.error('Bid failed in process-auction setup:', bidRes.body);
                throw new Error('Bid failed during setup for process-auction tests');
            }
            draftStateReadyForProcessing = bidRes.body.data.draft;
            
            const draftDoc = await Draft.findById(activeDraftData._id);
            draftDoc.currentPlayerNomination.auctionEndTime = new Date(Date.now() - 1000);
            await draftDoc.save();
            draftStateReadyForProcessing = await Draft.findById(activeDraftData._id).lean(); 
        });

        it('should award player to highest bidder, update roster & budget, and advance turn', async () => {
            const draftBeforeProcess = await Draft.findById(draftStateReadyForProcessing._id).lean();
            const nomInfoBeforeProcess = draftBeforeProcess.currentPlayerNomination;
            expect(nomInfoBeforeProcess.currentHighestBidderTeamId.toString()).toBe(winningTeamId);
            const currentWinningBid = nomInfoBeforeProcess.currentBidAmount;
            const originalTurnIndex = draftBeforeProcess.currentTurnIndex;

            const teamBeforeWin = await Team.findById(winningTeamId).lean();
            const originalBudget = teamBeforeWin.remainingBudget;
            const originalRosterSize = teamBeforeWin.roster.length;

            const res = await request(app)
                .post(`/api/v1/drafts/${draftStateReadyForProcessing._id}/process-auction`)
                .set('Authorization', `Bearer ${commissionerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('awarded to');
            
            const updatedDraft = res.body.data.draft;
            expect(updatedDraft.currentPlayerNomination.playerId).toBeNull();
            const initialDraftForTurn = await Draft.findById(activeDraftData._id).lean();
            const nominatorOriginalTurnIndex = initialDraftForTurn.draftOrder.findIndex(order => order.teamId.toString() === nominatorTeamIdForAuctionTestScope);
            expect(updatedDraft.currentTurnIndex).toBe((nominatorOriginalTurnIndex + 1) % updatedDraft.draftOrder.length);

            expect(updatedDraft.history.some(h => 
                h.event === 'playerWon' && 
                h.playerId.toString() === playerNominatedForProcessing._id.toString() && 
                h.teamId.toString() === winningTeamId
            )).toBe(true);

            const teamAfterWin = await Team.findById(winningTeamId).lean();
            expect(teamAfterWin.remainingBudget).toBe(originalBudget - currentWinningBid);
            expect(teamAfterWin.roster.length).toBe(originalRosterSize + 1);
            expect(teamAfterWin.roster.some(p => p.player.toString() === playerNominatedForProcessing._id.toString() && p.purchasePrice === currentWinningBid)).toBe(true);
        });
        
        it('should process as unsold if no valid bids are made (simulated by clearing highest bidder)', async () => {
            await Draft.findByIdAndUpdate(activeDraftData._id, { 
                $set: { 'history': [], 'currentPlayerNomination': null, 'currentTurnIndex': activeDraftData.currentTurnIndex }
            });
            const freshDraftState = await Draft.findById(activeDraftData._id).lean();

            const currentTurnInfo_NominationUnsold = freshDraftState.draftOrder[freshDraftState.currentTurnIndex];
            let nominatorTokenUnsold;
            const nominatorUserIdUnsold = currentTurnInfo_NominationUnsold.userId.toString();

            if (nominatorUserIdUnsold === testCommissioner.user._id.toString()) nominatorTokenUnsold = commissionerToken;
            else if (nominatorUserIdUnsold === testUser1.user._id.toString()) nominatorTokenUnsold = userToken1;
            else if (nominatorUserIdUnsold === testUser2.user._id.toString()) nominatorTokenUnsold = userToken2;
            else throw new Error('Cannot determine nominator for unsold test setup');

            const nominationResUnsold = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/nominate`)
                .set('Authorization', `Bearer ${nominatorTokenUnsold}`)
                .send({ playerId: testPlayer2._id.toString(), startingBid: 7 }); 
            expect(nominationResUnsold.statusCode).toBe(200);

            const draftDocForUnsold = await Draft.findById(activeDraftData._id);
            draftDocForUnsold.currentPlayerNomination.auctionEndTime = new Date(Date.now() - 1000); 
            draftDocForUnsold.currentPlayerNomination.currentHighestBidderTeamId = null;
            draftDocForUnsold.currentPlayerNomination.currentBidAmount = 0;
            await draftDocForUnsold.save();

            const res = await request(app)
                .post(`/api/v1/drafts/${activeDraftData._id}/process-auction`)
                .set('Authorization', `Bearer ${commissionerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('was not sold');
            const updatedDraft = res.body.data.draft;
            expect(updatedDraft.history.some(h => h.event === 'unsold' && h.playerId.toString() === testPlayer2._id.toString())).toBe(true);
            expect(updatedDraft.currentPlayerNomination.playerId).toBeNull();
        });
    });
}); 