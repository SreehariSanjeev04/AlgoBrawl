import { MatchAPI, ProblemAPI, UserAPI } from "../../services/api.service.js";
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
      io.to(roomId).emit("time-up", {});
      if (match.timer) clearInterval(match.timer);
      match.timer = null;
    }
  }, 1000);
};

const storeMatch = async (roomId, problemId, player1Id, player2Id, winner) => {
  try {
    await MatchAPI.storeMatch(roomId, problemId, player1Id, player2Id, winner);
  } catch (error) {
    console.error(`[MatchHandler.storeMatch] Error storing match in room ${roomId}:`, error instanceof Error ? error.message : String(error));
  }
};

export const finalizeMatchEloAndStore = async (roomId, match, winner, isDraw) => {
  const [p1, p2] = Object.keys(match.players).map(Number);

  try {
    if (isDraw) {
      const { p1New, p2New } = calculateNewRatings(match.ratings[p1], match.ratings[p2], "draw");
      const detailsP1 = await UserAPI.fetch(p1);
      const detailsP2 = await UserAPI.fetch(p2);

      if (detailsP1) {
        await UserAPI.update(p1, p1New, detailsP1.matches_played + 1, detailsP1.wins);
      }
      if (detailsP2) {
        await UserAPI.update(p2, p2New, detailsP2.matches_played + 1, detailsP2.wins);
      }
    } else {
      const loser = winner === p1 ? p2 : p1;
      await storeMatch(roomId, match.problemId, p1, p2, winner);
      const { p1New, p2New } = calculateNewRatings(
        match.ratings[p1], match.ratings[p2], winner === p1 ? "p1" : "p2"
      );
      const detailsP1 = await UserAPI.fetch(p1);
      const detailsP2 = await UserAPI.fetch(p2);

      if (detailsP1) {
        await UserAPI.update(p1, p1New, detailsP1.matches_played + 1, winner === p1 ? detailsP1.wins + 1 : detailsP1.wins);
      }
      if (detailsP2) {
        await UserAPI.update(p2, p2New, detailsP2.matches_played + 1, winner === p2 ? detailsP2.wins + 1 : detailsP2.wins);
      }
    }
  } catch (error) {
    console.error("Error finalizing match Elo and storing:", error instanceof Error ? error.message : String(error));
  }
};
