import { Router } from "express";
import { matchController } from "../controllers/match.controller.js";
import internalAuth from "../middleware/internal-auth.middleware.js";

const router = Router();

router.post("/create-match", matchController.createRoom);
router.get("/:matchId", matchController.getRoom);
router.get("/remove-match/:matchId", matchController.removeRoom);
router.post("/store-match", internalAuth, matchController.storeMatch);

export default router;
