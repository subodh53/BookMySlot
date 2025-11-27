import Availability from "../models/Availability.js";

export const getAvailability = async (req, res) => {
    try {
        const availability = await Availability.findOne({ userId: req.user.id });

        if(!availability) {
            return res.json({
                userId: req.user.id,
                weekly: [],
                exceptions: [],
            });
        }

        res.json(availability);
    } catch (error) {
        console.log("Error fetching availability:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}

export const upsertAvailability = async (req, res) => {
    try {
        const { weekly, exceptions } = req.body;
        
        const update = {};
        if(Array.isArray(weekly)) update.weekly = weekly;
        if(Array.isArray(exceptions)) update.exceptions = exceptions;

        const availability = await Availability.findOneAndUpdate(
            { userId: req.user.id },
            {
                userId: req.user.id,
                ...update,
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(201).json({
            success: true,
            message: "Availability updated successfully",
            availability,
        });
    } catch (error) {
        console.log("Error updating availability:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
};