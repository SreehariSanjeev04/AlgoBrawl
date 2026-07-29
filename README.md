# AlgoBrawl

AlgoBrawl is a competitive coding platform where users match in real-time, solve algorithmic problems, and have their solutions validated against test cases in isolated Docker containers. Inspired by platforms like LeetCode and Codeforces, it pairs players by skill rating and provides a live coding environment with instant feedback.

---

## Features

- **User Authentication** — Register and login with hashed passwords and JWT-based access/refresh tokens.
- **Skill-Based Matchmaking** — Players join a queue and are matched by Elo rating using a bucket queue system.
- **Live Code Execution** — Write and run code in an in-browser Monaco Editor; execution is sandboxed in ephemeral Docker containers.
- **Problem Bank** — Curated set of algorithmic problems with varying difficulty and judge types.
- **Real-Time Communication** — Socket.IO handles matchmaking, timer countdown, solution submission, and disconnect handling.
- **Elo Rating System** — Ratings are recalculated after each match using a standard Elo algorithm.

---

## Architecture

The backend follows a layered architecture:

```
src/
  config/         Environment configuration and DB connection
  middleware/     JWT auth, internal auth, error handling
  routes/         Thin route definitions, no business logic
  controllers/    Request parsing and response formatting
  services/       Core business logic (Elo, execution, user, problem)
  socket/         Socket.IO initialization and event handlers
  managers/       In-memory state (active users, matches, pending connections)
  matchmaking/    Bucket queue for skill-based player matching
  executor/       Docker-based code runner infrastructure
  models/         Sequelize ORM models
  database/       Model associations
```

---

## Tech Stack

| Layer         | Technology                           |
|---------------|--------------------------------------|
| Frontend      | React, TailwindCSS, Socket.io-client |
| Backend       | Node.js, Express, Socket.io, Sequelize |
| Auth          | JWT, bcrypt, httpOnly cookies        |
| Database      | PostgreSQL                           |
| Code Runner   | Docker (custom Python and C++ images) |
| Testing       | Vitest                               |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally
- Docker (for code execution)

### Setup

```bash
git clone https://github.com/SreehariSanjeev04/AlgoBrawl.git
cd AlgoBrawl

# Install backend dependencies
cd backend
npm install

# Build Docker images for code execution
chmod +x ../docker-build.sh
../docker-build.sh

# Configure environment variables
cp .env.example .env   # (if available) or create .env with required values

# Start the server
npm start               # or: node server.js
```

The server starts on `http://localhost:5000`. The `/health` endpoint confirms the server is running.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and connects to the backend at `http://localhost:5000`.

---

## Project Structure

```
AlgoBrawl/
├── backend/
│   ├── server.js                      # Entry point (HTTP, Socket.IO, DB sync)
│   ├── src/
│   │   ├── app.js                     # Express app setup (middleware, routes)
│   │   ├── config/
│   │   │   ├── env.js                 # Environment variable validation
│   │   │   └── database.js            # Sequelize connection
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # JWT verification
│   │   │   ├── internal-auth.middleware.js # Internal service secret check
│   │   │   └── error.middleware.js        # AppError class and global error handler
│   │   ├── routes/
│   │   │   ├── index.js               # Route aggregator under /api
│   │   │   ├── user.routes.js
│   │   │   ├── problem.routes.js
│   │   │   ├── match.routes.js
│   │   │   ├── submission.routes.js
│   │   │   └── executor.routes.js
│   │   ├── controllers/
│   │   │   ├── user.controller.js
│   │   │   ├── problem.controller.js
│   │   │   ├── match.controller.js
│   │   │   ├── submission.controller.js
│   │   │   └── executor.controller.js
│   │   ├── services/
│   │   │   ├── user.service.js
│   │   │   ├── problem.service.js
│   │   │   ├── submission.service.js
│   │   │   ├── executor.service.js
│   │   │   ├── elo.service.js
│   │   │   ├── response.service.js
│   │   │   └── api.service.js          # Internal HTTP client for inter-service calls
│   │   ├── socket/
│   │   │   ├── index.js                # Socket.IO init and event wiring
│   │   │   └── handlers/
│   │   │       ├── connection.handler.js
│   │   │       ├── match.handler.js
│   │   │       └── submission.handler.js
│   │   ├── managers/
│   │   │   ├── ActiveUserManager.js
│   │   │   ├── MatchManager.js
│   │   │   └── PendingConnections.js
│   │   ├── matchmaking/
│   │   │   ├── BucketQueue.js
│   │   │   └── Queue.js
│   │   ├── executor/
│   │   │   ├── cpp/                    # Dockerfile and entrypoint for C++
│   │   │   ├── python/                 # Dockerfile and normalizer for Python
│   │   │   └── temp/                   # Temporary submission files
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Match.js
│   │   │   ├── Problem.js
│   │   │   └── Submission.js
│   │   └── database/
│   │       └── associations.js         # Model relationships
│   ├── tests/
│   │   ├── services/
│   │   │   ├── elo.service.test.js
│   │   │   └── response.service.test.js
│   │   └── executor/
│   │       └── executor.test.js
│   ├── vitest.config.js
│   └── package.json
├── frontend/                           # React/Next.js frontend
├── docker-build.sh                     # Script to build Python and C++ Docker images
└── README.md
```

---

## API Overview

All REST endpoints are prefixed with `/api`.

| Method   | Path                       | Auth        | Description                  |
|----------|----------------------------|-------------|------------------------------|
| POST     | `/api/user/register`       | None        | Create a new user            |
| POST     | `/api/user/login`          | None        | Authenticate and get tokens  |
| GET      | `/api/user/`               | None        | List users by rating         |
| GET      | `/api/user/:id`            | None        | Get user by ID               |
| POST     | `/api/user/validate`       | None        | Validate access token        |
| POST     | `/api/user/refresh-token`  | Cookie      | Refresh access token         |
| POST     | `/api/user/get-matches`    | None        | Get match history for a user |
| PATCH    | `/api/user/update`         | JWT         | Update user stats            |
| PUT      | `/api/user/update-score`   | Internal    | Update user score (internal) |
| GET      | `/api/problem/`            | None        | List all problems            |
| GET      | `/api/problem/generate/:difficulty` | None | Random problem by difficulty |
| POST     | `/api/problem/add`         | None        | Create a problem             |
| POST     | `/api/match/create-match`  | None        | Create a match room          |
| GET      | `/api/match/:matchId`      | None        | Get match room details       |
| DELETE   | `/api/match/:matchId`      | JWT         | Remove a match room          |
| POST     | `/api/match/store-match`   | Internal    | Persist match result         |
| POST     | `/api/run`                 | Rate-limited| Execute code (no validation) |
| POST     | `/api/submit`              | Internal + Rate-limited | Validate code against test cases |
| POST     | `/api/submission/add`      | Internal    | Store a submission record    |
| GET      | `/health`                  | None        | Health check                 |

---

## Running Tests

```bash
cd backend
npm test
```

---

## License

This project is licensed under the ISC License.
