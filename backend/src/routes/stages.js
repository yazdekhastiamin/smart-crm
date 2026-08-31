import { Router } from "express";
import { listStages } from "../controllers/stageController.js";

const router = Router();

router.get("/", listStages);

export default router;
