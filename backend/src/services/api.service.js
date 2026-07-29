import axios from "axios";
import { env } from "../config/env.js";

const api = axios.create({
  baseURL: env.backendUri,
  headers: { "x-internal-secret": env.internalSecret },
});

export const UserAPI = {
  update: async (id, rating, matches, wins) => {
    try {
      const response = await api.patch("/user/update", {
        id, rating, matches_played: matches, wins,
      });
      return response.data;
    } catch (error) {
      console.error(`[UserApi.update] Failed for user ${id}:`, error instanceof Error ? error.message : String(error));
      throw new Error("Failed to sync user stats with database");
    }
  },

  fetch: async (id) => {
    try {
      const response = await api.get(`/user/${id}`);
      return response.data.user;
    } catch (error) {
      console.error(`[UserAPI.fetch] Error fetching user ${id}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  },
};

export const ProblemAPI = {
  fetchProblemByDifficulty: async (difficulty) => {
    try {
      const response = await api.get(`/problem/generate/${difficulty}`);
      return response.data;
    } catch (error) {
      console.error(`[ProblemAPI] Error fetching problem of difficulty ${difficulty}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  },
};

export const MatchAPI = {
  createMatch: async (roomId, players, problem) => {
    try {
      const response = await api.post("/match/create-match", { roomId, players, problem });
      return response.data;
    } catch (error) {
      console.error(`[MatchAPI.createMatch] Error creating match in room ${roomId}:`, error instanceof Error ? error.message : String(error));
      return { success: false, error: "Failed to create match" };
    }
  },

  storeMatch: async (roomId, problemId, player1Id, player2Id, winner) => {
    try {
      const response = await api.post("/match/store-match", {
        room_id: roomId, problem_id: problemId,
        player1_id: player1Id, player2_id: player2Id, winner,
      });
      return response.data;
    } catch (error) {
      console.error(`[MatchAPI.storeMatch] Error storing match in room ${roomId}:`, error instanceof Error ? error.message : String(error));
    }
  },
};

export const SubmissionAPI = {
  submitCode: async (language, code, testcases, expected) => {
    try {
      const res = await api.post("/submit", { language, code, testcases, expected });
      return res.data;
    } catch (error) {
      console.error(`[SubmissionAPI.submitCode] Error submitting code:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  },

  storeSubmission: async (userId, matchId, code, language, result) => {
    try {
      await api.post("/submission/add", {
        user_id: userId, match_id: matchId, code, language, result,
      });
    } catch (error) {
      console.error(`[SubmissionAPI.storeSubmission] Error storing submission for match ${matchId}:`, error instanceof Error ? error.message : String(error));
    }
  },
};
