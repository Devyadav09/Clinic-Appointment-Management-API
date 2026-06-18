import { Router } from "express";

import patientRoutes from "../../src/modules/patients/routes/v1/paitent.route";
import appointmentRoutes from "../../src/modules/appointments/routes/v1/appointments.routes";
import doctorRoutes from "../../src/modules/doctors/routes/v1/doctor.routes";
const router = Router();

router.use("/patients", patientRoutes);
router.use("/patients", appointmentRoutes);
router.use("/patients", doctorRoutes);

export default router;