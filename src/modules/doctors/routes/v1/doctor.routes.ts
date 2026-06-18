import { Router } from "express";

import * as doctorController from "../../controller/v1/doctor.controller";

import { asyncHandler } from "../../../../utils/asyncHandler";

import { validate } from "../../../../common/middleware/validate.middleware";

import { getAvailableSlotsSchema } from "../../validation/doctor.validation";

const router = Router();

router.get(
  "/:id/slots",
  validate(getAvailableSlotsSchema),
  asyncHandler(doctorController.getAvailableSlots),
);

export default router;
