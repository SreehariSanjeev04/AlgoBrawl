import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/validate", userController.validate);
router.post("/refresh-token", userController.refreshToken);
router.post("/get-matches", userController.getMatches);
router.patch("/update", userController.update);
router.put("/update-score", internalAuth, userController.updateScore);

export default router;
