import { Router } from "express";
import { executorController } from "../controllers/executor.controller.js";

const router = Router();

router.post("/run", executorController.run);
router.post("/submit", executorController.submit);

export default router;
