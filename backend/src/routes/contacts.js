import { Router } from "express";
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";

const router = Router();

router.get("/", listContacts);
router.get("/:id", getContact);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
