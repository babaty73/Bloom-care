import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  validatePharmacyRegister,
  validatePharmacyLogin,
  validateAdminLogin,
} from "../middleware/validate.middleware.js";

const router = Router();

router.post("/pharmacy/register", validatePharmacyRegister, authController.registerPharmacy);
router.post("/pharmacy/login", validatePharmacyLogin, authController.loginPharmacy);
router.post("/admin/login", validateAdminLogin, authController.loginAdmin);

export default router;
