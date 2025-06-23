const { where } = require("sequelize");
const Problem = require("../models/Problem");
const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const problems = await Problem.findAll();
    res.status(200).json(problems);
  } catch (err) {}
});

router.get("/generate", async (req, res) => {
  try {
    const { difficulty = "Easy" } = req.query;

    const problems = await Problem.findAll({
      where: {
        difficulty,
      },
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
    const { title, description, difficulty, language, testcases } = req.body;
    const problem = await Problem.create({
      title,
      description,
      difficulty,
      language,
      testcases,
    });
    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ error: "Failed to add problem" });
  }
});

module.exports = router