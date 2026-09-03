import { Router } from "express";
import { locationController } from "./live.location.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { locationValidation } from "./live.location.validation";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// generate live location
router.post(
	"/generate",
	validateRequest(locationValidation.liveLocationZodSchema),
	auth(UserRole.COURIER, UserRole.CUSTOMER),
	locationController.liveLocation,
);

export const locationRoutes = router;
