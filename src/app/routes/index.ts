import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/user/user.routes";
import { locationRoutes } from "../modules/live-locations/live.location.routes";
import { shipmentRoutes } from "../modules/shipment/shipment.routes";
import { employeeRoutes } from "../modules/employee/employee.routes";
import { zoneRoutes } from "../modules/zone/zone.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/location", locationRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/employee", employeeRoutes);
router.use("/zones", zoneRoutes);

export default router;
