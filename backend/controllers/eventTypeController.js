import EventType from "../models/EventType.js";

export const getEventTypes = async (req, res) => {
    try {
        const eventTypes = await EventType.find({ userId: req.user.id })
            .sort({ createdAt: -1 }); // 👈 this is correct

        res.json(eventTypes); // returns an array, which your frontend expects
    } catch (error) {
        console.error("Error Fetching Event Types:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const createEventType = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            durationMinutes,
            locationType,
            locationUrl,
            bufferBefore,
            bufferAfter,
            minNoticeMinutes,
            maxSchedulingDays,
        } = req.body;

        if (!title || !slug || !durationMinutes) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existing = await EventType.findOne({
            userId: req.user.id,
            slug,
        });

        if (existing) {
            return res
                .status(400)
                .json({ message: "Slug already used for this user" });
        }

        const eventType = await EventType.create({
            userId: req.user.id,
            title,
            slug,
            description,
            durationMinutes,
            locationType,
            locationUrl,
            bufferBefore,
            bufferAfter,
            minNoticeMinutes,
            maxSchedulingDays,
        });
        res.status(201).json({
            success: true,
            eventType,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const updateEventType = async (req, res) => {
  try {
    const eventType = await EventType.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!eventType) {
      return res.status(404).json({ message: "Event type not found" });
    }

    Object.assign(eventType, req.body);
    await eventType.save();

    res.json(eventType);
  } catch (err) {
    console.error("Update event type error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEventType = async (req, res) => {
  try {
    const eventType = await EventType.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!eventType) {
      return res.status(404).json({ message: "Event type not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete event type error:", err);
    res.status(500).json({ message: "Server error" });
  }
};