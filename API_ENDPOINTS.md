# Fantasy Football Auction API Endpoints

This document outlines the available API endpoints for manual testing using `curl` or an API client like Postman/Insomnia.

**Base URL:** Replace `<YOUR_LOCALHOST_URL>` with your server's address (e.g., `http://localhost:3000` if your server runs on port 3000).

**Authentication:**
Most endpoints require a JWT Bearer token in the `Authorization` header.
1.  Register a user (`POST /api/v1/auth/register`) or login an existing user (`POST /api/v1/auth/login`) to obtain a token.
2.  For protected routes, replace `<TOKEN>`, `<SUPERADMIN_TOKEN>`, `<COMMISSIONER_TOKEN>`, etc., with the actual JWT.
    Example Header: `Authorization: Bearer <YOUR_JWT_TOKEN>`

---

## I. Authentication (`/api/v1/auth`)

### 1. Register User
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/auth/register`
*   **Description:** Registers a new user.
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/auth/register \
      -H 'Content-Type: application/json' \
      -d '{
        "email": "newuser@example.com",
        "password": "password123",
        "username": "newbie",
        "leagueCode": "<OPTIONAL_LEAGUE_CODE>"
      }'
    ```
*   **Expected Response:** `201 Created` (with user data and token)

### 2. Login User
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/auth/login`
*   **Description:** Logs in an existing user.
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/auth/login \
      -H 'Content-Type: application/json' \
      -d '{
        "email": "newuser@example.com",
        "password": "password123"
      }'
    ```
*   **Expected Response:** `200 OK` (with user data and token)

---

## II. User Management (`/api/v1/users`) - Requires Superadmin Token

*(Replace `<USER_ID_TO_GET>`, `<USER_ID_TO_UPDATE>`, `<USER_ID_TO_DELETE>` with actual User IDs found from GET requests or database.)*

### 1. Get All Users
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/users`
*   **Description:** Retrieves a list of all users. (Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      <YOUR_LOCALHOST_URL>/api/v1/users \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>'
    ```
*   **Expected Response:** `200 OK`

### 2. Get Specific User
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_GET>`
*   **Description:** Retrieves a specific user by their ID. (Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      <YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_GET> \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>'
    ```
*   **Expected Response:** `200 OK`

### 3. Update User Role
*   **Method:** `PATCH`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_UPDATE>/role`
*   **Description:** Updates the role of a specific user. (Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X PATCH \
      <YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_UPDATE>/role \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "role": "commissioner"
      }'
    ```
    *Valid roles: "superadmin", "commissioner", "user"*
*   **Expected Response:** `200 OK`

### 4. Delete User
*   **Method:** `DELETE`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_DELETE>`
*   **Description:** Deletes a specific user. (Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X DELETE \
      <YOUR_LOCALHOST_URL>/api/v1/users/<USER_ID_TO_DELETE> \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>'
    ```
*   **Expected Response:** `204 No Content`

---

## III. League Management (`/api/v1/leagues`)

*(Replace `<LEAGUE_ID>`, `<NEW_COMMISSIONER_USER_ID>`, `<USER_ID_TO_REMOVE>` with actual IDs.)*
*(Use appropriate tokens: `<TOKEN>` for general authenticated user, `<COMMISSIONER_OR_SUPERADMIN_TOKEN>`, `<COMMISSIONER_TOKEN_OWNS_LEAGUE>`, `<SUPERADMIN_TOKEN>`, `<COMMISSIONER_TOKEN_FOR_LEAGUE_ID>` as specified.)*

### 1. Create League
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues`
*   **Description:** Creates a new league. (Commissioner or Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/leagues \
      -H 'Authorization: Bearer <COMMISSIONER_OR_SUPERADMIN_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "leagueName": "My Awesome League",
        "teamSize": 10,
        "playerBudget": 200
      }'
    ```
*   **Expected Response:** `201 Created` (Note the returned `_id` as `<LEAGUE_ID>` and `leagueCode` for future requests)

### 2. Get All Leagues
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues`
*   **Description:** Retrieves a list of all leagues. (Any authenticated user)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      <YOUR_LOCALHOST_URL>/api/v1/leagues \
      -H 'Authorization: Bearer <TOKEN>'
    ```
*   **Expected Response:** `200 OK`

### 3. Get Specific League
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID>`
*   **Description:** Retrieves a specific league by its ID. (Any authenticated user)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      <YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID> \
      -H 'Authorization: Bearer <TOKEN>'
    ```
*   **Expected Response:** `200 OK`

