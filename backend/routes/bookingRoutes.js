import express from "express";
import { auth } from "../middleware/auth.js";
import { getMyBookings } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/getMyBookings", auth, getMyBookings);

export default router;