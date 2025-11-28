import express from "express";
import User from "../models/User.js";
import EventType from "../models/EventType.js";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import { generateSlots } from "../services/slotService.js";
import { createPublicBooking } from "../controllers/bookingController.js";
import { DateTime } from "luxon";

const router = express.Router();

router.get("/u/:username/event/:slug/availability", async (req, res) => {
  try {
    const { username, slug } = req.params;
    let { start, end } = req.query;

    // 1. Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Find event type
    const eventType = await EventType.findOne({
      userId: user._id,
      slug,
    });

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: "Event type not found",
      });
    }

    // 3. Get availability
    const availability = await Availability.findOne({ userId: user._id });

    const timezone = user.timezone || "UTC";

    // Default date range: today -> today + 6 days in host's timezone
    const today = DateTime.now().setZone(timezone).startOf("day");

    if (!start) {
      start = today.toISODate(); // "YYYY-MM-DD"
    }
    if (!end) {
      end = today.plus({ days: 6 }).toISODate();
    }

    // If no availability or no weekly rules → no slots
    if (!availability || !availability.weekly || availability.weekly.length === 0) {
      return res.json({
        success: true,
        event: {
          id: eventType._id,
          title: eventType.title,
          description: eventType.description,
          durationMinutes: eventType.durationMinutes,
        },
        host: {
          name: user.name,
          username: user.username,
        },
        timezone,
        startDate: start,
        endDate: end,
        slots: [],
      });
    }

    // 4. Generate all potential slots for this range
    const allSlots = generateSlots({
      timezone,
      weeklyRules: availability.weekly,
      exceptions: availability.exceptions || [],
      startDate: start,
      endDate: end,
      durationMinutes: eventType.durationMinutes,
      bufferBefore: eventType.bufferBefore || 0,
      bufferAfter: eventType.bufferAfter || 0,
      minNoticeMinutes: eventType.minNoticeMinutes || 60,
    });

    // 5. Fetch existing bookings in this range
    const rangeStart = DateTime.fromISO(start, { zone: timezone })
      .startOf("day")
      .toUTC()
      .toJSDate();
    const rangeEnd = DateTime.fromISO(end, { zone: timezone })
      .endOf("day")
      .toUTC()
      .toJSDate();

    const existingBookings = await Booking.find({
      userId: user._id,
      eventTypeId: eventType._id,
      status: "confirmed",
      start: { $gte: rangeStart, $lte: rangeEnd },
    });

    // 6. Filter out slots that overlap any existing booking
    const filteredSlots = allSlots.filter((slot) => {
      const slotStart = DateTime.fromISO(slot.start);
      const slotEnd = DateTime.fromISO(slot.end);

      return !existingBookings.some((booking) => {
        const bookingStart = DateTime.fromJSDate(booking.start);
        const bookingEnd = DateTime.fromJSDate(booking.end);

        // overlap if slotStart < bookingEnd && slotEnd > bookingStart
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
    });

    res.json({
      success: true,
      event: {
        id: eventType._id,
        title: eventType.title,
        description: eventType.description,
        durationMinutes: eventType.durationMinutes,
      },
      host: {
        name: user.name,
        username: user.username,
      },
      timezone,
      startDate: start,
      endDate: end,
      slots: filteredSlots,
    });
  } catch (error) {
    console.error("Error fetching public availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post("/u/:username/event/:slug/book", createPublicBooking);

export default router;