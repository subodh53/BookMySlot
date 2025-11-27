import dotenv from "dotenv";
import authRotes from "./routes/authRoutes.js";
import eventTypeRoutes from "./routes/eventTypeRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

const app = express();

connectDB();

app.use(cors({
    orgin: process.env.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running...")
})

app.use("/api/auth", authRotes);
app.use("/api/eventTypes", eventTypeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/", publicRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});