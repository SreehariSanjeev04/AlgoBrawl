import crypto from "crypto";
import ActiveUserManager from "../managers/ActiveUserManager.js";
import MatchManager from "../managers/MatchManager.js";
import BucketQueue from "../matchmaking/BucketQueue.js";
import {
  createMatch,
  transmitTime,
  finalizeMatchEloAndStore,
} from "./handlers/match.handler.js";
import {
  submitCode,
  storeSubmission,
} from "./handlers/submission.handler.js";
import {
  handleUserOnline,
  handleUserDisconnection,
  pauseMatchOnDisconnect,
} from "./handlers/connection.handler.js";
import { SubmissionAPI } from "../services/api.service.js";

const bucketQueue = new BucketQueue(600, 2000);

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("online", (user) => {
      socket.user_id = user.id;
      handleUserOnline(io, user, socket.id);
    });

    socket.on("join-matchmaking", async (user) => {
      console.log("Joining matchmaking:", user);
      bucketQueue.enqueue(user.rating, user.id, socket.id);
      console.log("Bucket Queue Size:", bucketQueue.size());

      const pair = bucketQueue.tryMatch();
      if (!pair) return;

      console.log("Found two players:", pair.p1, pair.p2);
      const roomId = crypto.randomUUID();

      const matchResult = await createMatch(
        roomId, pair.p1, pair.p2, "Easy", io, MatchManager.activeMatches
      );

      if (!matchResult.success) {
        console.error("Match creation failed:", matchResult.error);
        bucketQueue.enqueue(pair.p1.rating, pair.p1.id, pair.p1.socketId);
        bucketQueue.enqueue(pair.p2.rating, pair.p2.id, pair.p2.socketId);
      } else {
        console.log("Match created with Room ID:", roomId);
        transmitTime(io, roomId, MatchManager.activeMatches);
      }
    });

    socket.on("leave-matchmaking", (payload, callback) => {
      console.log("Leaving matchmaking:", payload.id);
      const res = bucketQueue.remove(payload.id);
      callback({
        status: res === true ? "ok" : "error",
        message: res === true ? "Left matchmaking successfully" : "Error leaving matchmaking",
      });
    });

    socket.on("submit-solution", async (
      { roomId, userId, code, language, testcases, expected, isAuto },
      callback
    ) => {
      callback({ status: "ok", message: "Submission received" });
      const match = MatchManager.get(roomId);
      if (!match || match.winner) return;
      if (match.submitted[userId]) return;
      match.submitted[userId] = true;

      userId = Number(userId);
      try {
        const result = await SubmissionAPI.submitCode(language, code, testcases, expected);
        if (!result) {
          match.submitted[userId] = false;
          socket.emit("solution-feedback", { passed: false, message: "Server error while executing code." });
          return;
        }

        const approved = result.passed === true;
        match.approved[userId] = approved;
        match.isAutoSubmit[userId] = isAuto || false;

        await SubmissionAPI.storeSubmission(userId, roomId, code, language, approved ? "Approved" : "Not Approved");

        const opponent = Object.keys(match.players).map(Number).find((u) => u !== userId);
        if (!opponent) {
          io.to(roomId).emit("match-ended", { winner: userId });
          finalizeMatchEloAndStore(roomId, match, userId, false);
          MatchManager.endMatch(roomId);
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
          await finalizeMatchEloAndStore(roomId, match, finalWinner, isDraw);
          io.to(roomId).emit("match-ended", { winner: finalWinner, isDraw });
          MatchManager.endMatch(roomId);
        }
      } catch (error) {
        console.error("[Code Submission] Submission error:", error instanceof Error ? error.message : String(error));
        io.to(socket.id).emit("solution-feedback", { passed: false, message: "Server error while executing code." });
        match.submitted[userId] = false;
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.user_id;
      handleUserDisconnection(io, userId);
      pauseMatchOnDisconnect(userId);
    });
  });
};

export default initializeSocket;
