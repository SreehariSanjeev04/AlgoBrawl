import { submissionService } from "../services/submission.service.js";

export const submissionController = {
  async add(req, res, next) {
    try {
      const { user_id, match_id, code, language, result } = req.body;
      if (!user_id || !match_id || !code || !language || !result) {
        return res.status(400).json({ error: "Incomplete details" });
      }
      const submission = await submissionService.create({ user_id, match_id, code, language, result });
      res.status(200).json({ submission });
    } catch (err) {
      next(err);
    }
  },
};
