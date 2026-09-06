import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { createCheckoutSessionValidationSchema } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();

router.post(
  "/create",
  auth(UserRole.CUSTOMER),
  validateRequest(createCheckoutSessionValidationSchema),
  paymentController.createCheckoutSession,
);

export const paymentRoutes = router;