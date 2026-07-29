import { Router } from "express";
import { submissionController } from "../controllers/submission.controller.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const router = Router();

router.post("/add", internalAuth, submissionController.add);

export default router;
