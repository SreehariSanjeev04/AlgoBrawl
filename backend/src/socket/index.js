import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import ActiveUserManager from "../managers/ActiveUserManager.js";
import MatchManager from "../managers/MatchManager.js";
import BucketQueue from "../matchmaking/BucketQueue.js";
import Problem from "../models/Problem.js";
import {
  createMatch,
  transmitTime,
  finalizeMatchEloAndStore,
} from "./handlers/match.handler.js";
import { SubmissionAPI } from "../services/api.service.js";
import {
  handleUserOnline,
  handleUserDisconnection,
  pauseMatchOnDisconnect,
} from "./handlers/connection.handler.js";

const bucketQueue = new BucketQueue(600, 2000);

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  jwt.verify(token, env.jwtSecret, (err, user) => {
    if (err) return next(new Error("Invalid or expired token"));
    socket.user_id = user.id;
    socket.username = user.username;
    socket.rating = user.rating;
    next();
  });
};

const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("online", () => {
      const identity = {
        id: socket.user_id,
        username: socket.username,
        rating: socket.rating,
      };
      handleUserOnline(io, identity, socket.id);
    });

    socket.on("join-matchmaking", async (user) => {
      try {
        const { rating, id } = user ?? {};
        if (!Number.isInteger(id) || id !== socket.user_id || !Number.isFinite(rating)) {
          socket.emit("matchmaking-error", { message: "Invalid matchmaking details" });
          return;
        }

        bucketQueue.enqueue(rating, id, socket.id);

        for (let attempt = 0; attempt < 10; attempt++) {
          const pair = bucketQueue.tryMatch();
          if (!pair) break;

          const p1Socket = io.sockets.sockets.get(pair.p1.socketId);
          const p2Socket = io.sockets.sockets.get(pair.p2.socketId);
          if (!p1Socket || !p2Socket) {
            if (p1Socket) bucketQueue.enqueue(pair.p1.rating, pair.p1.id, pair.p1.socketId);
            if (p2Socket) bucketQueue.enqueue(pair.p2.rating, pair.p2.id, pair.p2.socketId);
            continue;
          }

          const roomId = crypto.randomUUID();
          const matchResult = await createMatch(
            roomId, pair.p1, pair.p2, "Easy", io, MatchManager.activeMatches
          );

          if (!matchResult.success) {
            bucketQueue.enqueue(pair.p1.rating, pair.p1.id, pair.p1.socketId);
            bucketQueue.enqueue(pair.p2.rating, pair.p2.id, pair.p2.socketId);
            continue;
          }

          transmitTime(io, roomId, MatchManager.activeMatches);
          break;
        }
      } catch (error) {
        console.error("[Join Matchmaking] Error:", error instanceof Error ? error.message : String(error));
      }
    });

    socket.on("leave-matchmaking", (payload, callback) => {
      try {
        const res = bucketQueue.remove(payload.id);
        callback({
          status: res === true ? "ok" : "error",
          message: res === true ? "Left matchmaking successfully" : "Error leaving matchmaking",
        });
      } catch (error) {
        console.error("[Leave Matchmaking] Error:", error instanceof Error ? error.message : String(error));
        callback({ status: "error", message: "Error leaving matchmaking" });
      }
    });

    socket.on("submit-solution", async ({ roomId, userId, code, language, isAuto }, callback) => {
      userId = Number(userId);
      if (!Number.isInteger(userId) || userId !== socket.user_id) {
        callback({ status: "error", message: "Unauthorized submission" });
        return;
      }

      const match = MatchManager.get(roomId);
      if (!match || match.winner) {
        callback({ status: "error", message: "Match not found or already ended" });
        return;
      }
      if (!match.players[userId]) {
        callback({ status: "error", message: "You are not a player in this match" });
        return;
      }
      if (match.submitted[userId]) {
        callback({ status: "error", message: "You have already submitted" });
        return;
      }

      callback({ status: "ok", message: "Submission received" });
      match.submitted[userId] = true;

      try {
        const problem = await Problem.findByPk(match.problemId);
        if (!problem) {
          match.submitted[userId] = false;
          socket.emit("solution-feedback", { passed: false, message: "Server error while preparing the problem." });
          return;
        }

        const testcases = (problem.testcases ?? [])
          .map((tc) => tc.input)
          .join("\n");
        const expected = (problem.testcases ?? [])
          .map((tc) => tc.output)
          .join("\n") + "\n";

        const result = await SubmissionAPI.submitCode(
          language, code, testcases, expected, problem.judge_type
        );
        if (!result) {
          match.submitted[userId] = false;
          socket.emit("solution-feedback", { passed: false, message: "Server error while executing code." });
          return;
        }

        const approved = result.passed === true;
        match.approved[userId] = approved;
        match.isAutoSubmit[userId] = isAuto || false;

        await SubmissionAPI.storeSubmission(
          userId, roomId, code, language, approved ? "Approved" : "Not Approved"
        );

        const opponent = Object.keys(match.players).map(Number).find((u) => u !== userId);
        if (!opponent) {
          match.finalized = true;
          try {
            await finalizeMatchEloAndStore(roomId, match, userId, false);
            io.to(roomId).emit("match-ended", { winner: userId });
            MatchManager.endMatch(roomId);
          } catch (error) {
            match.finalized = false;
            console.error("[Code Submission] Finalize error:", error instanceof Error ? error.message : String(error));
            socket.emit("solution-feedback", { passed: false, message: "Server error while finalizing. Please try again." });
          }
          return;
        }

        let finalWinner = null;
        let shouldMatchEnd = false;
        let isDraw = false;

        const bothSubmitted = match.submitted[userId] && match.submitted[opponent];
        const bothFailed = !match.approved[userId] && !match.approved[opponent];
        const bothPassed = match.approved[userId] && match.approved[opponent];

        if (approved) {
          if (match.winner) return;
          finalWinner = userId;
          match.winner = userId;
          shouldMatchEnd = true;
        } else if (isAuto && bothSubmitted) {
          if (bothPassed || bothFailed) {
            isDraw = true;
          } else {
            finalWinner = match.approved[userId] ? userId : opponent;
            match.winner = finalWinner;
          }
          shouldMatchEnd = true;
        } else if (!isAuto && !approved) {
          match.submitted[userId] = false;
          socket.emit("solution-feedback", { passed: false, message: "Solution not approved. Try again." });
        }

        if (shouldMatchEnd) {
          match.finalized = true;
          try {
            await finalizeMatchEloAndStore(roomId, match, finalWinner, isDraw);
            io.to(roomId).emit("match-ended", { winner: finalWinner, isDraw });
            MatchManager.endMatch(roomId);
          } catch (error) {
            match.finalized = false;
            match.submitted[userId] = false;
            console.error("[Code Submission] Finalize error:", error instanceof Error ? error.message : String(error));
            socket.emit("solution-feedback", { passed: false, message: "Server error while finalizing. Please try again." });
          }
        }
      } catch (error) {
        console.error("[Code Submission] Submission error:", error instanceof Error ? error.message : String(error));
        socket.emit("solution-feedback", { passed: false, message: "Server error while executing code." });
        match.submitted[userId] = false;
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.user_id;
      if (userId) {
        bucketQueue.remove(userId);
      }
      handleUserDisconnection(io, userId);
      pauseMatchOnDisconnect(userId);
    });
  });
};

export default initializeSocket;
