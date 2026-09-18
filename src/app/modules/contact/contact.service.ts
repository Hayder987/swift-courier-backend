import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IQuery } from "../../interfaces";
import { IContactPayload } from "./contact.validation";

const createContact = async (payload: IContactPayload) => {
  const result = await prisma.contact.create({
    data: {
      title: payload.title,
      email: payload.email,
      description: payload.description,
    },
  });

  return result;
};

// get all contact
const getAllContacts = async (query: IQuery) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const result = await prisma.contact.findMany({
    take: limit,
    skip: skip,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.contact.count();

  return {
    data: result,
    meta: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// get contact info by id
const getContactById = async (id: string) => {
  const result = await prisma.contact.findUnique({
    where: {
      id,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact not found.");
  }

  return result;
};

// delete contact log
const deleteContact = async (id: string) => {
  const existingContact = await prisma.contact.findUnique({
    where: {
      id,
    },
  });

  if (!existingContact) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact not found.");
  }

  const result = await prisma.contact.delete({
    where: {
      id,
    },
  });

  return result;
};

export const ContactService = {
  createContact,
  getAllContacts,
  getContactById,
  deleteContact,
};