### 4. Update League
*   **Method:** `PATCH`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID>`
*   **Description:** Updates a specific league.
    *   Commissioner: Can update specific fields of their own league.
    *   Superadmin: Can update more fields of any league.
*   **`curl` Example (Commissioner updating their own league):**
    ```bash
    curl -X PATCH \
      <YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID> \
      -H 'Authorization: Bearer <COMMISSIONER_TOKEN_OWNS_LEAGUE>' \
      -H 'Content-Type: application/json' \
      -d '{
        "leagueName": "Updated Commish League Name",
        "playerBudget": 250
      }'
    ```
*   **`curl` Example (Superadmin updating any league):**
    ```bash
    curl -X PATCH \
      <YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID> \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "leagueName": "Superadmin Updated Name",
        "teamSize": 12,
        "commissionerId": "<NEW_COMMISSIONER_USER_ID>"
      }'
    ```
*   **Expected Response:** `200 OK`

### 5. Delete League
*   **Method:** `DELETE`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID>`
*   **Description:** Deletes a specific league. (Commissioner who owns the league or Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X DELETE \
      <YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID> \
      -H 'Authorization: Bearer <COMMISSIONER_TOKEN_OWNS_LEAGUE_OR_SUPERADMIN_TOKEN>'
    ```
*   **Expected Response:** `204 No Content`

### 6. Remove User from League
*   **Method:** `DELETE`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID>/users/<USER_ID_TO_REMOVE>`
*   **Description:** Removes a user from a specific league. (Commissioner of that league only. Superadmin can use this route IF they are also the commissioner of record for this specific league, due to the `isCommissioner` middleware).
*   **`curl` Example:**
    ```bash
    curl -X DELETE \
      <YOUR_LOCALHOST_URL>/api/v1/leagues/<LEAGUE_ID>/users/<USER_ID_TO_REMOVE> \
      -H 'Authorization: Bearer <COMMISSIONER_TOKEN_FOR_LEAGUE_ID>'
    ```
*   **Expected Response:** `200 OK`

---

## IV. Player Management (`/api/v1/players`)

*(Requires appropriate authentication as specified.)*

### 1. Search Players
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/players/search?q=<SEARCH_QUERY>`
*   **Description:** Searches for players by name. (Any authenticated user)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      "<YOUR_LOCALHOST_URL>/api/v1/players/search?q=Mahomes" \
      -H 'Authorization: Bearer <TOKEN>'
    ```
*   **Expected Response:** `200 OK` (with an array of matching players)

### 2. Create Player (Superadmin Only)
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/players`
*   **Description:** Creates a new player. (Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/players \
      -H 'Authorization: Bearer <SUPERADMIN_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "espnPlayerId": "12345",
        "fullName": "Pat Mahomes",
        "position": "QB",
        "nflTeam": "KC"
      }'
    ```
*   **Expected Response:** `201 Created` (with the created player data)

---

## V. Draft Management (`/api/v1/drafts`)

*(Replace `<DRAFT_ID>`, `<LEAGUE_ID_FOR_DRAFT>` with actual IDs.)*
*(Use appropriate tokens as specified: `<COMMISSIONER_OR_SUPERADMIN_TOKEN>`, `<LEAGUE_MEMBER_TOKEN>`)*

### 1. Create Draft for League
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/league/<LEAGUE_ID_FOR_DRAFT>`
*   **Description:** Creates a new draft for the specified league. (Commissioner of the league or Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/league/<LEAGUE_ID_FOR_DRAFT> \
      -H 'Authorization: Bearer <COMMISSIONER_OR_SUPERADMIN_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "nominationTimer": 45, 
        "auctionTimer": 75 
      }'
    ```
    *(Timers are optional, defaults will be used if not provided.)*
*   **Expected Response:** `201 Created` (with draft data)

### 2. Start League Draft
*   **Method:** `PATCH`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/start`
*   **Description:** Starts a pending draft. This will create teams for all users in the league, assign budgets, and generate a randomized draft order. (Commissioner of the league associated with the draft or Superadmin only)
*   **`curl` Example:**
    ```bash
    curl -X PATCH \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/start \
      -H 'Authorization: Bearer <COMMISSIONER_OR_SUPERADMIN_TOKEN>'
    ```
*   **Expected Response:** `200 OK` (with updated draft data including `draftOrder` and `draftStatus: 'active'`)

### 3. Get Draft Details
*   **Method:** `GET`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>`
*   **Description:** Retrieves details for a specific draft. (League members, Commissioner, or Superadmin)
*   **`curl` Example:**
    ```bash
    curl -X GET \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID> \
      -H 'Authorization: Bearer <LEAGUE_MEMBER_TOKEN>'
    ```
*   **Expected Response:** `200 OK` (with draft data)

### 4. Nominate Player
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/nominate`
*   **Description:** Allows the current turn user to nominate a player for auction.
*   **Body:** `{"playerId": "<PLAYER_MONGO_ID>", "startingBid": <NUMBER>}`
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/nominate \
      -H 'Authorization: Bearer <CURRENT_TURN_USER_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "playerId": "60c72b2f9b1e8a1f1c8e4b2a",
        "startingBid": 10
      }'
    ```
*   **Expected Response:** `200 OK` (with updated draft data)
*   **WebSocket Events Emitted (to `draftId` room):**
    *   `playerNominated`: Contains details of the nomination (player, nominator, bid, auction end time, history entry).
    *   `draftStatusUpdate`: Contains a concise update of the current auction status (current bid, highest bidder, player on block, auction end time).

### 5. Place Bid
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/bid`
*   **Description:** Allows a league member to place a bid on the currently nominated player.
*   **Body:** `{"bidAmount": <NUMBER>}`
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/bid \
      -H 'Authorization: Bearer <LEAGUE_MEMBER_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "bidAmount": 15
      }'
    ```
*   **Expected Response:** `200 OK` (with updated draft data)
*   **WebSocket Events Emitted (to `draftId` room):**
    *   `newBid`: Contains details of the new bid (player, bid amount, bidder, auction end time, history entry).
    *   `draftStatusUpdate`: Contains a concise update of the current auction status.

### 6. Process Auction Outcome
*   **Method:** `POST`
*   **URL:** `<YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/process-auction`
*   **Description:** Processes the outcome of a completed auction (awards player or marks as unsold, advances turn). This can be called by any authenticated user once the auction timer has expired (intended for client or commissioner to trigger, or could be automated).
*   **`curl` Example:**
    ```bash
    curl -X POST \
      <YOUR_LOCALHOST_URL>/api/v1/drafts/<DRAFT_ID>/process-auction \
      -H 'Authorization: Bearer <ANY_AUTHENTICATED_USER_TOKEN>'
    ```
*   **Expected Response:** `200 OK` (with updated draft data)
*   **WebSocket Events Emitted (to `draftId` room):**
    *   `auctionOutcome`: Contains details of the auction result (player, winner/unsold status, price, next turn info, history entry).
    *   `draftStatusUpdate`: Contains a concise update indicating no player on block and next nominator information.

---

## VI. WebSocket Events (Live Draft View)

Clients connected to a specific draft room (`draftId`) via WebSocket will receive the following events:

*   **`playerNominated`**: (Emitted after `POST /api/v1/drafts/:draftId/nominate`)
    *   **Payload Example:** `{ draftId, player: {Object}, nominatedByTeamId, startingBid, auctionEndTime, historyEntry: {Object} }`
    *   **Description:** Signals a new player has been nominated and is up for auction.

*   **`newBid`**: (Emitted after `POST /api/v1/drafts/:draftId/bid`)
    *   **Payload Example:** `{ draftId, player: {Object}, currentBidAmount, currentHighestBidderTeamId, auctionEndTime, historyEntry: {Object} }`
    *   **Description:** Signals a new bid has been placed on the current player.

*   **`auctionOutcome`**: (Emitted after `POST /api/v1/drafts/:draftId/process-auction`)
    *   **Payload Example:** `{ draftId, player: {Object}, winningTeamId, winningBidAmount, historyEntry: {Object}, nextTurnIndex, nextTeamInfo: {Object}, isSold: Boolean }`
    *   **Description:** Signals the result of the auction for the player (sold or unsold) and information about the next turn.

*   **`draftStatusUpdate`**: (Emitted after nomination, bid, or auction processing)
    *   **Payload Example (during auction):** `{ currentBid, highestBidder, playerOnBlock: {Object}, auctionEndTime }`
    *   **Payload Example (between auctions):** `{ currentBid: null, highestBidder: null, playerOnBlock: null, auctionEndTime: null, currentTurnIndex, nextNominatorTeamId }`
    *   **Description:** Provides a concise summary of the current state of the auction or who is next to nominate. Useful for clients to quickly update key UI elements.

*   **`draftRoomJoined`**: (Emitted to a client after they successfully join a room)
    *   **Payload Example:** `{ draftId, message: "Successfully joined draft room <draftId>" }`

*   **`errorJoiningRoom`**: (Emitted to a client if joining a room fails)
    *   **Payload Example:** `"Invalid Draft ID provided."`

*(Note: `{Object}` denotes a Mongoose document or a sub-document, likely populated.)* 