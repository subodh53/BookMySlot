import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true},
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        username: { type: String, required: true, unique: true, index: true },
        timezone: { type: String, default: "UTC" },
        google: {
            googleId: String,
            accessToken: String,
            refreshToken: String,
            tokenExpiry: Date,
        },
        settings: {
            defaultBufferBefore: { type: Number, default: 0 },
            defaultBufferAfter: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;