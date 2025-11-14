import mongoose from "mongoose";

const eventTypeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        slug: { type: String, required: true },
        description: String,
        durationMinutes: { type: Number, required: true },
        locationType: {
            type: String,
            enum: ["video", "phone", "in-person", "link"],
            default: "video",
        },
        locationUrl: String,
        bufferBefore: { type: Number, default: 0 },
        bufferAfter: { type: Number, default: 0 },
        minNoticeMinutes: { type: Number, default: 60 },
        maxSchedulingDays: { type: Number, default: 30 },
        priceCents: { type: Number, default: 0 },
        questions: [
            {
                label: String,
                required: Boolean,
                type: { type: String, default: "text" },
            },
        ],
    },
    { timestamps: true }
);

eventTypeSchema.index({ userId: 1, slug: 1 }, { unique: true });

const EventType = mongoose.model("EventType", eventTypeSchema);
export default EventType;