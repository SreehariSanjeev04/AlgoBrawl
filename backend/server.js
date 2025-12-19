import express, { json } from "express";
import cors from "cors";
import { config } from "dotenv";
config();
const app = express();
import execRouter from "./executor/executor.js";
import sequelize from "./database/db.js";
import userRouter from "./routes/UserRoutes.js";
import problemRouter from "./routes/ProblemRoutes.js";
import http from "http";
import initializeSocket from "./socket/socket.js";
import matchRouter from "./routes/MatchRoutes.js";
import submissionRouter from "./routes/SubmissionRoutes.js";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(json());
app.use(cookieParser());

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
app.use("/api/submission", submissionRouter);

initializeSocket(io)
const PORT = process.env.PORT || 3000;
const server = () => {
  try {
    sequelize.sync({ alter: true })
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
