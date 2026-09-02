import { IReqUserPayload } from "../interfaces";

// express name space
declare global {
	namespace Express {
		interface Request {
			user?: IReqUserPayload;
		}
	}
}
