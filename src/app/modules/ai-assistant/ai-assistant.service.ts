import Groq from "groq-sdk";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { SYSTEM_PROMPT } from "./ai-assistant.prompt";
import {
	calculateShippingPriceTool,
	getShippingFaqTool,
	getShippingServiceInformationTool,
	trackShipmentTool,
} from "./ai-assistant.tools";
import type { IAIChatRequest, IAIChatResponse, IAIToolResult } from "./ai-assistant.interface";
import config from "../../config";

const groq = config.geoapify_api_key
	? new Groq({ apiKey: config.groq_api_key, timeout: 20_000 })
	: null;

const detectIntent = (message: string): "tracking" | "pricing" | "faq" | "service" | "general" => {
	const m = message.toLowerCase();

	if (/(track|tracking|parcel.*where|where.*parcel|আমার পার্সেল|ট্র্যাক)/.test(m)) return "tracking";
	if (/(price|cost|charge|fee|estimate|কত|দাম|চার্জ)/.test(m)) return "pricing";
	if (/(how|what|faq|policy|help|কিভাবে|কী)/.test(m)) return "faq";
	if (/(service|zone|area|coverage|এলাকা)/.test(m)) return "service";
	return "general";
};

const extractTrackingNumber = (message: string): string | null => {
	const match = message.match(/\b[A-Za-z0-9-]{6,32}\b/g);
	if (!match) return null;
	return match.sort((a, b) => b.length - a.length)[0];
};

const extractWeightGM = (message: string): number | null => {
	const kg = message.match(/(\d+(?:\.\d+)?)\s*(?:kg|কেজি)/i);
	if (kg) return Math.round(Number(kg[1]) * 1000);
	const gm = message.match(/(\d+(?:\.\d+)?)\s*(?:gm|g|গ্রাম)/i);
	if (gm) return Math.round(Number(gm[1]));
	return null;
};

const chat = async (payload: IAIChatRequest): Promise<IAIChatResponse> => {
	if (!groq) {
		throw new AppError(
			httpStatus.SERVICE_UNAVAILABLE,
			"AI assistant is not configured. GROQ_API_KEY is missing on the server.",
		);
	}

	const { message, history } = payload;
	const intent = detectIntent(message);

	let toolResult: IAIToolResult | null = null;
	let toolContext = "";

	if (intent === "tracking") {
		const tn = extractTrackingNumber(message);
		if (tn) {
			toolResult = await trackShipmentTool(tn);
			toolContext = `Tracking tool result: ${JSON.stringify(toolResult)}`;
		} else {
			toolContext = "No tracking number was provided in the user message.";
		}
	}

	if (intent === "pricing") {
		const weight = extractWeightGM(message);
		toolResult = await calculateShippingPriceTool({
			weightGM: weight ?? undefined,
		});
		toolContext = `Pricing tool result: ${JSON.stringify(toolResult)}`;
	}

	if (intent === "faq") {
		toolResult = getShippingFaqTool(message);
		toolContext = `FAQ tool result: ${JSON.stringify(toolResult)}`;
	}

	if (intent === "service") {
		toolResult = getShippingServiceInformationTool();
		toolContext = `Service info: ${JSON.stringify(toolResult)}`;
	}

	try {
		const completion = await groq.chat.completions.create({
			model: config.groq_model,
			temperature: 0.3,
			max_tokens: 500,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "system",
					content: `Detected intent: ${intent}. ${toolContext}`,
				},
				...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
				{ role: "user", content: message },
			],
		});

		const reply = completion.choices?.[0]?.message?.content?.trim();
		if (!reply) {
			throw new AppError(httpStatus.BAD_GATEWAY, "AI returned an empty response.");
		}

		return { reply, toolResult };
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"The AI assistant is temporarily unavailable. Please try again shortly.",
		);
	}
};

export const aiAssistantService = { chat };
