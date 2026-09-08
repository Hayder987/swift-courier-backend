import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/user/user.routes";
import { locationRoutes } from "../modules/live-locations/live.location.routes";
import { shipmentRoutes } from "../modules/shipment/shipment.routes";
import { employeeRoutes } from "../modules/employee/employee.routes";
import { zoneRoutes } from "../modules/zone/zone.routes";
import { superAdminRoutes } from "../modules/super-admin/superAdmin.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { payrollRoutes } from "../modules/payroll/payroll.route";
import { notificationRoutes } from "../modules/notifications/notification.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/location", locationRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/employee", employeeRoutes);
router.use("/zones", zoneRoutes);
router.use("/super/admin", superAdminRoutes);
router.use("/payments", paymentRoutes);
router.use("/payroll", payrollRoutes);
router.use("/notifications", notificationRoutes)

export default router;
