import express from "express";
import { auth } from "../middleware/auth.js";
import { getEventTypes, createEventType, updateEventType, deleteEventType } from "../controllers/eventTypeController.js";

const router = express.Router();

router.use(auth);

router.get("/getEventTypes", getEventTypes);
router.post("/createEventType", createEventType);
router.put("/updateEventType/:id", updateEventType);
router.delete("/deleteEventType/:id", deleteEventType);

export default router;