import { Router } from "express";
import { getWinPatterns, getGeo } from "../controllers/analyticsController.js";

const router = Router();

router.get("/win-patterns", getWinPatterns);
router.get("/geo", getGeo);

export default router;
