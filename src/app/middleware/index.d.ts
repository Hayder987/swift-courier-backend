import { JwtPayload } from "jsonwebtoken";

// express name space
declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}
