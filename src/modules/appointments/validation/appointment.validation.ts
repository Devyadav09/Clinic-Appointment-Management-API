import { z } from "zod";

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.number(),
    doctorId: z.number(),
    date: z.string(),
    timeSlot: z.string(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
  body: z.object({
    status: z.enum(["BOOKED", "COMPLETED", "CANCELLED"]),
  }),
});

export const listAppointmentsSchema = z.object({
  query: z.object({
    doctorId: z.coerce.number().optional(),
    date: z.string().optional(),
  }),
});

export const getAppointmentSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});
