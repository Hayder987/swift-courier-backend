import httpStatus from "http-status";
import type { IReqUserPayload } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICourierProfilePayload } from "./employee.validation";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import {
	ApplicationStatus,
	EmploymentStatus,
	NotificationType,
	UserRole,
	UserStatus,
} from "../../../generated/prisma/enums";
import { notificationDeadline, onboardingCourierDeadline } from "../../utils/comon.utils";
import { IApprovedCourierReqPayload } from "./employee.inerface";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import { generateEmployeeCode } from "../../utils/generateEmployeeCode";

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

	const tarnsactionResult = await prisma.$transaction(
		async (tx) => {
			const courierApplication = await tx.employee.create({
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

			await tx.notification.create({
				data: {
					title: "New Job Request Arrived For Courier Role!",
					message: "An User Requested For Courier Role",
					type: NotificationType.GENERAL,
					userId: user.id,
					notificationDeadline: notificationDeadline,
				},
			});

			return courierApplication;
		},
		{
			maxWait: 15000,
			timeout: 20000,
		},
	);
	return tarnsactionResult;
};

// approved courier
export const approvedCourier = async (
	payload: IApprovedCourierReqPayload,
	user: IReqUserPayload,
	empId: string,
) => {
	const isApplicantEmployee = await prisma.employee.findUnique({
		where: {
			id: empId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					status: true,
					role: true,
					isEmployee: true,
					isDeleted: true,
				},
			},
			courier: true,
		},
	});

	if (!isApplicantEmployee) {
		throw new AppError(httpStatus.NOT_FOUND, "Employee Applicant Not Found");
	}

	if (isApplicantEmployee.user.isDeleted) {
		throw new AppError(httpStatus.GONE, "Employee User Already Deleted");
	}

	if (
		isApplicantEmployee.user.isEmployee &&
		isApplicantEmployee.user.status === UserStatus.ACTIVE
	) {
		throw new AppError(httpStatus.CONFLICT, "This Applicant Already Employee Here");
	}

	if (isApplicantEmployee.user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.GONE, "This Applicant Already Suspended Or Deleted");
	}

	if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
		throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission To Update This");
	}

	if (
		payload.status !== ApplicationStatus.APPROVED &&
		payload.status !== ApplicationStatus.REJECTED
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid application status");
	}

	const employeeCode =
		payload.status === ApplicationStatus.APPROVED ? await generateEmployeeCode() : undefined;

	const result = await prisma.$transaction(async (tx) => {
		const employee = await tx.employee.update({
			where: {
				id: empId,
			},
			data:
				payload.status === ApplicationStatus.REJECTED
					? {
							onboardingTime: onboardingCourierDeadline,
							employmentStatus: EmploymentStatus.TERMINATED,
						}
					: {
							onboardingTime: null,
							employeeCode,
							employmentStatus: EmploymentStatus.ACTIVE,
							joinAt: new Date(),
						},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		await tx.courier.update({
			where: {
				employeeId: empId,
			},
			data: {
				applicationStatus: payload.status,
			},
		});

		if (payload.status === ApplicationStatus.APPROVED) {
			await tx.user.update({
				where: {
					id: employee.user.id,
				},
				data: {
					role: UserRole.COURIER,
					isEmployee: true,
				},
			});
		}

		const notification = await tx.notification.create({
			data: {
				title:
					payload.status === ApplicationStatus.APPROVED
						? "Courier Application Approved"
						: "Courier Application Rejected",

				message:
					payload.status === ApplicationStatus.APPROVED
						? "Your application for the Courier role has been approved."
						: "Your application for the Courier role has been rejected.",

				type: NotificationType.APPLICATION,
				userId: employee.user.id,
				notificationDeadline,
			},
		});

		return {
			employee,
			notification,
		};
	});

	// Email AFTER transaction
	await sendTemplateEmail({
		to: result.employee.user.email,
		subject:
			payload.status === ApplicationStatus.APPROVED
				? "Courier Application Approved"
				: "Courier Application Rejected",
		templateName: "application_email",
		data: {
			name: result.employee.user.name,
			email: result.employee.user.email,
			status: result.employee.employmentStatus,
			deletionDeadline: result.employee.onboardingTime,
			isApproved: payload.status === ApplicationStatus.APPROVED,
		},
	});

	return result;
};



// export employee service
export const employeeService = {
	applyForCourier,
	approvedCourier,
};
