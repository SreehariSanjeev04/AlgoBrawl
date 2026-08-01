import { Router } from "express";
import { matchController } from "../controllers/match.controller.js";
import auth from "../middleware/auth.middleware.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const router = Router();

router.post("/create-match", internalAuth, matchController.createRoom);
router.get("/:matchId", matchController.getRoom);
router.delete("/:matchId", auth, matchController.removeRoom);
router.post("/store-match", internalAuth, matchController.storeMatch);

export default router;
