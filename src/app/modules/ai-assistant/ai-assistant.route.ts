import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { aiChatValidationSchema } from "./ai-assistant.validation";
import { aiAssistantControllers } from "./ai-assistant.controller";

const router = Router();

router.post("/chat", validateRequest(aiChatValidationSchema), aiAssistantControllers.chat);

export const aiAssistantRoutes = router;
