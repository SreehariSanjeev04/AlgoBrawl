# AlgoBrawl

AlgoBrawl is a real-time competitive coding platform that pits players against each other in head-to-head algorithm battles. Users are matched by skill rating, solve algorithmic problems in a live in-browser editor, and have their solutions validated against hidden test cases inside isolated Docker containers.

Built with a real-time-first architecture, AlgoBrawl combines Elo-based matchmaking, a socket-driven match lifecycle, and a sandboxed code execution engine to deliver a low-latency competitive experience similar to platforms such as LeetCode and Codeforces.

---

## Features

- **User Authentication** — Secure registration and login with bcrypt-hashed passwords, short-lived JWT access tokens, and httpOnly-cookie refresh tokens.
- **Skill-Based Matchmaking** — Players join a queue and are matched by Elo rating using a bucket queue system.
- **Live Code Execution** — Write and run code in an in-browser Monaco Editor; every submission runs in a resource-constrained, network-isolated Docker container.
- **Problem Bank** — A curated collection of algorithmic problems spanning multiple difficulties and judge types.
- **Test Case Validation** — Solutions are graded against expected outputs with configurable comparison modes (string, boolean, multi-line).
- **Real-Time Communication** — Socket.IO drives matchmaking, the in-match timer, solution feedback, match completion, and disconnect recovery.
- **Elo Rating System** — Player ratings are recalculated after every match using a standard Elo algorithm.

---

## Architecture

The backend follows a layered architecture that keeps route definitions thin and isolates business logic in services:

```
Request ─▶ Routes ─▶ Controllers ─▶ Services ─▶ Models / Database
                    │                    │
                    └──── Socket.IO ◀────┘
                    (match lifecycle, live events)
```

| Layer          | Responsibility                                             |
|----------------|------------------------------------------------------------|
| `routes/`      | Thin route definitions; no business logic                  |
| `middleware/`  | JWT verification, internal-service secret checks           |
| `services/`    | Core business logic: Elo rating, code execution, users     |
| `socket/`      | Socket.IO initialization and real-time event handling      |
| `managers/`    | In-memory state: active users, matches, pending connections|
| `matchmaking/` | Bucket queue for skill-based player matching               |
| `executor/`    | Docker-based code runner for Python and C++                |
| `models/`      | Sequelize ORM models                                       |
| `database/`    | Connection and model associations                          |

---

## Tech Stack

| Layer         | Technology                                 |
|---------------|--------------------------------------------|
| Frontend      | Next.js 15, React 19, TailwindCSS 4, Monaco Editor |
| Backend       | Node.js, Express 5, Socket.IO, Sequelize   |
| Auth          | JWT, bcrypt, httpOnly cookies              |
| Database      | PostgreSQL                                 |
| Code Runner   | Docker (custom Python and C++ images)      |
| Real-Time     | Socket.IO                                  |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally
- Docker (required for code execution)

### Backend Setup

```bash
git clone https://github.com/SreehariSanjeev04/AlgoBrawl.git
cd AlgoBrawl/backend

npm install

# Configure environment variables
cp .env.example .env   # or create .env with the required values (see below)

# Build the Docker images used for code execution
chmod +x ../docker-build.sh
../docker-build.sh

# Start the server
npm start
```

The backend listens on the port defined by `PORT` (defaults to `5000`).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and connects to the backend API specified by `NEXT_PUBLIC_BACKEND_URI`.

### Docker Images

The `docker-build.sh` script builds the two execution images:

```bash
docker build -t code-runner-python backend/executor/python
docker build -t code-runner-cpp backend/executor/cpp
```

These images must exist before any code can be executed.

---

## Configuration

Create a `.env` file in `backend/` with the following variables:

| Variable           | Description                                        |
|--------------------|----------------------------------------------------|
| `PORT`             | Port the backend listens on                        |
| `BACKEND_URI`      | Base URL of the backend API                        |
| `DB_HOST`          | PostgreSQL host                                    |
| `DB_NAME`          | PostgreSQL database name                           |
| `DB_USER`          | PostgreSQL user                                    |
| `DB_PASSWORD`      | PostgreSQL password                                |
| `JWT_SECRET`       | Secret used to sign JWT access tokens              |
| `REFRESH_TOKEN`    | Secret used to sign refresh tokens                 |
| `INTERNAL_SECRET`  | Shared secret for internal service-to-service calls|
| `MAX_CONTAINERS`   | Max concurrent execution containers (default: 5)   |
| `NODE_ENV`         | `development` or `production`                      |

