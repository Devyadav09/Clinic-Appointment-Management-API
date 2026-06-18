import { z } from "zod";

export const getAvailableSlotsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Doctor id must be positive"),
  }),

  query: z.object({
    date: z.string().date("Date must be in YYYY-MM-DD format"),
  }),
});
