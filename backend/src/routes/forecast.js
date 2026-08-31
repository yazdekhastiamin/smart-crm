import { Router } from "express";
import { getForecast } from "../controllers/forecastController.js";

const router = Router();

router.get("/", getForecast);

export default router;
