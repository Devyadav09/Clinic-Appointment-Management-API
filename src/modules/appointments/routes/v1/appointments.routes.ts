import { Router } from "express";
import * as controller from "../../controller/v1/appointment.controller";
import { validate } from "../../../../common/middleware/validate.middleware";
import {
  createAppointmentSchema,
  updateStatusSchema,
  listAppointmentsSchema,
  getAppointmentSchema,
} from "../../validation/appointment.validation";
import { asyncHandler } from "../../../../utils/asyncHandler";

const router = Router();

router.post(
  "/",
  validate(createAppointmentSchema),
  asyncHandler(controller.bookAppointment)
);

router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

router.get(
  "/",
  validate(listAppointmentsSchema),
  asyncHandler(controller.listAppointments)
);

router.get(
  "/:id",
  validate(getAppointmentSchema),
  asyncHandler(controller.getAppointmentById)
);

export default router;