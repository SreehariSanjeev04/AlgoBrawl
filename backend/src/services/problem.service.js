import Problem from "../models/Problem.js";

export const problemService = {
  async findAll() {
    return Problem.findAll();
  },

  async findByDifficulty(difficulty = "Easy") {
    const problems = await Problem.findAll({
      where: { difficulty },
      limit: 50,
    });
    if (problems.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * problems.length);
    return problems[randomIndex];
  },

  async create(data) {
    return Problem.create(data);
  },
};
