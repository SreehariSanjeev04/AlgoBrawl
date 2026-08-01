import ActiveUserManager from "../../managers/ActiveUserManager.js";
import MatchManager from "../../managers/MatchManager.js";
import PendingConnections from "../../managers/PendingConnections.js";
import { finalizeMatchEloAndStore, transmitTime } from "./match.handler.js";

export const handleUserOnline = (io, user, socketId) => {
  const existingUser = ActiveUserManager.get(user.id);
  const currentRoomId = existingUser ? existingUser.room_id : null;

  ActiveUserManager.set(user.id, {
    ...user,
    socket_id: socketId,
    room_id: currentRoomId,
  });

  if (PendingConnections.contains(user.id)) {
    PendingConnections.stopTimeout(user.id);
    handleUserReconnection(io, user, socketId);
  }
};

const handleUserReconnection = (io, user, socketId) => {
  const userData = ActiveUserManager.get(user.id);
  if (!userData) return;

  ActiveUserManager.updateSocketId(user.id, socketId);

  const roomId = userData.room_id;
  if (roomId) {
    const playerSocket = io.sockets.sockets.get(socketId);
    playerSocket?.join(roomId);

    const match = MatchManager.get(roomId);
    if (match) {
      MatchManager.updateSocketId(roomId, user.id, socketId);
      if (match.timer) MatchManager.stopTimer(roomId);
      io.to(roomId).emit("match-resumed", { username: user.username });
      transmitTime(io, roomId, MatchManager.activeMatches);
    }
  }
};

export const handleUserDisconnection = (io, userId) => {
  if (!userId) {
    console.log("Disconnected socket had no associated user ID");
    return;
  }

  console.log(`User ${userId} disconnected`);

  const roomId = ActiveUserManager.get(userId)?.room_id;
  if (roomId) {
    io.to(roomId).emit("player-disconnected", {
      username: ActiveUserManager.get(userId)?.username,
    });
  }

  PendingConnections.set(userId, {
    timeout: setTimeout(async () => {
      console.log(`Removing user ${userId} after grace period`);
      const roomId = ActiveUserManager.get(userId)?.room_id;
      if (roomId) {
        const match = MatchManager.get(roomId);
        if (match && !match.finalized) {
          const winnerId = Object.keys(match.players).find(
            (id) => userId !== parseInt(id)
          );
          if (winnerId && !match.winner) {
            match.finalized = true;
            match.winner = parseInt(winnerId);
            try {
              await finalizeMatchEloAndStore(roomId, match, parseInt(winnerId), false);
              MatchManager.endMatch(roomId);
              io.to(roomId).emit("match-ended", { winner: parseInt(winnerId) });
            } catch (error) {
              match.finalized = false;
              console.error("Failed to finalize match after disconnect:", error instanceof Error ? error.message : String(error));
              io.to(roomId).emit("match-error", { message: "Failed to finalize match. Please try again." });
            }
          } else {
            MatchManager.endMatch(roomId);
            if (match.winner) {
              io.to(roomId).emit("match-ended", { winner: match.winner });
            }
          }
        }
      }
      ActiveUserManager.remove(userId);
      PendingConnections.remove(userId);
    }, 10000),
  });
};

export const pauseMatchOnDisconnect = (userId) => {
  const userData = ActiveUserManager.get(userId);
  const roomId = userData?.room_id;
  if (roomId) {
    const match = MatchManager.get(roomId);
    if (match && match.timer) {
      MatchManager.stopTimer(roomId);
    }
  }
};
