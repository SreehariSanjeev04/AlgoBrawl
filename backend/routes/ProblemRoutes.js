import { where } from "sequelize";
import Problem from "../models/Problem.js";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const problems = await Problem.findAll();
    res.status(200).json(problems);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/generate/:difficulty", async (req, res) => {
  try {
    const { difficulty = "Easy" } = req.params;

    const problems = await Problem.findAll({
      where: {
        difficulty,
      }, limit: 50,
    });

    const randomInt = Math.floor(Math.random() * problems.length);
    res.status(200).json(problems[randomInt]);
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { title, description, difficulty, language, testcases, judge_type } = req.body;
    const problem = await Problem.create({
      title,
      description,
      difficulty,
      language,
      testcases,
      judge_type
    });
    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ error: "Failed to add problem" });
  }
});

export default router;