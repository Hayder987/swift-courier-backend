import  httpStatus  from 'http-status';
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IRegisterPayload } from "./auth.validation";
import config from '../../config';
import { createOtp, passwordHash, setRedisOtp } from '../../utils/comon.utils';
import { redisClient } from '../../lib/redis';

// create user as customer
const registerCustomer = async (payload:IRegisterPayload) => {
    const {name, password, phone, address} = payload;
    const email = payload.email.trim().toLowerCase();

    const isUserExist = await prisma.user.findUnique({
        where : {
            email
        },
    });
    
    if(isUserExist){
        throw new AppError(httpStatus.CONFLICT, "User Already Exists Please Login!")
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
            address,
		}),
		{
			expiration: {
				type: "EX",
				value: expirationTime,
			},
		},
	);

    await setRedisOtp(emailverifyOtpKey, otp);


    
};

// export auth services
export const authServices = {
	registerCustomer,
};
