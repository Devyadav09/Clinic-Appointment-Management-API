import * as doctorRepository from "../../repository/v1/doctor.repository";

import { NotFoundError } from "../../../../common/exceptions/NotFoundError";

import { generateTimeSlots } from "../../../../utils/timeSlot";

export const getAvailableSlots = async (doctorId: number, date: string) => {
  const doctor = await doctorRepository.findDoctorById(doctorId);

  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }

  const requestedDate = new Date(date);

  const dayOfWeek = requestedDate.getDay();

  const schedule = await doctorRepository.findDoctorSchedule(
    doctorId,
    dayOfWeek,
  );

  if (!schedule) {
    return {
      slots: [],
      message: "Doctor is not available on this day",
    };
  }

  const allSlots = generateTimeSlots(
    schedule.startTime,
    schedule.endTime,
    schedule.slotDuration,
  );

  const bookedAppointments = await doctorRepository.findBookedAppointments(
    doctorId,
    requestedDate,
  );

  const bookedSlots = bookedAppointments.map(
  (appointment: { timeSlot: string }) => appointment.timeSlot,
);

  const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

  return {
    slots: availableSlots,
  };
};
