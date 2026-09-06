import httpStatus from "http-status";
import {
  ApplicationStatus,
  AuthMethod,
  EmploymentStatus,
  SalaryType,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateEmployeeUserPayload } from "./superAdmin.validation";
import { passwordHash } from "../../utils/comon.utils";
import { generateEmployeeCode } from "../../utils/generateEmployeeCode";
import { geocodeAddress } from "../../utils/zone-utils/geoapify";
import { getZoneInfo } from "../../utils/zone-utils/getZoneInfo";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";

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

// create employee User
const createEmployeeUser = async (payload: ICreateEmployeeUserPayload) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    permanentAddress,
    permanentCity,
    basicSalary,
    houseAllowance,
    medicalAllowance,
    transportAllowance,
    perDeliveryAmount,
    vehicleLicenseNumber,
    qualifications,
  } = payload;

  if (role !== UserRole.ADMIN && role !== UserRole.COURIER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only ADMIN or COURIER can be created as employee!",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this email!",
    );
  }

  const hashPassword = await passwordHash(password);

  const employeeCode = await generateEmployeeCode();

  let zoneId: string | undefined;

  if (role === UserRole.COURIER) {
    if (!permanentCity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Permanent city is required for courier!",
      );
    }

    if (!vehicleLicenseNumber) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Vehicle license number is required for courier!",
      );
    }

    if (!qualifications) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Qualifications are required for courier!",
      );
    }

    const location = await geocodeAddress(permanentCity);

    if (!location) {
      throw new AppError(httpStatus.NOT_FOUND, "Location Not Found!");
    }

    const zoneInfo = await getZoneInfo(location.latitude, location.longitude);

    if (!zoneInfo) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Delivery zone not found for this location!",
      );
    }

    zoneId = zoneInfo.id;
  }

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        phone,
        isEmailVerified: true,
        isEmployee: true,
        isDeleted: false,
        mustChangePassword: true,

        role: role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.COURIER,

        authMethod: AuthMethod.CREDENTIALS,

        employee: {
          create: {
            employeeCode,
            employmentStatus: EmploymentStatus.ACTIVE,

            permanentAddress,
            permanentCity,

            joinAt: new Date(),

            salaryStructure: {
              create: {
                salaryType:
                  role === UserRole.COURIER
                    ? SalaryType.BASE_PLUS_DELIVERY
                    : SalaryType.FIXED,

                basicSalary,
                houseAllowance,
                medicalAllowance,
                transportAllowance,

                perDeliveryAmount:
                  role === UserRole.COURIER ? perDeliveryAmount : 0,
              },
            },

            ...(role === UserRole.COURIER && {
              courier: {
                create: {
                  name,
                  email,
                  vehicleLicenseNumber: vehicleLicenseNumber!,
                  qualifications: qualifications!,
                  zoneId,
                  applicationStatus: ApplicationStatus.APPROVED,
                },
              },
            }),
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isEmployee: true,
        mustChangePassword: true,

        employee: {
          select: {
            id: true,
            employeeCode: true,
            employmentStatus: true,
            permanentAddress: true,
            permanentCity: true,
            joinAt: true,

            salaryStructure: {
              select: {
                id: true,
                salaryType: true,
                basicSalary: true,
                houseAllowance: true,
                medicalAllowance: true,
                transportAllowance: true,
                perDeliveryAmount: true,
              },
            },

            courier: {
              select: {
                id: true,
                name: true,
                email: true,
                vehicleLicenseNumber: true,
                qualifications: true,
                zoneId: true,

                zone: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },

                applicationStatus: true,
              },
            },
          },
        },
      },
    });

    return user;
  });

  const templateData = {
    name,
    email,
    role,
    status: employee.status,
    password,
  };

  await sendTemplateEmail({
    to: email,
    subject: "SwiftCourier Employee Account Created",
    templateName: "employee-account-created",
    data: templateData,
  });

  return employee;
};

// delete admin by super admin


export const superAdminService = {
  getAuditLogs,
  createEmployeeUser,
  
};
