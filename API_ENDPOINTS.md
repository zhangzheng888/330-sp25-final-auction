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