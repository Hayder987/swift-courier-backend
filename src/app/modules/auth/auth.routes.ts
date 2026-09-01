import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidation } from "./auth.validation";

const router = Router();

// register customer public
router.post(
  "/sign-up",
  validateRequest(authValidation.registerZodSchema),
  authController.registerCustomer,
);

export const authRoutes = router;
