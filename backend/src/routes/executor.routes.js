import { Router } from "express";
import rateLimit from "express-rate-limit";
import { executorController } from "../controllers/executor.controller.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const execLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const router = Router();

router.post("/run", execLimiter, executorController.run);
router.post("/submit", execLimiter, internalAuth, executorController.submit);

export default router;
