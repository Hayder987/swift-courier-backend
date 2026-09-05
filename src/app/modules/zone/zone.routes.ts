import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { zoneValidation } from "./zone.validation";
import { zoneController } from "./zone.controller";

const router = Router();

router.post(
	"/",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	validateRequest(zoneValidation.createZoneValidationSchema),
	zoneController.createZone,
);

// get all zones
router.get("/", zoneController.getAllZones);

router.get("/:zoneId", zoneController.getZoneById);

router.patch(
	"/:zoneId",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	validateRequest(zoneValidation.updateZoneValidationSchema),
	zoneController.updateZone,
);

router.delete("/:zoneId", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), zoneController.deleteZone);

export const zoneRoutes = router;
