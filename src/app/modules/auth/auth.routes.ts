import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// register customer public
router.post("/sign-up", authController.registerCustomer);

export const authRoutes = router;
