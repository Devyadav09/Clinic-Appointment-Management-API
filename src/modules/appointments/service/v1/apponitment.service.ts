import * as repo from "../../repository/v1/appointment.repository";
import { NotFoundError } from "../../../../common/exceptions/NotFoundError";
import { BadRequestError } from "../../../../common/exceptions/BadRequest";
import { AppointmentStatus, Prisma } from "@prisma/client";
import prisma from "../../../../common/database/prisma";
import { AppError } from "../../../../common/exceptions/AppError";

export const bookAppointment = async (input: {
  patientId: number;
  doctorId: number;
  date: string;
  timeSlot: string;
}) => {
  const d = new Date(input.date);

  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: input.doctorId,
          timeSlot: input.timeSlot,
          date: { gte: start, lte: end },
          status: AppointmentStatus.BOOKED,
        },
      });

      if (existing) {
        throw new AppError(409, "Slot already booked");
      }
      const lastToken = await tx.appointment.findFirst({
        where: {
          doctorId: input.doctorId,
          date: { gte: start, lte: end },
        },
        orderBy: { tokenNumber: "desc" },
        select: { tokenNumber: true },
      });

      const tokenNumber = (lastToken?.tokenNumber ?? 0) + 1;

      
      return tx.appointment.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          date: d,
          timeSlot: input.timeSlot,
          tokenNumber,
          status: AppointmentStatus.BOOKED,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
};

export const listAppointments = async (query: {
  doctorId?: number;
  date?: string;
}) => {
  const filter: {
    doctorId?: number;
    dateRange?: { gte: Date; lte: Date };
  } = {};

  if (query.doctorId !== undefined) {
    filter.doctorId = query.doctorId;
  }

  if (query.date !== undefined) {
    const d = new Date(query.date);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    filter.dateRange = { gte: start, lte: end };
  }

  return repo.findAppointments(filter);
};

export const getAppointmentById = async (id: number) => {
  const appointment = await repo.findById(id);

  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  return appointment;
};

export const changeStatus = async (
  id: number,
  status: "BOOKED" | "COMPLETED" | "CANCELLED",
) => {
  const appointment = await repo.findById(id);

  if (!appointment) {
    throw new NotFoundError("Appointment not found");
  }

  if (
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED"
  ) {
    throw new BadRequestError("Cannot change status of final state");
  }

  if (appointment.status === "BOOKED" && status === "BOOKED") {
    throw new BadRequestError("Invalid transition");
  }

  return repo.updateStatus(id, status);
};
