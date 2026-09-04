import httpStatus from "http-status";
import type { IReqUserPayload } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICourierProfilePayload } from "./employee.validation";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";

const applyForCourier = async (
	payload: ICourierProfilePayload,
	resume: Express.Multer.File | null,
	vehicleDocuments: Express.Multer.File[],
	nationalidPic: Express.Multer.File[],
	userData: IReqUserPayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userData.id,
		},
	});

	console.log(user);

	if (!user) {
		throw new AppError(httpStatus.CONFLICT, "User Not Found! You Need To Register First");
	}

	if (user.isEmployee) {
		throw new AppError(httpStatus.BAD_REQUEST, "You Are Already Employee!");
	}

	const resumeUploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
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
						return reject(
							new AppError(httpStatus.INTERNAL_SERVER_ERROR, "No result returned from Cloudinary"),
						);
					}

					resolve(result);
				},
			)
			.end(resume?.buffer);
	});

	// vechicleDocument upload
	const vehicleDocumentsUploadResults = await Promise.all(
		vehicleDocuments.map((file) => {
			return new Promise<UploadApiResponse>((resolve, reject) => {
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
					.end(file.buffer);
			});
		}),
	);

	// vechicleDocument upload
	const nationalidPicUploadResult = await Promise.all(
		nationalidPic.map((file) => {
			return new Promise<UploadApiResponse>((resolve, reject) => {
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
					.end(file.buffer);
			});
		}),
	);

	const courierApplication = await prisma.employee.create({
		data: {
			userId: user.id,
			permanentAddress: payload.permanentAddress,
			permanentCity: payload.permanentCity,
			courier: {
				create: {
					name: user.name,
					email: user.email,
					vehicleLicenseNumber: payload.vehicleLicenseNumber,
					qualifications: payload.qualifications,
					resume: resumeUploadResult.secure_url,
					resumePublicId: resumeUploadResult.public_id,
					vehicleDocuments: vehicleDocumentsUploadResults.map((file) => ({
						url: file.secure_url,
						publicId: file.public_id,
					})),
					nationalidPic: nationalidPicUploadResult.map((file) => ({
						url: file.secure_url,
						publicId: file.public_id,
					})),
				},
			},
		},
	});

	// TODO transaction use kore user notification create korte hobe otp verifiction korte hobe
};

// export employee service
export const employeeService = {
	applyForCourier,
};
