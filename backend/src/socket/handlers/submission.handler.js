import axios from "axios";
import { env } from "../../config/env.js";

export const submitCode = async (payload) => {
  try {
    const res = await axios.post(
      `${env.backendUri}/submit`,
      {
        language: payload.language,
        code: payload.code,
        testcases: payload.testcases,
        expected: payload.expected,
      },
      { headers: { "x-internal-secret": env.internalSecret } }
    );
    return res.data;
  } catch (err) {
    console.error("Submission error:", err instanceof Error ? err.message : String(err));
    return null;
  }
};

export const storeSubmission = async (userId, matchId, code, language, result) => {
  try {
    await axios.post(
      `${env.backendUri}/submission/add`,
      { user_id: userId, match_id: matchId, code, language, result },
      { headers: { "x-internal-secret": env.internalSecret } }
    );
  } catch (err) {
    console.error("Error storing submission:", err instanceof Error ? err.message : String(err));
  }
};
