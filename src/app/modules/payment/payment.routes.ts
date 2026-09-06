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

router.post("/webhook", paymentController.handleWebhook);

// get all payment
router.get(
	"/all-payments",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	paymentController.getAllPayment,
);

export const paymentRoutes = router;
