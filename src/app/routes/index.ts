import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/user/user.routes";
import { locationRoutes } from "../modules/live-locations/live.location.routes";
import { shipmentRoutes } from "../modules/shipment/shipment.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/location", locationRoutes);
router.use("/shipments", shipmentRoutes);

export default router;