The frontend expects a `NEXT_PUBLIC_BACKEND_URI` value in `frontend/.env` pointing at the backend API root.

---

## Project Structure

```
AlgoBrawl/
├── backend/
│   ├── server.js                  # Entry point (HTTP, Socket.IO, DB sync)
│   ├── database/
│   │   ├── db.js                  # Sequelize connection
│   │   └── associations.js        # Model relationships
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── routes/                    # API route definitions
│   │   ├── UserRoutes.js
│   │   ├── ProblemRoutes.js
│   │   ├── MatchRoutes.js
│   │   └── SubmissionRoutes.js
│   ├── services/
│   │   ├── eloService.js          # Elo rating calculation
│   │   ├── responseService.js     # Response formatting helpers
│   │   └── api.service.js         # Internal HTTP client for service calls
│   ├── socket/
│   │   ├── socket.js              # Socket.IO init and event wiring
│   │   └── controllers/           # Socket event controllers
│   ├── managers/                  # In-memory state
│   │   ├── ActiveUserManager.js
│   │   ├── MatchManager.js
│   │   └── PendingConnections.js
│   ├── matchmaking/
│   │   ├── BucketQueue.js         # Skill-based bucket queue
│   │   └── Queue.js
│   ├── executor/
│   │   ├── executor.js            # Docker code runner (API)
│   │   ├── cpp/                   # C++ execution image
│   │   ├── python/                # Python execution image
│   │   └── temp/                  # Temporary submission files
│   └── models/                    # Sequelize models
│       ├── User.js
│       ├── Match.js
│       ├── Problem.js
│       └── Submission.js
├── frontend/                      # Next.js / React frontend
├── docker-build.sh                # Builds the code execution Docker images
└── README.md
```

---

## API Reference

All REST endpoints are mounted under the `/api` prefix.

| Method | Path                        | Auth     | Description                                  |
|--------|-----------------------------|----------|----------------------------------------------|
| POST   | `/api/user/register`        | None     | Create a new user                            |
| POST   | `/api/user/login`           | None     | Authenticate and receive JWT tokens          |
| GET    | `/api/user/`                | None     | List users ordered by rating                 |
| GET    | `/api/user/:id`             | None     | Get a user by ID                             |
| PATCH  | `/api/user/update`          | None     | Update user stats (rating, wins, matches)    |
| POST   | `/api/user/validate`        | JWT      | Validate an access token                     |
| POST   | `/api/user/refresh-token`   | Cookie   | Refresh the access token                     |
| POST   | `/api/user/get-matches`     | None     | Get match history for a user                 |
| PUT    | `/api/user/update-score`    | Internal | Update a user's rating (internal)            |
| GET    | `/api/problem/`             | None     | List all problems                            |
| GET    | `/api/problem/generate/:difficulty` | None | Random problem of a given difficulty |
| POST   | `/api/problem/add`          | None     | Create a problem                             |
| POST   | `/api/match/create-match`   | None     | Create a match room                          |
| GET    | `/api/match/:matchId`       | None     | Get match room details                       |
| GET    | `/api/match/remove-match/:matchId` | None | Remove a match room                   |
| POST   | `/api/match/store-match`    | Internal | Persist a completed match                    |
| POST   | `/api/run`                  | None     | Execute code without validation              |
| POST   | `/api/submit`               | None     | Validate code against expected test cases    |
| POST   | `/api/submission/add`       | Internal | Store a submission record                    |

Endpoints marked **Internal** require the `x-internal-secret` header to match `INTERNAL_SECRET`.

---

## Socket.IO Events

| Event                | Direction    | Purpose                                   |
|----------------------|--------------|-------------------------------------------|
| `online`             | Client → Svr | Register a user as online                 |
| `join-matchmaking`   | Client → Svr | Enter the matchmaking queue               |
| `leave-matchmaking`  | Client → Svr | Leave the matchmaking queue               |
| `solution-submit`    | Client → Svr | Submit a solution for validation          |
| `solution-feedback`  | Server → Cli | Deliver result of a solution check        |
| `match-ended`        | Server → Cli | Notify players the match has ended        |
| `disconnect`         | Client → Svr | Handle user disconnect and recovery       |

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
