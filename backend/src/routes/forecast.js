import { Router } from "express";
import { getForecast, getHistory } from "../controllers/forecastController.js";

const router = Router();

router.get("/", getForecast);
router.get("/history", getHistory);

export default router;
