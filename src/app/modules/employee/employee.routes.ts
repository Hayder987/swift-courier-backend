import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { employeeController } from "./employee.controller";
import { upload } from "../../lib/multer";

const router = Router();

// apply for courier
router.post(
	"/be-courier",
	auth(UserRole.CUSTOMER),
	upload.fields([
		{
			name: "resume",
			maxCount: 1,
		},

		{
			name: "vehicleDocuments",
			maxCount: 5,
		},
		{
			name: "nationalidPic",
			maxCount: 2,
		},
	]),
	employeeController.applyForCourier,
);

// employee export routes
export const employeeRoutes = router;
