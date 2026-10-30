
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// ================= REGISTER USER =================
router.post("/register", async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            rollNumber,
            casualLeave = 10,
            medicalLeave = 10
        } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof rollNumber !== "string" ||
            !username.trim() ||
            !email.trim() ||
            !password ||
            !rollNumber.trim()
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields, including password."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanRollNumber = rollNumber.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        const casual = Number(casualLeave);
        const medical = Number(medicalLeave);

        if (
            !Number.isInteger(casual) ||
            !Number.isInteger(medical) ||
            casual < 0 ||
            medical < 0
        ) {
            return res.status(400).json({
                message: "Leave balances must be non-negative whole numbers."
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is not connected."
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: cleanEmail },
                { rollNumber: cleanRollNumber }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or roll number is already registered. Please log in or use different details."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username: username.trim(),
            email: cleanEmail,
            password: hashedPassword,
            rollNumber: cleanRollNumber,
            casualLeave: casual,
            medicalLeave: medical
        });

        return res.status(201).json({
            message: "Registration successful! Please log in.",
            userId: newUser._id,
            username: newUser.username,
            email: newUser.email,
            rollNumber: newUser.rollNumber,
            casualLeave: newUser.casualLeave,
            medicalLeave: newUser.medicalLeave
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or roll number is already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed. Check the server terminal."
        });
    }
});

// ================= LOGIN USER =================
router.post("/login", async (req, res) => {
    try {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            typeof req.body?.password === "string"
                ? req.body.password
                : "";

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter your email and password."
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is not connected."
            });
        }

        const user = await User.findOne({ email });

        if (!user || !user.password) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        return res.json({
            message: "Login successful.",
            userId: user._id,
            username: user.username,
            email: user.email,
            rollNumber: user.rollNumber,
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed. Check the server terminal."
        });
    }
});

// ================= GET LEAVE BALANCE =================
router.get("/leave-balance/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.json({
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });
    } catch (error) {
        console.error("Leave balance error:", error);

        return res.status(500).json({
            message: "Could not fetch leave balance."
        });
    }
});

// ================= APPLY FOR LEAVE =================
async function applyLeave(req, res) {
    try {
        const userId = req.params.id;
        const type = req.body?.type || req.body?.leaveType;
        const days = Number(req.body?.days);

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (!Number.isInteger(days) || days <= 0) {
            return res.status(400).json({
                message: "Enter a valid positive number of leave days."
            });
        }

        if (!["casual", "medical"].includes(type)) {
            return res.status(400).json({
                message: "Invalid leave type."
            });
        }

        const field =
            type === "casual" ? "casualLeave" : "medicalLeave";

        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                [field]: { $gte: days }
            },
            {
                $inc: { [field]: -days }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            const exists = await User.exists({ _id: userId });

            if (!exists) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            return res.status(400).json({
                message: "Insufficient leave balance."
            });
        }

        return res.json({
            message: "Leave applied successfully.",
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });
    } catch (error) {
        console.error("Apply leave error:", error);

        return res.status(500).json({
            message: "Leave application failed."
        });
    }
}

router.post("/apply-leave/:id", applyLeave);
router.post("/leave/:id", applyLeave);

module.exports = router;
