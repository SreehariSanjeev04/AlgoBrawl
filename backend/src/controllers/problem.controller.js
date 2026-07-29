import { problemService } from "../services/problem.service.js";

export const problemController = {
  async getAll(req, res, next) {
    try {
      const problems = await problemService.findAll();
      res.status(200).json(problems);
    } catch (err) {
      next(err);
    }
  },

  async getByDifficulty(req, res, next) {
    try {
      const { difficulty = "Easy" } = req.params;
      const problem = await problemService.findByDifficulty(difficulty);
      if (!problem) return res.status(404).json({ error: "No problems found for this difficulty" });
      res.status(200).json(problem);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, difficulty, language, testcases, judge_type } = req.body;
      const problem = await problemService.create({ title, description, difficulty, language, testcases, judge_type });
      res.status(201).json(problem);
    } catch (err) {
      next(err);
    }
  },
};
