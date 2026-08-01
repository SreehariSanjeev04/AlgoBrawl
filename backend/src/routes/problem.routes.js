import { Router } from "express";
import { problemController } from "../controllers/problem.controller.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const router = Router();

router.get("/", problemController.getAll);
router.get("/generate/:difficulty", problemController.getByDifficulty);
router.post("/add", internalAuth, problemController.create);

export default router;
