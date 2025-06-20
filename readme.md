## Final Project Summary

This project aimed to create a live auction platform for fantasy football drafts. While the initial scope was ambitious, this summary outlines the final status, achievements, and challenges encountered.

**Backend Development & Testing:**
*   The core backend functionalities were successfully implemented using Express.js and MongoDB.
*   This includes robust API endpoints for:
    *   User authentication (registration, login, role-based access).
    *   League management (creation, fetching, updating, deletion, user removal).
    *   Player data management (fetching and searching NFL players, superadmin player creation).
    *   Comprehensive Draft mechanics:
        *   Draft creation and initiation for a league.
        *   Player nomination by the current turn user.
        *   Real-time bidding on nominated players.
        *   Processing auction outcomes (awarding players, updating team rosters and budgets, advancing turns).
*   All backend routes and core logic have been thoroughly tested using Jest and Supertest, ensuring reliability and correctness of the implemented features. Key test files include `auth.routes.test.js`, `user.routes.test.js`, `league.routes.test.js`, `player.routes.test.js`, and `draft.routes.test.js`.

**Frontend Development:**
*   The initial plan to develop a dynamic frontend using React proved to be too extensive for the available timeframe, especially given the complexity of integrating real-time auction features.
*   As a result, the project opted for a simpler approach. A basic HTML page will be developed to demonstrate the core backend functionalities by interacting with the API. This allows for showcasing the live auction mechanics, even without a fully-fledged React UI. *(Further development on a simple HTML/JS frontend is pending to interact with the API.)*

**Challenges & Learnings:**
*   **API Layering & Service Complexity:** Designing and implementing a well-structured API with clear separation of concerns (controllers, services/DAOs, models) for a feature-rich application like a live auction draft was a significant undertaking. Managing data flow, request validation, and error handling across these layers required careful planning.
*   **Real-time Feature Integration:** The auction draft's core requirement for real-time updates (nominations, bids, timers) introduced complexity. While the backend logic for these events and their sequencing is in place, fully integrating and testing this with a sophisticated frontend (and potentially WebSockets for optimal performance) was a major hurdle that contributed to the decision to simplify the frontend scope.
*   **Scope Management:** Balancing the desired features with the available development time was a constant challenge. The initial ambition for a full-stack application with a React frontend was adjusted to ensure delivery of a functional and well-tested backend, which forms the core of the auction platform.

# Fantasy Football Live Auction Draft

## 1. Project Context & Subject Matter

This project will create a live auction platform for fantasy football drafts. It will enable real-time bidding, management of team rosters, and tracking of overall auction progress.

## 2. Problem Solved

This project directly addresses the needs of my personal fantasy football league by creating a dedicated and free platform for our auction drafts. Our league currently lacks a customized tool that fits our specific auction draft preferences, leading us to use less suitable or paid external services. The initial aim of this platform is to provide a streamlined and improved draft experience exclusively for our league members.

## 3. Technical Components

This project will be built using an Express.js API with MongoDB as the database.

### a. Routes (API Endpoints)

We'll need a RESTful API to handle the application's logic. The `Leagues` and `Teams` (managed within a league context, including operations like adding/removing players which implicitly update the team) will serve as the two primary sets of CRUD routes, in addition to authentication.

*   **Authentication:**
    *   `POST /api/auth/register`: User registration
    *   `POST /api/auth/login`: User login
    *   `POST /api/auth/logout`: User logout
*   **Users:**
    *   `GET /api/users/me`: Get current user details
*   **Leagues:** 
    *   `POST /api/leagues`: Create a new league (Requires admin or paid user privileges)
    *   `GET /api/leagues`: List leagues for the current user (Read)
    *   `GET /api/leagues/{leagueId}`: Get details for a specific league (Read)
    *   `PUT /api/leagues/{leagueId}`: Update league settings (e.g., roster size, budget) (Update)
    *   `DELETE /api/leagues/{leagueId}`: Delete a league (Requires admin privileges) (Delete - if applicable)
    *   `POST /api/leagues/{leagueId}/join`: Allow a user to join a league (Relates to Team creation within a league)
    *   `GET /api/leagues/{leagueId}/teams`: List teams in a league
