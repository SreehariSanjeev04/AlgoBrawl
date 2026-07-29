import { Sequelize } from "sequelize";
import Problem from "../models/Problem.js";

export const problemService = {
  async findAll() {
    return Problem.findAll();
  },

  async findByDifficulty(difficulty = "Easy") {
    const problem = await Problem.findOne({
      where: { difficulty },
      order: Sequelize.literal("RANDOM()"),
    });
    return problem || null;
  },

  async create(data) {
    return Problem.create(data);
  },
};
