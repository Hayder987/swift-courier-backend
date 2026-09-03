import httpStatus from "http-status";
import { IReqUserPayload } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ILiveLocationPayload } from "./live.location.interface";
import { reverseGeocode } from "../../utils/reverseGeocoding";

// created or update my live location
const liveLocation = async (payload: ILiveLocationPayload, reqUser: IReqUserPayload) => {
	const { longitude, latitude } = payload;

	const user = await prisma.user.findFirst({
		where: {
			id: reqUser.id,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found!");
	}

	if (reqUser.role !== user.role) {
		throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission!");
	}

	// get locations
	const locationResult = await reverseGeocode(Number(latitude), Number(longitude));

	if (!locationResult) {
		throw new AppError(httpStatus.NOT_FOUND, "NOT FOUND: Location Result Not Generated");
	}

	const address = {
		fullAddress: locationResult.fullAddress,
		road: locationResult.road ?? null,
		city: locationResult.city ?? null,
		district: locationResult.district ?? null,
		state: locationResult.state ?? null,
		postcode: locationResult.postcode ?? null,
		country: locationResult.country ?? null,
	};

	const myLocation = await prisma.liveLocation.upsert({
		where: {
			userId: user.id,
		},
		create: {
			userId: user.id,
			latitude,
			longitude,
			isSharing: false,
			userRole: user.role,
			address,
		},
		update: {
			latitude,
			longitude,
			isSharing: false,
			address,
		},
	});

	return myLocation;
};

// export live location
export const locationServices = {
	liveLocation,
};
