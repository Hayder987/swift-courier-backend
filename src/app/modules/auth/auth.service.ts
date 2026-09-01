import { prisma } from "../../lib/prisma";

// create user as customer
const registerCustomer = async (payload: any) => {
    const {name, email, password, phone} = payload
    const result = await prisma.user.create ({
        
        data :{
            name, 
            email,
            password,
            phone,
            customer : {
                create : {}
            }
            
        },
        
    });
    return result;
};

// export auth services
export const authServices = {
	registerCustomer,
};
