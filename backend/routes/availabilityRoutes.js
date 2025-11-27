import express from "express";
import { auth } from "../middleware/auth.js";
import { getAvailability, upsertAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

router.use(auth);

router.get("/getAvailability", getAvailability);
router.post("/upsertAvailability", upsertAvailability);

export default router;