*   **Teams (within Leagues):** (managed via league-specific endpoints or implicitly)
    *   Team creation typically handled via `POST /api/leagues/{leagueId}/join` or initial league setup.
    *   `GET /api/teams/{teamId}`: Get team details (including roster and budget) (Read)
    *   `PUT /api/teams/{teamId}`: Update team details (e.g., team name) (Update)
    *   (Adding/removing players via draft/bids implicitly updates the team's player list and budget - part of the draft logic rather than direct team CRUD for players).
*   **Drafts:**
    *   `POST /api/leagues/{leagueId}/drafts`: Create/start a new auction draft for a league
    *   `GET /api/leagues/{leagueId}/drafts/current`: Get the current state of the draft (e.g., current player, current bid, whose turn to nominate)
    *   `POST /api/drafts/{draftId}/nominate`: Nominate a player for auction (manager action)
*   **Bidding (Real-time, likely using WebSockets):**
    *   `POST /api/drafts/{draftId}/players/{playerId}/bid`: Place a bid on a player
    *   *(WebSocket endpoint for broadcasting bid updates, player sold notifications, timer updates)*
*   **Players:**
    *   `GET /api/players`: Get a list of available players (from external API)
    *   `GET /api/players/{playerId}`: Get details for a specific player

### b. Data Models

(All data will be stored in MongoDB. Primary Keys are typically `_id` generated by MongoDB; explicitly listed `userId`, `leagueId`, etc., will be indexed for lookups.)
Indexes will be utilized on appropriate fields for performance (e.g., on lookup fields like `commissionerId`, `leagueId` in Teams) and uniqueness (e.g., User `username`, `email`).

*   **User:**
    *   `userId` (Primary Key)
    *   `username`
    *   `email`
    *   `passwordHash`
    *   `role` (e.g., 'superadmin', 'paid_user', 'standard_user')
    *   `createdAt`
    *   `updatedAt`
*   **League:**
    *   `leagueId` (Primary Key)
    *   `leagueName`
    *   `commissionerId` (Foreign Key to User)
    *   `teamSize`
    *   `playerBudget`
    *   `rosterSettings` (e.g., QB, RB, WR, TE, K, DEF counts)
    *   `draftStatus` (e.g., 'pending', 'active', 'completed')
    *   `createdAt`
    *   `updatedAt`
*   **Team:**
    *   `teamId` (Primary Key)
    *   `leagueId` (Foreign Key to League)
    *   `userId` (Foreign Key to User - team owner)
    *   `teamName`
    *   `budgetRemaining`
    *   `players`: (Array of Player objects/references)
*   **Player (sourced from ESPN API):**
    *   `espnPlayerId` (Primary Key from ESPN API, e.g., "4248067")
    *   `fullName` (e.g., "Tyler Adams")
    *   `shortName` (e.g., "T. Adams")
    *   `position` (e.g., "QB", "WR" - Sourced from detailed ESPN athlete endpoint)
    *   `displayHeight` (e.g., "6' 0\"\")
    *   `displayWeight` (e.g., "190 lbs")
    *   `jersey` (e.g., "2")
    *   `birthPlace` (Object: city, state, country)
    *   `isActive` (Boolean - Sourced from detailed ESPN athlete endpoint)
    *   `headshotUrl` (Constructed: `https://a.espncdn.com/i/headshots/nfl/players/full/<espnPlayerId>.png`)
    *   `nflTeam` (String, e.g., "BUF" - Sourced from ESPN API if available)
    *   `projectedPoints` (Optional, if available and desired from API)
*   **Draft:**
    *   `draftId` (Primary Key)
    *   `leagueId` (Foreign Key to League)
    *   `draftType`: ('Auction')
    *   `currentNominatingManagerId` (Foreign Key to User/Team)
    *   `currentPlayerUpForAuctionId` (Foreign Key to Player)
    *   `currentHighBid`
    *   `currentHighBidderId` (Foreign Key to User/Team)
    *   `auctionTimer`
    *   `pickOrder` (for nominations)
    *   `draftLog`: (Array of auction events - nomination, bid, player sold)
*   **Bid:**
    *   `bidId` (Primary Key)
    *   `draftId` (Foreign Key to Draft)
    *   `playerId` (Foreign Key to Player)
    *   `teamId` (Foreign Key to Team)
    *   `bidAmount`
    *   `timestamp`

### c. External Data Sources

*   **ESPN NFL Player API:** Used to fetch comprehensive NFL player data.
    *   **Base Athlete List:** `https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?page=${page}&limit=${limit}`
    *   **Detailed Athlete Data (for specific season, includes position, active status):** `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/athletes/${espnPlayerId}?lang=en&region=us` (e.g., `seasons/2025` for the 2025 season data)
    *   **Player Headshots:** `https://a.espncdn.com/i/headshots/nfl/players/full/${espnPlayerId}.png`
    *   *Note: Access to the ESPN API will be based on their publicly available terms. If an API key is required for sustained use or higher rate limits, instructions for obtaining a free-tier key (if available) or a placeholder for where to insert a personal key will be documented alongside the project.* 

### d. Advanced Database Operations

To meet the project requirement for advanced database operations, the API will leverage MongoDB's aggregation framework. Specifically, `$lookup` operations will be used to efficiently combine and serve related data from different collections (e.g., populating user details for a league commissioner, or displaying team owner information alongside team details).

## 4. Meeting Project Requirements & Value Generation

This project will meet the core requirements by:

*   **User Accounts & Authentication:** Implementing a secure registration and login system, including role-based access control for functionalities like league creation (restricted to super-admin or paid users).
*   **Data Persistence:** Utilizing MongoDB to store user, league, team, and draft information.
*   **Real-time Interaction:** Employing WebSockets for instantaneous bid updates, auction timer synchronization, and player nomination announcements, creating a "live" feel.
*   **Core Application Logic:**
    *   Allowing users to create and join leagues with customizable settings (budget, roster size).
    *   Managing the auction draft process: player nominations, bidding, awarding players to the highest bidder, and updating team budgets.
    *   Tracking team rosters and ensuring they comply with league settings.
*   **User Interface:** Developing an intuitive and responsive UI that clearly displays:
    *   Available players.
    *   The current player being auctioned, bidding history, and current high bid.
    *   Each manager's team, remaining budget, and roster spots.
    *   Draft log and overall league standings/rosters.
*   **Value Generation:**
    *   Provides a specialized and enhanced experience for fantasy football enthusiasts who prefer auction drafts.
    *   Solves the logistical challenges of running auction drafts manually.
    *   Increases engagement and strategic depth in fantasy drafts.
    *   Offers a platform for remote leagues to conduct fair and exciting auctions.

## 5. Timeline


*   **Foundation & Core Backend**
    *   Set up GitHub Repository & Initial Project Structure. [Done]
    *   Implement User Model (including roles for 'superadmin', 'paid_user', 'standard_user') & Authentication API (registration, login, role-based access control). [Done]
    *   Implement League & Team Data Models. [Done]
    *   Develop Core League Management API (create league with role restrictions, join league, view league details). [TBD]

*   **Draft Mechanics & Player Data**
    *   Implement Draft Data Model. [TBD]
    *   Develop API endpoints for initiating and managing draft state (e.g., starting draft, moving to next player). [TBD]
    *   Integrate with an External NFL Player Data API (e.g., Sleeper API) to fetch and list players. [TBD]
    *   Implement Player Nomination Logic (API for users to nominate players). [TBD]
    *   Develop Initial Bidding Logic (API for placing bids, determining winning bid, assigning player to team, updating team budget). [TBD]
    *   Begin basic UI for player listing and initiating a draft. [TBD]

*   **Week 3 (May 20th - May 26th): Real-time Features, UI Refinement & Testing**
    *   Integrate WebSockets for real-time bid updates, auction timer synchronization, and broadcasting draft events (new nomination, new bid, player sold).
    *   Develop and Refine the Draft Room User Interface: display current player for auction, bidding controls, bid history, team rosters/budgets, auction timer, draft log.
    *   Implement turn management for player nominations if required by league rules.
    *   Conduct Comprehensive Testing: unit tests, integration tests, and thorough manual user-experience testing across all features, aiming for >80% test coverage for all API routes.
    *   Focus on Bug Fixing, performance optimization, and overall UI/UX polishing.

*   **Week 4 (May 27th - June 2nd): Finalization, Deployment & Submission Prep**
    *   Prepare for and execute deployment to a hosting platform.
    *   Conduct final review of all code, documentation (README), and project requirements.
    *   Create a video demonstration of the project if required.
    *   Buffer time for any last-minute issues or refinements.
    *   Prepare for final project submission by June 3rd.
