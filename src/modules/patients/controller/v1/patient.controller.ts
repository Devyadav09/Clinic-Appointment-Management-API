import { Request, Response } from "express";
import * as patientService from "../../service/v1/patient.service";

export const registerPatient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const patient = await patientService.registerPatient(req.body);

  res.status(201).json({
    success: true,
    message: "Patient registered successfully",
    data: patient,
  });
};

export const getPatients = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const search = req.query.search as string | undefined;

  const patients = await patientService.getPatients(search);

  res.status(200).json({
    success: true,
    data: patients,
  });
};

export const getPatientById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const patient = await patientService.getPatientById(Number(req.params.id));

  res.status(200).json({
    success: true,
    data: patient,
  });
};
