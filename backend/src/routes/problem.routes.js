import { Router } from "express";
import { problemController } from "../controllers/problem.controller.js";

const router = Router();

router.get("/", problemController.getAll);
router.get("/generate/:difficulty", problemController.getByDifficulty);
router.post("/add", problemController.create);

export default router;
