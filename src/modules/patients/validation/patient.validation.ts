import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),

  gender: z.enum(["Male", "Female"]).optional(),

  dateOfBirth: z.string().optional(),
});

export const patientIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
