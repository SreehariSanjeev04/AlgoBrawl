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
import { SubmissionAPI } from "../services/api.service.js";

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
        "submit-solution", // have to go over this once again
        async ({
          roomId,
          userId,
          code,
          language,
          testcases,
          expected,
          isAuto,
        }) => {
          const match = MatchManager.get(roomId);
          if (!match || match.winner) return;

          try {
            const result = await SubmissionAPI.submitCode(
              language,
              code,
              testcases,
              expected
            );

            if (!result) {
              socket.emit("solution-feedback", {
                passed: false,
                message: "Server error while executing code.",
              });
              return;
            }

            let approved = false;

            if (result.output) {
              approved = result.passed === true;
            }

            match.submitted[userId] = true;
            match.approved[userId] = approved;
            match.isAutoSubmit[userId] = isAuto || false;

            await storeSubmission(
              parseInt(userId),
              roomId,
              code,
              language,
              approved ? "Approved" : "Not Approved"
            );

            const opponent = Object.keys(match.players).map(Number).find(
              (u) => u !== userId
            );

            if (approved && !match.winner) {
              match.winner = userId;
              await finalizeMatchEloAndStore(roomId, match, userId, false);
              return;
            }

            const bothSubmitted =
              match.submitted[userId] &&
              (opponent ? match.submitted[opponent] : false);
            const bothAuto =
              match.isAutoSubmit[userId] && (opponent ? match.isAutoSubmit[opponent] : false);
            const bothFailed =
              !match.approved[userId] && (opponent ? !match.approved[opponent] : false);
            if (bothSubmitted && !match.winner) {
              if (opponent && match.approved[opponent]) {
                match.winner = opponent;
                await finalizeMatchEloAndStore(roomId, match, opponent, false);
              } else if (bothAuto && bothFailed) {
                console.log("Both players failed, ending match as a draw");
                await finalizeMatchEloAndStore(roomId, match, userId, true);
              }
              MatchManager.endMatch(roomId);
            } else if (!approved) {
              console.log("Reached here with non-approved submission");
              io.to(socket.id).emit("solution-feedback", {
                passed: false,
                message: "Incorrect output. Try again.",
              });

              if (!match.isAutoSubmit[userId]) {
                match.approved[userId] = false;
                match.isAutoSubmit[userId] = false;
                match.submitted[userId] = false;
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[Code Submission]Submission error:", errorMessage);
            io.to(socket.id).emit("solution-feedback", {
              passed: false,
              message: "Server error while executing code.",
            });
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
