import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import "./src/database/associations.js";
import initializeSocket from "./src/socket/index.js";
import { env } from "./src/config/env.js";

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.cors.origin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initializeSocket(io);

const start = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced");

    httpServer.listen(env.port, () => {
      console.log(`Server listening to PORT ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
