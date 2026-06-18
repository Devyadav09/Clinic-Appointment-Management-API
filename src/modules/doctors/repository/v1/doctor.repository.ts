import prisma from "../../../../common/database/prisma";

export const findDoctorById = async (doctorId: number) => {
  return prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });
};

export const findDoctorSchedule = async (
  doctorId: number,
  dayOfWeek: number,
) => {
  return prisma.doctorSchedule.findFirst({
    where: {
      doctorId,
      dayOfWeek,
    },
  });
};

export const findBookedAppointments = async (doctorId: number, date: Date) => {
  return prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: "BOOKED",
    },
    select: {
      timeSlot: true,
    },
  });
};
