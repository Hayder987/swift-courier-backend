import { prisma } from "../lib/prisma";

export const generateEmployeeCode = async (): Promise<string> => {
	const lastEmployee = await prisma.employee.findFirst({
		orderBy: {
			employeeCode: "desc",
		},
		select: {
			employeeCode: true,
		},
	});

	let nextNumber = 1;

	if (lastEmployee?.employeeCode) {
		const lastNumber = Number(lastEmployee.employeeCode.replace("EMP-", ""));

		if (!Number.isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	return `EMP-${String(nextNumber).padStart(4, "0")}`;
};
