import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import type { IChangePassword } from "./user.interface";
import { prisma } from "../../lib/prisma";
import {
  ApplicationStatus,
  AuditAction,
  AuditResource,
  AuthMethod,
  EmploymentStatus,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";
import bcrypt from "bcryptjs";
import { passwordHash } from "../../utils/comon.utils";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import sharp from "sharp";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import type { IQuery, IReqUserPayload } from "../../interfaces";
import type { UserWhereInput } from "../../../generated/prisma/models";
import { createAuditLog } from "../../utils/createAuditLog";

// change password own user
const changePassword = async (payload: IChangePassword, userId: string) => {
  if (!userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Authentication required. Please log in again.",
    );
  }

  const { currentPassword, newPassword, reEnterNewPassword } = payload;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      authMethod: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is not active. You cannot change your password. plz contact us",
    );
  }

  if (user.authMethod === AuthMethod.GOOGLE || !user.password) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Password change is not available for Google-only accounts.",
    );
  }

  if (newPassword !== reEnterNewPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "New Password and ReEnter New Password Will be Same!!!",
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Current password is incorrect.",
    );
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError(
      httpStatus.CONFLICT,
      "New password must be different from your current password.",
    );
  }

  const hashNewPassword = await passwordHash(newPassword);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashNewPassword,
    },
  });

  await sendTemplateEmail({
    to: user.email,
    subject: "Password Changed Successfully!!!",
    templateName: "reset-password-success",
    data: {
      name: user.name,
      info: true,
    },
  });
};

// get my profile
const getMyProfile = async (userId: string) => {
  if (!userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Authentication required. Please log in again.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      authMethod: true,
      isEmailVerified: true,
      isEmployee: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  let profile = null;

  if (user.isEmployee) {
    profile = await prisma.employee.findUnique({
      where: {
        userId: user.id,
      },
    });
  } else {
    profile = await prisma.customer.findUnique({
      where: {
        userId: user.id,
      },
    });
  }

  return { user, profile };
};

// update user profile image
const updateProfileImage = async (buffer: Buffer, user: IReqUserPayload) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      isEmployee: true,
      status: true,
      role: true,
      isDeleted: true,
      employee: {
        select: {
          imageUrl: true,
          imagePublicId: true,
        },
      },
      customer: {
        select: {
          imageUrl: true,
          imagePublicId: true,
        },
      },
    },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (currentUser.role !== user.role) {
    throw new AppError(httpStatus.FORBIDDEN, "FORBIDDEN: AccessDenied!");
  }

  if (currentUser.status !== UserStatus.ACTIVE || currentUser.isDeleted) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User Not Active ! SUSPEND OR DELETED, Please Contact Us",
    );
  }

  // Compress + resize image
  const compressedBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 80,
    })
    .toBuffer();

  // cloudinary upload
  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },

          async (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(new Error("No result returned from Cloudinary"));
            }

            resolve(result);
          },
        )
        .end(compressedBuffer);
    },
  );

  let updateProfile = null;

  if (currentUser.isEmployee) {
    updateProfile = await prisma.employee.update({
      where: {
        userId: currentUser.id,
      },
      data: {
        imageUrl: cloudinaryResult.secure_url,
        imagePublicId: cloudinaryResult.public_id,
      },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
      },
    });

    if (currentUser.employee?.imagePublicId && currentUser.employee?.imageUrl) {
      await cloudinary.uploader.destroy(currentUser.employee.imagePublicId);
    }
  } else {
    updateProfile = await prisma.customer.update({
      where: {
        userId: currentUser.id,
      },
      data: {
        imageUrl: cloudinaryResult.secure_url,
        imagePublicId: cloudinaryResult.public_id,
      },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
      },
    });

    if (currentUser.customer?.imagePublicId && currentUser.customer?.imageUrl) {
      await cloudinary.uploader.destroy(currentUser.customer.imagePublicId);
    }
  }

  return updateProfile;
};

// get all user by admin
const getAllUsers = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 15;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: UserWhereInput[] = [];

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  if (query.userId) {
    andConditions.push({ id: query.userId });
  }

  if (query.role) {
    andConditions.push({ role: query.role });
  }

  if (query.authMethod) {
    andConditions.push({ authMethod: query.authMethod });
  }

  if (query.isEmployee) {
    andConditions.push({
      isEmployee: query.isEmployee === "true" ? true : false,
    });
  }

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const users = await prisma.user.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.user.count({
    where: { AND: andConditions },
  });

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// get user by id
const getUserById = async (userId: string, userRole: string) => {
  if (!userId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User Id Not Found please Add userId In Params.",
    );
  }

  if (userRole === UserRole.CUSTOMER) {
    throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      authMethod: true,
      isEmailVerified: true,
      isEmployee: true,
      role: true,
      status: true,
      isDeleted: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  let profile = null;

  if (user.isEmployee && userRole !== UserRole.COURIER) {
    profile = await prisma.employee.findUnique({
      where: {
        userId: user.id,
      },
    });
  } else {
    profile = await prisma.customer.findUnique({
      where: {
        userId: user.id,
      },
    });
  }

  return { user, profile };
};

// get user by id
const deleteUserId = async (userId: string, userReq: IReqUserPayload) => {
  if (!userId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User Id Not Found please Add userId In Params.",
    );
  }

  if (userReq.role !== UserRole.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission.");
  }

  const isExists = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // Already deleted
  if (isExists.isDeleted || isExists.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Deleted");
  }

  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          status: UserStatus.DELETED,
          isDeleted: true,
          isEmployee: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isDeleted: true,
          status: true,
        },
      });

      const employee = await tx.employee.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      let updatedEmployee = null;

      if (employee) {
        updatedEmployee = await tx.employee.update({
          where: {
            userId: user.id,
          },
          data: {
            employmentStatus: EmploymentStatus.TERMINATED,
            deletedAt: new Date(),
            onboardingTime: null,
          },
          select: {
            id: true,
            userId: true,
            employmentStatus: true,
            deletedAt: true,
          },
        });

        await tx.courier.updateMany({
          where: {
            employeeId: employee.id,
          },
          data: {
            applicationStatus: ApplicationStatus.REJECTED,
          },
        });
      }

      const customer = await tx.customer.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      let updatedCustomer = null;

      if (customer) {
        updatedCustomer = await tx.customer.update({
          where: {
            userId: user.id,
          },
          data: {
            deletionDeadline: null,
            deletedAt: new Date(),
          },
          select: {
            id: true,
            userId: true,
            deletedAt: true,
          },
        });
      }

      return {
        user,
        employee: updatedEmployee,
        customer: updatedCustomer,
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );

  await createAuditLog({
    userId: userReq.id,
    action: AuditAction.DELETE,
    resource: AuditResource.CUSTOMER,
    resourceId: transactionResult.user.id,
    description: "User Deleted",
  });

  const templateData = {
    name: transactionResult.user.name,
    email: transactionResult.user.email,
    status: transactionResult.user.status,
    deletedAt: new Date(),
    isDeleted: true,
  };

  await sendTemplateEmail({
    to: transactionResult.user.email,
    subject: "Your Account Deleted",
    templateName: "user-deleted-suspended",
    data: templateData,
  });

  return transactionResult;
};

// export user services
export const userServices = {
  changePassword,
  getMyProfile,
  updateProfileImage,
  getAllUsers,
  getUserById,
  deleteUserId,
};
