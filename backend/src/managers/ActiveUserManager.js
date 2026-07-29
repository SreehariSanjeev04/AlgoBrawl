/**
 * @typedef {Object} UserData
 * @property {number} id - The ID of the user
 * @property {string} username - The username of the user
 * @property {number} rating - The rating of the user
 * @property {string} socket_id - The socket ID of the user
 * @property {string|null} room_id - The ID of the room the user is in, or null if not in a room
 */

class ActiveUserManager {
  constructor() {
    /**
     * @type {Map<number, UserData>}
     */
    this.activeUsers = new Map();
  }
  /**
   *
   * @param {number} userId
   * @returns {UserData|null}
   */
  get(userId) {
    return this.activeUsers.get(userId);
  }

  /**
   * 
   * @param {number} userId 
   * @param {UserData} userData 
   * @returns {void}
   */
  set(userId, userData) {
    this.activeUsers.set(userId, userData);
  }
  /**
   * 
   * @param {number} userId 
   */
  remove(userId) {
    this.activeUsers.delete(userId);
  }

  /**
   * 
   * @param {number} userId 
   * @param {string|null} roomId 
   */
  updateRoom(userId, roomId) {
    const userData = this.activeUsers.get(userId);
    if (userData) {
      userData.room_id = roomId;
      this.activeUsers.set(userId, userData);
    }
  }

  /**
   * 
   * @param {number} userId 
   * @param {string} socketId 
   */
  updateSocketId(userId, socketId) {
    const userData = this.activeUsers.get(userId);
    if (userData) {
      userData.socket_id = socketId;
      this.activeUsers.set(userId, userData);
    }
  }
}

export default new ActiveUserManager();
