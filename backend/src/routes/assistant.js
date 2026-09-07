import { Router } from "express";
import { chat } from "../controllers/assistantController.js";

const router = Router();

router.post("/chat", chat);

export default router;
