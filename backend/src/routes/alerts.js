import { Router } from "express";
import { listAlerts } from "../controllers/alertController.js";

const router = Router();

router.get("/", listAlerts);

export default router;
