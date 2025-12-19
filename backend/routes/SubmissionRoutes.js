import Submission from "../models/Submission.js";
import express from "express";
const router = express.Router();

router.post("/add", async (req, res) => {
  const secret = req.headers["x-internal-secret"];

  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({
      error: "Secret Invalid",
    });
  }
  try {
    const { user_id, match_id, code, language, result } = req.body;

    if (!user_id || !match_id || !code || !language || !result) {
      return res.status(400).json({
        error: "Incomplete details",
      });
    }

    const submission = await Submission.create({
      user_id,
      match_id,
      code,
      language,
      result,
    });

    res.status(200).json({submission});
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

export default router