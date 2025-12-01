import User from "../models/User.js";
import Booking from "../models/Booking.js";
import EventType from "../models/EventType.js";

export const createPublicBooking = async (req, res) => {
    try {
        const { username, slug } = req.params;
        const { start, inviteeName, inviteeEmail, inviteeTimezone, notes } = req.body;

        if(!start || !inviteeName || !inviteeEmail) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }
        
        const startDate = new Date(start);
        if(Number.isNaN(startDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start time",
            });
        }

        const user = await User.findOne({ username });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const eventType = await EventType.findOne({
            userId: user._id,
            slug,
        });

        if(!eventType) {
            return res.status(404).json({
                success: false,
                message: "Event type not found",
            });
        }

        const durationMinutes = eventType.durationMinutes || 30;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        const existingBooking = await Booking.findOne({
            userId: user._id,
            eventTypeId: eventType._id,
            start: startDate,
            status: 'confirmed',
        });

        if(existingBooking) {
            return res.status(409).json({
                success: false,
                message: "This time slot has beek booked. Please choose another time.",
            });
        }

        const booking = await Booking.create({
            userId: user._id,
            eventTypeId: eventType._id,
            start: startDate,
            end: endDate,
            inviteeName,
            inviteeEmail,
            inviteeTimezone,
            notes,
            status: 'confirmed',
        });

        res.status(201).json({
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
            },
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