import { prisma } from "../lib/prisma";

const EMPLOYEE_CODE_PREFIX = "EMP-";
const EMPLOYEE_CODE_START = 1;
const EMPLOYEE_CODE_LOCK_KEY = "swiftcourier:employee-code";

export const generateEmployeeCode = async (): Promise<string> => {
	return prisma.$transaction(async (tx) => {
		await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${EMPLOYEE_CODE_LOCK_KEY})
      )
    `;

		const result = await tx.$queryRaw<{ maxNumber: number | null }[]>`
      SELECT MAX(
        CAST(
          SUBSTRING("employeeCode" FROM 5) AS INTEGER
        )
      ) AS "maxNumber"
      FROM "employees"
      WHERE "employeeCode" ~ '^EMP-[0-9]+$'
    `;

		const maxNumber = result[0]?.maxNumber ?? 0;

		const nextNumber = Math.max(EMPLOYEE_CODE_START, maxNumber + 1);

		return `${EMPLOYEE_CODE_PREFIX}${String(nextNumber).padStart(4, "0")}`;
	});
};
