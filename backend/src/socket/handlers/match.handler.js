import Match from "../../models/Match.js";
import User from "../../models/User.js";
import sequelize from "../../config/database.js";
import { MatchAPI, ProblemAPI } from "../../services/api.service.js";
import { calculateNewRatings } from "../../services/elo.service.js";
import MatchManager from "../../managers/MatchManager.js";
import ActiveUserManager from "../../managers/ActiveUserManager.js";

export const createMatch = async (roomId, player1, player2, difficulty, io, activeMatches) => {
  const problem = await ProblemAPI.fetchProblemByDifficulty(difficulty);
  if (!problem) {
    return { error: "Failed to generate problem for match", success: false };
  }

  try {
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
      finalized: false,
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
    console.error("Error creating match:", error instanceof Error ? error.message : String(error));
    return { error: "Failed to create match", success: false };
  }
};

export const transmitTime = (io, roomId, activeMatches) => {
  const match = activeMatches.get(roomId);
  if (!match || match.timer) return;

  match.timer = setInterval(() => {
    if (match.duration > 0) {
      io.to(roomId).emit("match-time", { duration: match.duration });
      match.duration--;
    } else {
      if (match.timer) clearInterval(match.timer);
      match.timer = null;
      handleMatchTimeout(io, roomId, match).catch((error) => {
        console.error("Timeout finalization error:", error instanceof Error ? error.message : String(error));
      });
    }
  }, 1000);
};

export const handleMatchTimeout = async (io, roomId, match) => {
  if (match.finalized || match.winner) return;

  const [p1, p2] = Object.keys(match.players).map(Number);
  const p1Approved = match.approved[p1] === true;
  const p2Approved = match.approved[p2] === true;
  const isDraw = p1Approved === p2Approved;
  const winner = isDraw ? null : (p1Approved ? p1 : p2);

  match.finalized = true;
  try {
    if (winner) {
      await finalizeMatchEloAndStore(roomId, match, winner, false);
    }
    io.to(roomId).emit("match-ended", { winner, isDraw });
    MatchManager.endMatch(roomId);
  } catch (error) {
    match.finalized = false;
    console.error("Error finalizing match on timeout:", error instanceof Error ? error.message : String(error));
    io.to(roomId).emit("match-error", { message: "Failed to finalize match. Please try submitting again." });
  }
};

export const finalizeMatchEloAndStore = async (roomId, match, winner, isDraw) => {
  const [p1, p2] = Object.keys(match.players).map(Number);
  if (!p1 || !p2) {
    throw new Error("Invalid match players during finalization");
  }

  await sequelize.transaction(async (tx) => {
    const { p1New, p2New } = isDraw
      ? calculateNewRatings(match.ratings[p1], match.ratings[p2], "draw")
      : calculateNewRatings(match.ratings[p1], match.ratings[p2], winner === p1 ? "p1" : "p2");

    const [p1User, p2User] = await Promise.all([
      User.findByPk(p1, { transaction: tx, attributes: ["id", "matches_played", "wins"] }),
      User.findByPk(p2, { transaction: tx, attributes: ["id", "matches_played", "wins"] }),
    ]);

    if (!p1User || !p2User) {
      throw new Error("User not found during finalizeMatchEloAndStore");
    }

    const p1Wins = winner === p1 ? (isDraw ? 0 : 1) : 0;
    const p2Wins = winner === p2 ? (isDraw ? 0 : 1) : 0;

    await Promise.all([
      User.update(
        { rating: p1New, matches_played: p1User.matches_played + 1, wins: p1User.wins + p1Wins },
        { where: { id: p1 }, transaction: tx }
      ),
      User.update(
        { rating: p2New, matches_played: p2User.matches_played + 1, wins: p2User.wins + p2Wins },
        { where: { id: p2 }, transaction: tx }
      ),
    ]);

    if (!isDraw) {
      await Match.create({
        room_id: roomId, problem_id: match.problemId,
        player1_id: p1, player2_id: p2, winner,
      }, { transaction: tx });
    }
  });
};
