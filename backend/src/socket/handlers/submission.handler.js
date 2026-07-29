import { SubmissionAPI } from "../../services/api.service.js";

export const submitCode = async (payload) => {
  try {
    const res = await fetch(`${process.env.BACKEND_URI}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: payload.language,
        code: payload.code,
        testcases: payload.testcases,
        expected: payload.expected,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Submission error:", err instanceof Error ? err.message : String(err));
    return null;
  }
};

export const storeSubmission = async (userId, matchId, code, language, result) => {
  try {
    const axios = (await import("axios")).default;
    await axios.post(
      `${process.env.BACKEND_URI}/submission/add`,
      { user_id: userId, match_id: matchId, code, language, result },
      { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
    );
  } catch (err) {
    console.error("Error storing submission:", err instanceof Error ? err.message : String(err));
  }
};
