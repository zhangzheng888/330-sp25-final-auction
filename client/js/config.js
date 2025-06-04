// client/js/config.js

// Define the base URL for your API and WebSocket
let API_BASE_URL;
let SOCKET_URL;

const productionApiUrl = 'https://330-sp25-final-auction-production.up.railway.app/api/v1';
const localApiUrl = 'http://localhost:3000/api/v1';

const productionSocketUrl = 'wss://330-sp25-final-auction-production.up.railway.app';
const localSocketUrl = 'ws://localhost:3000'; // Standard WebSocket protocol for local

// Check if the frontend is served from localhost
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = localApiUrl;
    SOCKET_URL = localSocketUrl;
    console.log('Using local URLs: API_BASE_URL=' + API_BASE_URL + ', SOCKET_URL=' + SOCKET_URL);
} else {
    API_BASE_URL = productionApiUrl;
    SOCKET_URL = productionSocketUrl;
    console.log('Using production URLs: API_BASE_URL=' + API_BASE_URL + ', SOCKET_URL=' + SOCKET_URL);
}

// --- Original comments for reference below (can be cleaned up if desired) ---
// For local development:
// const API_BASE_URL = 'http://localhost:3000/api/v1';
// const API_BASE_URL = 'https://330-sp25-final-auction-production.up.railway.app/api/v1';

// For a hosted environment, you would change this to your deployed API URL:
// const API_BASE_URL = 'https://your-deployed-app-name.herokuapp.com/api/v1'; // Example for Heroku
// const API_BASE_URL = 'https://api.yourdomain.com/api/v1'; // Example for custom domain

// For WebSocket
// const SOCKET_URL = 'http://localhost:3000';
// If you want to use a different URL for WebSockets in other JS files, uncomment and update:
// const SOCKET_URL = 'wss://330-sp25-final-auction-production.up.railway.app'; 