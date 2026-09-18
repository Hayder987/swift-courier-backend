import { Router } from "express";
import { ContactController } from "./contact.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { serviceValidation } from "./contact.validation";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";

const router = Router();

router.post("/", validateRequest(serviceValidation.contactSchema), ContactController.createContact);

/**
 * Admin
 * Get all contacts
 */
router.get("/", auth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.getAllContacts);

/**
 * Admin
 * Get contact by ID
 */
router.get("/:id", auth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.getContactById);

/**
 * Admin
 * Delete contact
 */
router.delete("/:id", auth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.deleteContact);

export const ContactRoutes = router;
