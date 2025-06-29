const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const execRouter = require("./executor/executor");
const sequelize = require("./database/db");
const userRouter = require("./routes/UserRoutes");
const problemRouter = require("./routes/ProblemRoutes");
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/api", execRouter);
app.use("/api/user", userRouter);
app.use("/api/problem", problemRouter);

const queue = [];
const matches = new Map();

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);
  socket.on("join-matchmaking", async (user) => {
    queue.push({ socketId: socket.id, ...user });

    if (queue.length >= 2) {
      const player1 = queue.shift();
      const player2 = queue.shift();
      const roomId = `match-${Date.now()}`;

      try {
        const response = await fetch(
          `http://localhost:5000/api/generate?difficulty=${user.difficulty}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
          }
        );

        const problem = await response.json();
        matches.set(roomId, {
          players: [player1.username, player2.username],
          problem,
          submissions: [],
        });

        socket.join(roomId);
        io.sockets.sockets.get(player2.socketId).join(roomId);

        io.to(roomId).emit("match-started", {
          roomId,
          problem,
          players: [player1.username, player2.username],
        });
      } catch (err) {}
    }
  });

  socket.on("submit-solution", ({ roomId, username, code }) => {
    const match = matches.get(roomId);
    if (!match) return;

    // test out the code

    // if passed, pass the message regarding the winner and end the match

    matches.delete(roomId);
  });

  socket.on("disconnect", () => {
    let idx = 0;
    for (idx = 0; idx < queue.length; idx++) {
      if (queue[idx].socketId === socket.id) break;
    }
    queue.splice(idx, 1);
  });
});

const PORT = process.env.PORT || 3000;
const server = () => {
  try {
    sequelize
      .sync({ alter: true })
      .then(() => {
        console.log("Database synced");

        httpServer.listen(PORT, (err) => {
          console.log(`Server listening to PORT ${PORT}`);
          if (err) console.log(err);
        });
      })
      .catch((err) => {
        console.log(`Database sync error: ${err}`);
      });
  } catch (e) {
    console.error("Failed to start server: ", e);
    process.exit(1);
  }
};

server();
