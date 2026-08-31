import { Router } from "express";
import {
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activityController.js";

const router = Router();

router.get("/", listActivities);
router.post("/", createActivity);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

export default router;
