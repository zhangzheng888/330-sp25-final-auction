import _ from 'lodash';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// const MONGO_URI = "mongodb://localhost:27017/espn"; // Your old local URI
// const MONGO_URI = "mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_NAME>.<YOUR_CLUSTER_ID>.mongodb.net/espn?retryWrites=true&w=majority"; // <-- REPLACE THIS WITH YOUR ATLAS CONNECTION STRING
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/espn"; // Use Atlas URI from .env or default to local
console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`); // Log the URI
const DB_NAME = "espn"; // This should match the database name in your Atlas connection string or be the one you intend to use
const COLLECTION_NAME = "players";

const API_BASE_URL = "https://sports.core.api.espn.com/v3/sports/football/nfl/athletes";
const LIMIT = 6400;
const MAX_PAGES = 3;

const client = new MongoClient(MONGO_URI);

// Helper function to introduce a delay
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPlayerData(page) {
    const url = `${API_BASE_URL}?page=${page}&limit=${LIMIT}`;
    console.log(`Fetching base player data from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        const players = data.items || [];

        if (players.length === 0) {
            console.log(`No base players found on page ${page}.`);
            return [];
        }
        console.log(`Fetched ${players.length} base players from page ${page}. Now fetching details...`);

        // Enhance player data with details from the second endpoint, in batches
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 500; // ms
        const enhancedPlayers = [];
        const playerChunks = _.chunk(players, BATCH_SIZE);

        for (let i = 0; i < playerChunks.length; i++) {
            const chunk = playerChunks[i];
            console.log(`--- Processing details for batch ${i + 1} of ${playerChunks.length} (size: ${chunk.length}) on page ${page} ---`);
            
            const batchPromises = chunk.map(async (player) => {
                if (!player.id) {
                    console.warn("Player object missing id, cannot fetch details:", player);
                    return player; // Return original player if id is missing
                }
                const athleteUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/athletes/${player.id}?lang=en&region=us`;
                try {
                    const athleteResponse = await fetch(athleteUrl);
                    if (!athleteResponse.ok) {
                        console.warn(`Failed to fetch details for player ${player.id} (URL: ${athleteUrl}): ${athleteResponse.status} ${await athleteResponse.text()}`);
                        return player; // Return original player on error
                    }
                    const athleteData = await athleteResponse.json();
                    return {
                        ...player,
                        position: athleteData.position,
                        experience: athleteData.experience,
                        status: athleteData.status,
                        headshot: athleteData.headshot // from the more detailed endpoint
                    };
                } catch (error) {
                    console.error(`Error fetching details for player ${player.id} (URL: ${athleteUrl}):`, error.message);
                    return player; // Return original player on error
                }
            });

            const resultsFromBatch = await Promise.all(batchPromises);
            enhancedPlayers.push(...resultsFromBatch);
        }
        
        console.log(`--- Finished fetching all details for page ${page}. Total enhanced players: ${enhancedPlayers.length} ---`);
        return enhancedPlayers;
    } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        return []; // Return empty array on error to continue with other pages if desired
    }
}

async function main() {
    let allPlayersToInsert = []; // Initialize an array to hold all players

    try {
        console.log(`Preparing to fetch ${MAX_PAGES} pages with up to ${LIMIT} players per page.`);

        for (let page = 1; page <= MAX_PAGES; page++) {
            console.log(`--- Fetching data for page ${page} ---`);
            const playersFromPage = await fetchPlayerData(page);

            if (playersFromPage && playersFromPage.length > 0) {
                allPlayersToInsert.push(...playersFromPage);
                console.log(`Fetched ${playersFromPage.length} players from page ${page}. Total compiled: ${allPlayersToInsert.length}`);
            } else {
                console.log(`No players found on page ${page} or error fetching this page.`);
            }
        }

        if (allPlayersToInsert.length > 0) {
            console.log(`
--- All data fetched. Total players compiled: ${allPlayersToInsert.length} ---`);
            console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`);
            await client.connect();
            console.log("Connected to MongoDB for bulk insert.");

            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);

            try {
                const insertResult = await collection.insertMany(allPlayersToInsert, { ordered: false }); // Use ordered: false to attempt inserting all documents even if some fail
                console.log(`Successfully inserted ${insertResult.insertedCount} players in a single operation.`);
            } catch (dbError) {
                console.error(`Error inserting all players into MongoDB:`, dbError);
                if (dbError.writeErrors) {
                    console.error("Detailed write errors:", JSON.stringify(dbError.writeErrors, null, 2));
                }
            }
        } else {
            console.log("No players were compiled, so no database insertion will be attempted.");
        }
        
    } catch (error) {
        // This catch block now primarily handles errors from fetchPlayerData or initial setup
        console.error("An error occurred during the data fetching process:", error);
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            console.log("Closing MongoDB connection.");
            await client.close();
            console.log("MongoDB connection closed.");
        } else {
            console.log("MongoDB connection was not open or already closed.");
        }
        console.log("Script execution completed.");
    }
}

main();