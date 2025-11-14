import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const signup = async (req, res) => {
    try {
        const { name, email, password, username, timezone } = req.body;

        if(!name || !email || !password || !username){
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail){
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const existingUsername = await User.findOne({ username });
        if(existingUsername){
            return res.status(400).json({ success: false, message: "Username already in use" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            timezone: timezone || "UTC",
            username,
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                timezone: user.timezone,
            },
        });
    } catch (error) {
        console.error("Error creating account:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if(!emailOrUsername || !password){
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        };

        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        });

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials",
            });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                timezone: user.timezone,
            },
        });
    } catch (error) {
        console.error("Error Logging In:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.json({ user });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
