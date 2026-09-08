import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  validatePharmacyRegister,
  validatePharmacyLogin,
  validateAdminLogin,
} from "../middleware/validate.middleware.js";
import { createLoginRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Independent limiter instances (see rateLimit.middleware.js) — pharmacy and
// admin login attempts must not share a counter.
router.post("/pharmacy/register", validatePharmacyRegister, authController.registerPharmacy);
router.post("/pharmacy/login", createLoginRateLimiter(), validatePharmacyLogin, authController.loginPharmacy);
router.post("/admin/login", createLoginRateLimiter(), validateAdminLogin, authController.loginAdmin);

export default router;
