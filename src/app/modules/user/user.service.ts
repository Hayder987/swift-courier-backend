import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import type { IChangePassword, ILiveLocationUser } from "./user.interface";
import { prisma } from "../../lib/prisma";
import {
  AuthMethod,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";
import bcrypt from "bcryptjs";
import { passwordHash } from "../../utils/comon.utils";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import sharp from "sharp";
import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { IReqUserPayload } from "../../interfaces";
import { reverseGeocode } from "../../utils/reverseGeocoding";
import { Prisma } from "../../../generated/prisma/client";

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

// update customer/employee live address profile
const updateLiveAddress = async (
  paylod: ILiveLocationUser,
  reqUser: IReqUserPayload,
) => {
  const { latitude, longitude } = paylod;

  const liveLocation = await reverseGeocode(
    Number(latitude),
    Number(longitude),
  );

  if (!liveLocation) {
    throw new AppError(httpStatus.NOT_FOUND, "Geo Location Not Generate! ");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: reqUser.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isEmployee: true,
      customer: {
        select: {
          id: true,
          userId: true,
        },
      },
      employee: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (user.role !== reqUser.role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "UNAUTHORIZED: You Have No Permission",
    );
  }

  //   let profile = {};
  const locationData = {
    realTimeAddress: liveLocation as unknown as Prisma.InputJsonValue,
    realTimeLatitude: latitude,
    realTimeLongitude: longitude,
    realTimeUpdatedAt: new Date(),
  };

  const selectedData = {
    id: true,
    userId: true,
    realTimeLatitude: true,
    realTimeLongitude: true,
    realTimeUpdatedAt: true,
    realTimeAddress: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    },
  };

  if (user.isEmployee && user.role === UserRole.COURIER) {
    const profile = await prisma.employee.update({
      where: {
        userId: user.id,
      },
      data: {
        ...locationData,
      },
      select: selectedData,
    });
    return profile;
  }

  if (!user.isEmployee && user.role === UserRole.CUSTOMER) {
    const profile = await prisma.customer.update({
      where: {
        userId: user.id,
      },
      data: {
        ...locationData,
      },
      select: selectedData,
    });
    return profile;
  }
};

// export user services
export const userServices = {
  changePassword,
  getMyProfile,
  updateProfileImage,
  updateLiveAddress,
};
