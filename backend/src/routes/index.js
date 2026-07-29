import { Router } from "express";
import userRoutes from "./user.routes.js";
import problemRoutes from "./problem.routes.js";
import matchRoutes from "./match.routes.js";
import submissionRoutes from "./submission.routes.js";
import executorRoutes from "./executor.routes.js";

const router = Router();

router.use("/user", userRoutes);
router.use("/problem", problemRoutes);
router.use("/match", matchRoutes);
router.use("/submission", submissionRoutes);
router.use("/", executorRoutes);

export default router;
