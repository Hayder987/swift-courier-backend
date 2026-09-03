import { Router } from "express";
import { shipmentController } from "./shipment.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";

const router = Router();

// create shipment by get form data
router.post(
	"/",
	auth(UserRole.CUSTOMER),
	upload.single("ItemsImage"),
	shipmentController.createShipment,
);

export const shipmentRoutes = router;
