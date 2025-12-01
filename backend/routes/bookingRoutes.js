import express from "express";
import { auth } from "../middleware/auth.js";
import { getMyBookings, updateBookingStatus } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/getMyBookings", auth, getMyBookings);
router.patch("/:id", auth, updateBookingStatus);

export default router;