import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController } from "../controllers/user.controller.js";
import auth from "../middleware/auth.middleware.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const router = Router();

router.post("/register", authLimiter, userController.register);
router.post("/login", authLimiter, userController.login);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/validate", userController.validate);
router.post("/refresh-token", userController.refreshToken);
router.post("/get-matches", auth, userController.getMatches);
router.patch("/update", auth, userController.update);
router.put("/update-score", internalAuth, userController.updateScore);

export default router;
