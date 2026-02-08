// @ts-check

import crypto from "crypto";
import ActiveUserManager from "../managers/ActiveUserManager.js";
import MatchManager from "../managers/MatchManager.js";
import BucketQueue from "../matchmaking/BucketQueue.js";
import PendingConnections from "../managers/PendingConnections.js";
import axios from "axios";
import dotenv from "dotenv";

// Controllers
import {
  createMatch,
  transmitTime,
  finalizeMatchEloAndStore,
} from "./controllers/matchController.js";
import {
  submitCode,
  storeSubmission,
} from "./controllers/submissionController.js";
import {
  handleUserOnline,
  handleUserReconnection,
  handleUserDisconnection,
  pauseMatchOnDisconnect,
} from "./controllers/connectionController.js";
import { Socket } from "dgram";
import { MatchAPI, SubmissionAPI } from "../services/api.service.js";

dotenv.config();

const BACKEND = process.env.BACKEND_URI;
const SECRET = process.env.INTERNAL_SECRET;
const bucketQueue = new BucketQueue(600, 2000);

/** @typedef {import('socket.io').Socket & { user_id: string }} CustomSocket */

/**
 * Initializes socket.io server and handles events
 * @param {import("socket.io").Server} io
 */
const initializeSocket = (io) => {
  io.on(
    "connection",
    /** @type {Socket} */ (socket) => {
      socket.on("online", async (user) => {
        // @ts-ignore
        socket.user_id = user.id;
        handleUserOnline(io, user, socket.id);
      });

      socket.on("join-matchmaking", async (user) => {
        console.log("Joining matchmaking:", user);
        bucketQueue.enqueue(user.rating, user.id, socket.id);
        console.log("Bucket Queue Size:", bucketQueue.size());

        if (bucketQueue.hasAtleastTwoPlayers()) {
          console.log("Attempting to find match...");
          const player1 = bucketQueue.dequeueNextPlayer();
          const player2 =
            player1 !== null
              ? bucketQueue.findOpponentNode(player1.rating)
              : null;

          if (player1 !== null && player2 !== null) {
            console.log("Found two players:", player1, player2);
            const roomId = crypto.randomUUID();

            const matchResult = await createMatch(
              roomId,
              player1,
              player2,
              "Easy",
              io,
              MatchManager.activeMatches
            );

            if (!matchResult.success) {
              console.error("Match creation failed:", matchResult.error);
            } else {
              console.log("Match created with Room ID:", roomId);
              transmitTime(io, roomId, MatchManager.activeMatches); // Pass activeMatches map
            }
          }
        }
      });

      socket.on("leave-matchmaking", (payload, callback) => {
        console.log("Leaving matchmaking:", payload.id);
        const res = bucketQueue.remove(payload.id);
        callback({
          status: res === true ? "ok" : "error",
          message:
            res === true
              ? "Left matchmaking successfully"
              : "Error leaving matchmaking",
        });
      });

      socket.on(
        "submit-solution", // requires locks for better processing
        async (
          {
            roomId,
            userId,
            code,
            language,
            testcases,
            expected,
            isAuto, // automatic submission when the timer runs out
          },
          callback
        ) => {
          callback({
            // callback to acknowledge receipt of submission
            status: "ok",
            message: "Submission received",
          });
          const match = MatchManager.get(roomId);
          if (!match || match.winner) return;
          if (match.submitted[userId]) {
            return; // already submitted, ignore further submissions
          }
          match.submitted[userId] = true;

          userId = Number(userId);
          try {
            const result = await SubmissionAPI.submitCode(
              language,
              code,
              testcases,
              expected
            );

            if (!result) {
              match.submitted[userId] = false;
              socket.emit("solution-feedback", {
                passed: false,
                message: "Server error while executing code.",
              });
              return;
            }

            const approved = result.passed === true;
            match.approved[userId] = approved;
            match.isAutoSubmit[userId] = isAuto || false;

            await SubmissionAPI.storeSubmission(
              userId,
              roomId,
              code,
              language,
              approved ? "Approved" : "Not Approved"
            );

            const opponent = Object.keys(match.players)
              .map(Number)
              .find((u) => u !== userId);

            if (!opponent) {
              // go thru this logic
              io.to(roomId).emit("match-ended", { winner: userId });
              finalizeMatchEloAndStore(roomId, match, userId, false); // user wins by default, no match stored
              MatchManager.endMatch(roomId);
              return;
            } // solo match, no opponent to compare with

            let finalWinner = null;
            let shouldMatchEnd = false;
            let isDraw = false;

            const bothSubmitted =
              match.submitted[userId] && match.submitted[opponent];
            const bothFailed =
              !match.approved[userId] && !match.approved[opponent];
            const bothPassed =
              match.approved[userId] && match.approved[opponent];

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
              socket.emit("solution-feedback", {
                passed: false,
                message: "Solution not approved. Try again.",
              });
            }

            if (shouldMatchEnd) {
              await MatchAPI.storeMatch(
                roomId,
                match.problemId,
                userId,
                opponent,
                finalWinner
              );
              await finalizeMatchEloAndStore(
                roomId,
                match,
                finalWinner,
                isDraw
              );

              io.to(roomId).emit("match-ended", {
                winner: finalWinner,
                isDraw,
              });
              MatchManager.endMatch(roomId);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("[Code Submission] Submission error:", errorMessage);
            io.to(socket.id).emit("solution-feedback", {
              passed: false,
              message: "Server error while executing code.",
            });
            match.submitted[userId] = false;
          }
        }
      );

      socket.on("disconnect", () => {
        // @ts-ignore
        const userId = socket.user_id;
        handleUserDisconnection(io, userId);
        pauseMatchOnDisconnect(userId);
      });
    }
  );
};

export default initializeSocket;
