import type { Prisma } from "../../generated/prisma/client";
import type { AuditAction, AuditResource } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { onboardingAuditOldDeadline } from "./comon.utils";

interface ICreateAuditLog {
	userId: string;
	action: AuditAction;
	resource: AuditResource;
	resourceId?: string;
	description?: string;
	metadata?: Record<string, unknown>;
}

export const createAuditLog = async (payload: ICreateAuditLog) => {
	return await prisma.auditLog.create({
		data: {
			userId: payload.userId,
			action: payload.action,
			resource: payload.resource,
			resourceId: payload.resourceId,
			description: payload.description,
            onboardingOldTime : onboardingAuditOldDeadline,
			metadata: payload.metadata ? (payload.metadata as Prisma.InputJsonValue) : undefined,
		},
	});
};
