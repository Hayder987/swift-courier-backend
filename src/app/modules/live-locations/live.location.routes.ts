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
	auth(UserRole.COURIER, UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN),
	locationController.liveLocation,
);

// delete my location
router.delete(
	"/my-location",
	auth(UserRole.COURIER, UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN),
	locationController.deleteMyLocation,
);

// update location
router.patch("/share/:id", auth(UserRole.COURIER), locationController.updateLocationOngoing);

export const locationRoutes = router;
