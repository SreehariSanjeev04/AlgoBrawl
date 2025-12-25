// @ts-check

import crypto from "crypto";
import axios from "axios";
import { MatchAPI, ProblemAPI, UserAPI } from "../../services/api.service.js";
import { calculateNewRatings } from "../../services/eloService.js";
import MatchManager from "../../managers/MatchManager.js";
import dotenv from "dotenv";
import { error } from "console";
import ActiveUserManager from "../../managers/ActiveUserManager.js";

dotenv.config();

const BACKEND = process.env.BACKEND_URI;
const SECRET = process.env.INTERNAL_SECRET;

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} socketId
 * @property {number} rating
 */

/**
 * @typedef {Object} MatchData
 * @property {Object.<number, string>} players
 * @property {Object.<number, number>} ratings
 * @property {number} problemId
 * @property {number|null} winner
 * @property {Object.<number, boolean>} submitted
 * @property {Object.<number, boolean>} isAutoSubmit
 * @property {Object.<number, boolean>} approved
 * @property {number} duration
 * @property {NodeJS.Timeout|null} timer
 */

/**
 * Creates a match and initializes match data
 * @param {string} roomId
 * @param {Player} player1
 * @param {Player} player2
 * @param {string} difficulty
 * @param {import("socket.io").Server} io
 * @param {Map<string, MatchData>} activeMatches
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createMatch = async (
  roomId,
  player1,
  player2,
  difficulty,
  io,
  activeMatches
) => {
  const problem = await ProblemAPI.fetchProblemByDifficulty(difficulty);
  if (!problem) {
    return { error: "Failed to generate problem for match", success: false };
  }

  try {
    const roomDetails = {
      roomId,
      players: [player1.id, player2.id],
      problem,
    };

    console.log("Creating match with details:", roomDetails);

    await MatchAPI.createMatch(roomId, [player1.id, player2.id], problem);

    activeMatches.set(roomId, {
      players: {
        [player1.id]: player1.socketId,
        [player2.id]: player2.socketId,
      },
      ratings: {
        [player1.id]: player1.rating,
        [player2.id]: player2.rating,
      },
      problemId: problem.id,
      winner: null,
      submitted: {
        [player1.id]: false,
        [player2.id]: false,
      },
      isAutoSubmit: {
        [player1.id]: false,
        [player2.id]: false,
      },
      approved: {
        [player1.id]: false,
        [player2.id]: false,
      },
      duration: 15 * 60,
      timer: null,
    });

    ActiveUserManager.updateRoom(player1.id, roomId);
    ActiveUserManager.updateRoom(player2.id, roomId);

    [player1, player2].forEach(({ socketId }) => {
      const playerSocket = io.sockets.sockets.get(socketId);
      playerSocket?.join(roomId);
    });

    io.to(roomId).emit("match-started", { roomId });
    return { success: true };
  } catch (error) {
    console.error(
      "Error creating match:",
      error instanceof Error ? error.message : String(error)
    );
    return { error: "Failed to create match", success: false };
  }
};

/**
 * Transmits remaining match time to players
 * @param {import("socket.io").Server} io
 * @param {string} roomId
 * @param {Map<string, MatchData>} activeMatches
 */
export const transmitTime = (io, roomId, activeMatches) => {
  const match = activeMatches.get(roomId);
  if (!match || match.timer) return;

  match.timer = setInterval(() => {
    if (match.duration > 0) {
      io.to(roomId).emit("match-time", { duration: match.duration });
      match.duration--;
    } else {
      io.to(roomId).emit("time-up", {});
      if (match.timer) clearInterval(match.timer);
      match.timer = null;
    }
  }, 1000);
};

/**
 * Finalizes match Elo ratings and stores results
 * @param {string} roomId
 * @param {MatchData} match
 * @param {number} winner
 * @param {boolean} isDraw
 * @returns {Promise<void>}
 */
export const finalizeMatchEloAndStore = async (
  roomId,
  match,
  winner,
  isDraw
) => {
  const [p1, p2] = Object.keys(match.players).map(Number);

  try {
    if (isDraw) {
      await storeMatch(roomId, match.problemId, p1, p2, null); // storing match details

      const { p1New, p2New } = calculateNewRatings(
        match.ratings[p1],
        match.ratings[p2],
        "draw"
      );

      const details_p1 = await UserAPI.fetch(p1);
      const details_p2 = await UserAPI.fetch(p2);

      if (details_p1) {
        await UserAPI.update(
          p1,
          p1New,
          details_p1.matches_played + 1,
          details_p1.wins
        );
      }
      if (details_p2) {
        await UserAPI.update(
          p2,
          p2New,
          details_p2.matches_played + 1,
          details_p2.wins
        );
      }
    } else {
      const loser = winner === p1 ? p2 : p1;

      await storeMatch(roomId, match.problemId, p1, p2, winner); // storing the match details
      const { p1New, p2New } = calculateNewRatings(
        match.ratings[p1],
        match.ratings[p2],
        winner === p1 ? "p1" : "p2"
      );

      const details_p1 = await UserAPI.fetch(p1);
      const details_p2 = await UserAPI.fetch(p2);

      if (details_p1) {
        await UserAPI.update(
          p1,
          p1New,
          details_p1.matches_played + 1,
          winner === p1 ? details_p1.wins + 1 : details_p1.wins
        );
      }
      if (details_p2) {
        await UserAPI.update(
          p2,
          p2New,
          details_p2.matches_played + 1,
          winner === p2 ? details_p2.wins + 1 : details_p2.wins
        );
      }
    }
  } catch (error) {
    console.error(
      "Error finalizing match Elo and storing:",
      error instanceof Error ? error.message : String(error)
    );
  }
};
/**
 * 
 * @param {string} room_id 
 * @param {number} problem_id 
 * @param {number} player1_id 
 * @param {number} player2_id 
 * @param {number|null} winner 
 */
const storeMatch = async (room_id, problem_id , player1_id, player2_id, winner) => {
  try {
    const res = await MatchAPI.storeMatch(room_id, problem_id, player1_id, player2_id, winner);
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[MatchController.storeMatch] Error storing match in room ${room_id}:`, errorMessage);
  }
}
