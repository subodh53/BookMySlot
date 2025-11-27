import mongoose from 'mongoose';

const weeklySlotSchema = new mongoose.Schema({
    weekday: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
}, { _id: false});

const exceptionSchema = new mongoose.Schema({
    start: {
        type: Date,
        required: true,
    },
    end: {
        type: Date,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: false,
    },
}, {_id: false});

const availabilitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    weekly: [weeklySlotSchema],
    exceptions: [exceptionSchema],
}, { timestamps: true });

availabilitySchema.index({ userId: 1 }, { unique: true });

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;