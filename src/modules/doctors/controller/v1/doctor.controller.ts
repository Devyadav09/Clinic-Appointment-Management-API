import { Request, Response } from "express";

import * as doctorService from "../../service/v1/doctor.service";

export const getAvailableSlots = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const doctorId = Number(req.params.id);

  const date = req.query.date as string;

  const result = await doctorService.getAvailableSlots(doctorId, date);

  res.status(200).json({
    success: true,
    data: result,
  });
};
