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
const { initializeSocket } = require("./socket/socket")
const matchRouter = require("./routes/MatchRoutes");

const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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
app.use("/api/match", matchRouter);

initializeSocket(io)
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
