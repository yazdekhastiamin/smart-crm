import { Router } from "express";
import { getWinPatterns } from "../controllers/analyticsController.js";

const router = Router();

router.get("/win-patterns", getWinPatterns);

export default router;
