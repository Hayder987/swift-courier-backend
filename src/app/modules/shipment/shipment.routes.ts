import { Router } from "express";
import { shipmentController } from "./shipment.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { validateRequest } from "../../middleware/validateRequest";
import { shipmentValidation } from "./shipment.validation";

const router = Router();

// create shipment by get form data
router.post(
  "/",
  auth(UserRole.CUSTOMER),
  upload.single("ItemsImage"),
  shipmentController.createShipment,
);

// get all shipment
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  shipmentController.getAllShipments,
);

//shipment update by admin
router.patch(
  "/admin-status/:id",
  validateRequest(shipmentValidation.shipmentStatusAdminZodSchema),
  auth(UserRole.ADMIN),
  shipmentController.updateShipmentStatus,
);

//shipment update by courier
router.patch(
  "/courier-status/:id",
  validateRequest(shipmentValidation.shipmentStatusAdminZodSchema),
  auth(UserRole.COURIER),
  shipmentController.updateShipmentStatusCourier,
);

//shipment update by admin
router.patch(
  "/assign/:id",
  auth(UserRole.ADMIN),
  shipmentController.assignCourier,
);

router.get(
  "/shipment/:shipmentId",
  auth(UserRole.ADMIN, UserRole.COURIER, UserRole.SUPER_ADMIN),
  shipmentController.getShipmentById,
);

export const shipmentRoutes = router;
