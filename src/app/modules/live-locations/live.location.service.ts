import httpStatus from "http-status";
import { IReqUserPayload } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ILiveLocationPayload } from "./live.location.interface";
import { reverseGeocode } from "../../utils/reverseGeocoding";
import { LocationStatus } from "../../../generated/prisma/enums";

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

// delete my location
const deleteMyLocation = async (userId: string) => {
	const isExistLocation = await prisma.liveLocation.findUnique({
		where: {
			userId,
		},
	});

	if (!isExistLocation) {
		throw new AppError(httpStatus.NOT_FOUND, "Your Location Not Found!");
	}

	if (isExistLocation.status === LocationStatus.ONGOING) {
		throw new AppError(httpStatus.FORBIDDEN, "Can't Delete ONGOING Location!");
	}

	await prisma.liveLocation.delete({
		where: {
			userId,
		},
	});
};

// share my location
const shareMyLocation = async (userId: string) => {
	const isExistLocation = await prisma.liveLocation.findUnique({
		where: {
			userId,
		},
	});

	if (!isExistLocation) {
		throw new AppError(httpStatus.NOT_FOUND, "Your Location Not Found!");
	}

	if (isExistLocation.isSharing) {
		throw new AppError(httpStatus.BAD_REQUEST, "This Location Already shared!");
	}

	if (isExistLocation.status !== LocationStatus.CREATED) {
		throw new AppError(httpStatus.BAD_REQUEST, "Only CREATED Status Location Can Be shared!");
	}

	const result = await prisma.liveLocation.update({
		where: {
			userId,
		},
		data: {
			isSharing: true,
			status: LocationStatus.ONGOING,
		},
		select: {
			id: true,
			userId: true,
			latitude: true,
			longitude: true,
			status: true,
			isSharing: true,
		},
	});

	return result;
};

// export live location
export const locationServices = {
	liveLocation,
	deleteMyLocation,
	shareMyLocation,
};
