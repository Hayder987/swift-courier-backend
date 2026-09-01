import { prisma } from "../../lib/prisma";
import { IRegisterPayload } from "./auth.validation";

// create user as customer
const registerCustomer = async (payload:IRegisterPayload) => {
    const {name, password, phone} = payload;
    const email = payload.email.trim().toLowerCase();

    const isUserExist =  
    
};

// export auth services
export const authServices = {
	registerCustomer,
};
