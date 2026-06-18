export interface CreatePatientInput {
  name: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface CreatePatientData {
  name: string;
  phone: string;
  gender?: string;
  dateOfBirth?: Date;
}