import prisma from "../../../../common/database/prisma";

import { CreatePatientData } from "../../types/patients.types";

export const createPatient = async (data: CreatePatientData) => {
  return prisma.patient.create({
    data,
  });
};

export const findPatientByPhone = async (phone: string) => {
  return prisma.patient.findUnique({
    where: {
      phone,
    },
  });
};

export const findPatientById = async (patientId: number) => {
  return prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });
};

export const searchPatients = async (search?: string) => {
  return prisma.patient.findMany({
    where: search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
              },
            },
          ],
        }
      : {},
    orderBy: {
      createdAt: "desc",
    },
  });
};
