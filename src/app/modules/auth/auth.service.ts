import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IRegisterPayload, IVerifyEmailPayload } from "./auth.validation";
import { createOtp, passwordHash, setRedisOtp } from "../../utils/comon.utils";
import { redisClient } from "../../lib/redis";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import { AuthMethod, UserRole, UserStatus } from "../../../generated/prisma/enums";

// create user as customer
const registerCustomer = async (payload: IRegisterPayload) => {
  const { name, password, phone } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User Already Exists Please Login!",
    );
  }

  const hashPassword = await passwordHash(password);
  const otp = createOtp();

  const customerPayloadKey = `customer_registration_payload:${email}`;
  const emailverifyOtpKey = `email_verify_otp:${email}`;
  const expirationTime = 5 * 60;

  await redisClient.set(
    customerPayloadKey,
    JSON.stringify({
      name,
      email,
      password: hashPassword,
      phone,
    }),
    {
      expiration: {
        type: "EX",
        value: expirationTime,
      },
    },
  );

  await setRedisOtp(emailverifyOtpKey, otp);

  await sendTemplateEmail({
    to: email,
    subject: "Verify Your SwiftCourier Account",
    templateName: "otp-verification",
    data: {
      otp,
      expirationMinutes: 5,
    },
  });
};

// verify email
const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const otp = payload?.otp;
  const email = payload.email.trim().toLowerCase();

  const emailverifyOtpKey = `email_verify_otp:${email}`;
  const redisOtp = await redisClient.get(emailverifyOtpKey);

  if (!redisOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid OTP or OTP has expired",
    );
  }


  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  await redisClient.del(emailverifyOtpKey);

  const customerPayloadKey = `customer_registration_payload:${email}`;
  const userRedisPayload = await redisClient.get(customerPayloadKey);

  if (!userRedisPayload) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Verification code expired or registration session not found",
    );
  }

  const registrationData = JSON.parse(userRedisPayload);

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist) {
    if (isUserExist.isEmailVerified) {
      throw new AppError(httpStatus.CONFLICT, "Email is already verified");
    }

    if (isUserExist.status === UserStatus.SUSPENDED) {
      throw new AppError(httpStatus.FORBIDDEN, "Your account is suspended Please Contact Us");
    }

    if (isUserExist.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "Your account is deleted Please Contact Us");
    }

    if (!isUserExist.password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "User is authenticated with Google",
      );
    }
  }

  const now = new Date();

  const deletionDeadline = new Date(now.getTime() + 360 * 60 * 60 * 1000); // 15 days

  const user = await prisma.user.create({
    data: {
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
      phone : registrationData.phone,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      authMethod: AuthMethod.CREDENTIALS,

      customer : {
        create :{
        deletionDeadline:deletionDeadline,  
        }
      }
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      customer : {
        select :{
            deletionDeadline : true
        }
      }
    },
  });

  const templateData = {
    name: user?.name,
    email: user?.email,
    role: user?.role,
    status: user?.status,
    deletionDeadline: user?.customer?.deletionDeadline,
  };

  await sendTemplateEmail({
    to: user?.email,
    subject: "Welcome to SwiftCourier Your — Registration Successful",
    templateName: "registration-success",
    data: templateData,
  });
};

// export auth services
export const authServices = {
  registerCustomer,
  verifyEmail
};
