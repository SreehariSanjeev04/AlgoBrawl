// @ts-check

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BACKEND = process.env.BACKEND_URI;
const SECRET = process.env.INTERNAL_SECRET;

/**
 * @typedef {Object} SubmissionPayload
 * @property {string} roomId
 * @property {number} userId
 * @property {string} code
 * @property {string} language
 * @property {Array<{input: string, output: string}>} testcases
 * @property {Array<string>} expected
 * @property {boolean} isAuto
 */

/**
 * Submits code for testing
 * @param {SubmissionPayload} payload
 * @returns {Promise<{output?: string, passed?: boolean}|null>}
 */
export const submitCode = async (payload) => {
  try {
    const res = await fetch(`${BACKEND}/api/submit`, {
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

/**
 * Stores submission result in database
 * @param {number} userId
 * @param {string} matchId
 * @param {string} code
 * @param {string} language
 * @param {string} result
 * @returns {Promise<void>}
 */
export const storeSubmission = async (userId, matchId, code, language, result) => {
  try {
    await axios.post(
      `${BACKEND}/submission/add`,
      {
        user_id: userId,
        match_id: matchId,
        code,
        language,
        result,
      },
      {
        headers: { "x-internal-secret": SECRET },
      }
    );
  } catch (err) {
    console.error("Error storing submission:", err instanceof Error ? err.message : String(err));
  }
};