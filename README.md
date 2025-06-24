# AlgoBrawl 🧠⚔️

AlgoBrawl is a competitive coding platform where users can register, get matched via real-time matchmaking, and solve algorithmic problems live — inspired by platforms like LeetCode and Codeforces.

---

## 🚀 Features

- 🧑‍💻 **User Auth**: Register & login with hashed passwords and JWT tokens.
- 🧠 **Matchmaking**: Users can join a queue to be matched with another player of similar difficulty.
- 🧪 **Live Code Execution**: Users can write and execute code inside an in-browser Monaco Editor.
- 🗂 **Problem Bank**: Store and fetch problems of various difficulties.
- 🧼 **Testcase Validation**: Code is validated against multiple testcases inside Docker containers.
- 📡 **Real-Time Communication**: Uses Socket.IO for real-time events like match start, solution submission, etc.
- 🛠 **Technology Stack**:  
  - Frontend: React + Monaco Editor  
  - Backend: Node.js + Express + Sequelize  
  - DB: PostgreSQL  
  - Execution: Docker with custom images for Python/C++  

---

## 🛠️ Tech Stack

| Layer       | Tech                         |
|-------------|------------------------------|
| Frontend    | React, TailwindCSS, Socket.io-client |
| Backend     | Node.js, Express, Socket.io, Sequelize |
| Auth        | JWT + bcrypt + Cookies       |
| Database    | PostgreSQL                   |
| Code Runner | Docker (Python & C++ images) |

---

## 🧪 Running Locally

### 1. Clone Repo

```bash
git clone https://github.com/SreehariSanjeev04/AlgoBrawl.git
cd AlgoBrawl
```

## Folder Structure

AlgoBrawl/
├── backend/
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── executor/         # Docker-based code runner
│   └── database/         # DB config & migrations
│
├── frontend/
│   ├── pages/            # Next.js or React pages
│   ├── components/       # Reusable UI components
│   └── styles/           # Tailwind/global styles
│
└── docker/
    ├── python/           # Docker image for Python execution
    └── cpp/              # Docker image for C++ execution

### Note
You must build docker images to run the containers for code execution, dont worry, docker-build.sh will take care of it!
```bash
chmod +x docker-build.sh
./docker-build.sh
```