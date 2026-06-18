import { Router } from "express";
import * as patientController from "../../controller/v1/patient.controller";

import { validate } from "../../../../common/middleware/validate.middleware";
import { asyncHandler } from "../../../../utils/asyncHandler";

import {
  createPatientSchema,
  patientIdSchema,
} from "../../validation/patient.validation";

const router = Router();

router.post("/", validate(createPatientSchema), asyncHandler(patientController.registerPatient));

router.get("/", asyncHandler(patientController.getPatients));

router.get( "/:id", validate(patientIdSchema, "params"), asyncHandler(patientController.getPatientById));

export default router;
