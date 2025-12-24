// @ts-check
import axios from "axios";

const api = axios.create({
  baseURL: process.env.BACKEND_URI,
  headers: { "x-internal-secret": process.env.INTERNAL_SECRET }
});

/**
 * @typedef {Object} UserUpdateResponse
 * @property {boolean} success
 * @property {string} [message]
 */

/**
 * @typedef User
 * @property {number} id 
 * @property {string} username
 * @property {number} rating
 * @property {number} matches_played
 * @property {number} wins
 * 
 */

export const UserAPI = {
  /**
   * @param {string|number} id 
   * @param {number} rating 
   * @param {number} matches 
   * @param {number} wins 
   * @throws {Error}
   * @returns {Promise<UserUpdateResponse>}
   */
  update: async (id, rating, matches, wins) => {
    /**
     * @throws {Error}
     */
    try {
      const response = await api.patch('/user/update', { 
        id, 
        rating, 
        matches_played: matches, 
        wins 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[UserApi.update] Failed for user ${id}:`, errorMessage);
      throw new Error("Failed to sync user stats with database");
    }
  },

  /**
   * 
   * @param {number} id 
   * @returns {Promise<User | null>}
   */

  fetch: async (id) => {
    try {
      const response = await api.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[UserAPI.fetch] Error fetching user ${id}:`, errorMessage);
      return null;
    }
  }
};

/**
 * @typedef Problem
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} difficulty
 * @property {Array<{input: string, output: string}>} testcases
 */

export const ProblemAPI = {
    /**
     * 
     * @param {string} difficulty 
     * @returns {Promise<Problem | null>}
     */
    fetchProblemByDifficulty: async (difficulty) => {
        try {
            const response = await api.get(`/problem/generate/${difficulty}`); // fix
            return response.data;
        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ProblemAPI.fetchProblemByDifficulty] Error fetching problem of difficulty ${difficulty}:`, errorMessage);
            return null;
        }
    }
}

export const MatchAPI = {
    // implementation required 
    /**
     * 
     * @param {string} roomId 
     * @param {Array<number>} players 
     * @param {Object} problem 
     * @returns 
     */
    createMatch: async (roomId, players, problem) => {
        try {
            const response = await api.post('/match/create-match', {
                roomId,
                players,
                problem
            });
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[MatchAPI.createMatch] Error creating match in room ${roomId}:`, errorMessage);
            return { success: false, error: "Failed to create match" };
        }
    }
}