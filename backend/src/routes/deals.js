import { Router } from "express";
import {
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from "../controllers/dealController.js";

const router = Router();

router.get("/", listDeals);
router.get("/:id", getDeal);
router.post("/", createDeal);
router.put("/:id", updateDeal);
router.patch("/:id/stage", updateDealStage);
router.delete("/:id", deleteDeal);

export default router;
