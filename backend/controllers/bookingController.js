import User from "../models/User.js";
import Booking from "../models/Booking.js";
import EventType from "../models/EventType.js";
import { sendBookingEmails } from "../utils/mail.js";

export const createPublicBooking = async (req, res) => {
  try {
    const { username, slug } = req.params;
    const {
      start,
      inviteeName,
      inviteeEmail,
      inviteeTimezone,
      notes,
    } = req.body;

    if (!start || !inviteeName || !inviteeEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time",
      });
    }

    // 1) Find the host
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2) Find the event type
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

    // 3) Calculate end time from event duration
    const durationMinutes = eventType.durationMinutes || 30;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // 4) Check for existing booking at same time (optional extra safety)
    const existing = await Booking.findOne({
      userId: user._id,
      eventTypeId: eventType._id,
      start: startDate,
      status: "confirmed",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This time slot has just been booked. Please pick another.",
      });
    }

    // 5) Create booking
    const booking = await Booking.create({
      userId: user._id,
      eventTypeId: eventType._id,
      start: startDate,
      end: endDate,
      inviteeName,
      inviteeEmail,
      inviteeTimezone,
      notes,
      status: "confirmed",
    });

    // 6) Build response payload for frontend
    const responsePayload = {
      success: true,
      booking: {
        id: booking._id,
        start: booking.start,
        end: booking.end,
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        inviteeTimezone: booking.inviteeTimezone,
        notes: booking.notes,
        status: booking.status,
      },
      event: {
        id: eventType._id,
        title: eventType.title,
        durationMinutes: eventType.durationMinutes,
      },
      host: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email, // host email used for notifications
        timezone: user.timezone,
      },
    };

    res.status(201).json(responsePayload);

    // 7) Send emails asynchronously but DON'T fail the API if email sending fails.
    //    We `await` here to get better logs; if you prefer fire-and-forget, remove await.
    sendBookingEmails({
      booking: responsePayload.booking,
      event: responsePayload.event,
      host: responsePayload.host,
    }).catch((err) => {
      console.error("Error sending booking emails:", err);
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const now = new Date();

        const bookings = await Booking.find({
            userId,
            start: { $gte: now },
            status: "confirmed",
        })
            .sort({ start: 1 })
            .populate("eventTypeId", "title durationMinutes")
            .lean();

        res.json({
            success: true,
            bookings: bookings.map((b) => ({
                id: b._id,
                start: b.start,
                end: b.end,
                inviteeName: b.inviteeName,
                inviteeEmail: b.inviteeEmail,
                inviteeTimezone: b.inviteeTimezone,
                notes: b.notes,
                status: b.status,
                event: b.eventTypeId
                    ? {
                        id: b.eventTypeId._id,
                        title: b.eventTypeId.title,
                        durationMinutes: b.eventTypeId.durationMinutes,
                    }
                    : null,
            })),
        });
    } catch (error) {
        console.error("Error Fetching Bookings:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const updateBookingStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["confirmed", "cancelled"];

        if(!allowedStatuses.includes(status)){
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const booking = await Booking.findOne({ _id: id, userId });

        if(!booking){
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        
        booking.status = status;
        await booking.save();

        return res.json({
            success: true,
            booking: {
                id: booking._id,
                start: booking.start,
                end: booking.end,
                inviteeName: booking.inviteeName,
                inviteeEmail: booking.inviteeEmail,
                inviteeTimezone: booking.inviteeTimezone,
                notes: booking.notes,
                status: booking.status,
                eventTypeId: booking.eventTypeId,
            },
        });
    } catch (error) {
        console.error("Error updating booking status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}