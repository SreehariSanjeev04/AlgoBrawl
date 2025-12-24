// @ts-check

import ActiveUserManager from "../../managers/ActiveUserManager.js";
import MatchManager from "../../managers/MatchManager.js";
import PendingConnections from "../../managers/PendingConnections.js";
import { transmitTime } from "./matchController.js";

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {number} rating
 */

/**
 * Handles user coming online
 * @param {import("socket.io").Server} io
 * @param {User} user
 * @param {string} socketId
 */
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

/**
 * Handles user reconnection to match
 * @param {import("socket.io").Server} io
 * @param {User} user
 * @param {string} socketId
 */
export const handleUserReconnection = (io, user, socketId) => {
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
      // Timer will be restarted by caller
    }
  }
};

/**
 * Handles user disconnection with grace period
 * @param {number} userId
 * @param {import("socket.io").Server} io
 */
export const handleUserDisconnection = (io, userId) => {
  if (!userId) {
    console.log("Disconnected socket had no associated user ID");
    return;
  }

  console.log(`User ${userId} disconnected`);

  const roomId = ActiveUserManager.get(userId)?.room_id;
  if(roomId) {
    io.to(roomId).emit("player-disconnected", { username: ActiveUserManager.get(userId)?.username });
  }
  PendingConnections.set(userId, {
    timeout: setTimeout(() => {
      console.log(`Removing user ${userId} after grace period`);
      ActiveUserManager.remove(userId);
      PendingConnections.remove(userId);
    }, 10000),
  });
};

/**
 * Pauses match timer on player disconnect
 * @param {number} userId
 */
export const pauseMatchOnDisconnect = (userId) => {
  const userData = ActiveUserManager.get(userId);
  const roomId = userData?.room_id;
  console.log(`Pausing match timer for user ${userId} in room ${roomId}`);
  if (roomId) {
    const match = MatchManager.get(roomId);
    if (match && match.timer) {
      MatchManager.stopTimer(roomId);
      console.log(`Paused timer for room ${roomId} due to player disconnect`);
    } else console.log(`No active timer to pause for room ${roomId}`);
  }
};