/**
 * @typedef ActiveMatch
 * @property {string} roomId - The ID of the match room
 * @property {Object<number, string>} players - The usernames of the players in the match
 * @property {Object<number, number>} ratings - The ratings of the players
 * @property {number} problemId - The ID of the problem being solved
 * @property {number} duration - The remaining duration of the match in seconds
 * @property {NodeJS.Timeout|null} timer - The timer interval for the match
 * @property {number|null} winner - The ID of the winning player, or null if the match is ongoing
 * @property {Object<number,boolean>} submitted - An object mapping user IDs to their submission status
 * @property {Object<number,boolean>} approved - An object mapping user IDs to their approval status
 * @property {Object<number,boolean>} isAutoSubmit - An object mapping user IDs to their auto-submit status
 */

class MatchManager {
  constructor() {
    /**
     * @type {Map<string, ActiveMatch>}
     */
    this.activeMatches = new Map();
  }

  /**
   *
   * @param {string} roomId
   * @returns {ActiveMatch|null}
   */
  get(roomId) {
    return this.activeMatches.get(roomId);
  }

  /**
   * 
   * @param {string} roomId 
   * @param {ActiveMatch} matchData 
   */
  set(roomId, matchData) {
    this.activeMatches.set(roomId, matchData);
  }

  /**
   * 
   * @param {Object} io 
   * @param {string} roomId 
   * @returns {void}
   */

  startTimer(io, roomId) {
    const match = this.activeMatches.get(roomId);
    if (!match) return;

    match.timer = setInterval(() => {
      if (match.duration > 0) {
        match.duration--;
        io.to(roomId).emit("match-time", { duration: match.duration });
      } else {
        this.stopTimer(roomId);
        io.to(roomId).emit("time-up");
      }
    }, 1000);
  }

  /**
   * 
   * @param {string} roomId 
   * @returns {void}
   */
  stopTimer(roomId) {
    const match = this.activeMatches.get(roomId);
    if (!match || !match.timer) return;
    clearInterval(match.timer);
    match.timer = null;
  }
  /**
   * 
   * @param {string} roomId 
   */
  endMatch(roomId) {
    this.stopTimer(roomId);
    this.activeMatches.delete(roomId);
  }

  /**
   * 
   * @param {string} roomId 
   * @param {number} userId 
   * @param {string} socketId 
   */

  updateSocketId(roomId, userId, socketId) {
    this.activeMatches.get(roomId).players[userId] = socketId;
  }
}

export default new MatchManager();
