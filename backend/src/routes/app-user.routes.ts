import { Router } from "express";
import { requireRole } from "../middleware/require-role.js";
import {
  getAppUsers,
  updateAppUser,
} from "../controllers/app-user.controller.js";

const router = Router();

// Nur der OWNER darf Benutzer verwalten.
router.use(requireRole("OWNER"));

router.get("/", getAppUsers);
router.patch("/:id", updateAppUser);

export default router;
