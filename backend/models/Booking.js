import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    eventTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventType",
        required: true,
        index: true,
    },
    inviteeName: {
        type: String,
        required: true,
    },
    inviteeEmail: {
        type: String,
        required: true,
    },
    inviteeTimezone: {
        type: String,
    },
    start: {
        type: Date,
        required: true,
        index: true,
    },
    end: {

        type: Date,
        required: true,
    },
    notes: {
        type: String,
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled'],
        default: 'confirmed',
    },
}, { timestamps: true });

bookingSchema.index(
    { userId: 1, eventTypeId: 1, start: 1 },
    { unique: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;