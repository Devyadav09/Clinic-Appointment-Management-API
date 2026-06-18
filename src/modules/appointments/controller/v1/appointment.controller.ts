import { Request, Response } from "express";
import * as service from "../../service/v1/apponitment.service";

export const bookAppointment = async (req: Request, res: Response) => {
  const result = await service.bookAppointment(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
};

export const listAppointments = async (req: Request, res: Response) => {
  const result = await service.listAppointments(req.query as any);

  res.json({
    success: true,
    data: result,
  });
};

export const getAppointmentById = async (req: Request, res: Response) => {
  const result = await service.getAppointmentById(Number(req.params.id));

  res.json({
    success: true,
    data: result,
  });
};

export const updateStatus = async (req: Request, res: Response) => {
  const result = await service.changeStatus(
    Number(req.params.id),
    req.body.status,
  );

  res.json({
    success: true,
    data: result,
  });
};
