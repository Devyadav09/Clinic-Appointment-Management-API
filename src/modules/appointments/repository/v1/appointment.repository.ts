import prisma from "../../../../common/database/prisma";

export const findAppointments = async (filter: {
  doctorId?: number;
  dateRange?: { gte: Date; lte: Date };
}) => {
  return prisma.appointment.findMany({
    where: {
      ...(filter.doctorId && { doctorId: filter.doctorId }),
      ...(filter.dateRange && { date: filter.dateRange }),
    },
  });
};

export const findById = async (id: number) => {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
    },
  });
};

export const updateStatus = async (
  id: number,
  status: "BOOKED" | "COMPLETED" | "CANCELLED",
) => {
  return prisma.appointment.update({
    where: { id },
    data: { status },
  });
};

export const countTodayAppointments = async (doctorId: number, date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.appointment.count({
    where: {
      doctorId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });
};
