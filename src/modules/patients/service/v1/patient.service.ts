import * as patientRepository from "../../repository/v1/patient.repository";

import {
  CreatePatientInput,
  CreatePatientData,
} from "../../types/patients.types";

import { ConflictError } from "../../../../common/exceptions/ConflictError";
import { NotFoundError } from "../../../../common/exceptions/NotFoundError";

export const registerPatient = async (data: CreatePatientInput) => {
  const existingPatient = await patientRepository.findPatientByPhone(
    data.phone,
  );

  if (existingPatient) {
    throw new ConflictError("Patient already exists with this phone number");
  }

  const patientData: CreatePatientData = {
    name: data.name,
    phone: data.phone,
  };

  if (data.gender) {
    patientData.gender = data.gender;
  }

  if (data.dateOfBirth) {
    patientData.dateOfBirth = new Date(data.dateOfBirth);
  }

  return patientRepository.createPatient(patientData);
};

export const getPatientById = async (patientId: number) => {
  const patient = await patientRepository.findPatientById(patientId);

  if (!patient) {
    throw new NotFoundError("Patient not found");
  }

  return patient;
};

export const getPatients = async (search?: string) => {
  return patientRepository.searchPatients(search);
};
