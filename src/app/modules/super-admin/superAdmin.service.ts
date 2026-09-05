import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";

// get all audit logs
const getAuditLogs = async (query: IQuery) => {
	return await prisma.auditLog.findMany({
		orderBy: {
			createdAt: "desc",
		},

		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});
};

export const superAdminService = {
	getAuditLogs,
};
