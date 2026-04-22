import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { createTronWallet } from "../utils/tron.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user",
            isVerified: true
        });

        // 🔥 Create Tron wallet
        const walletData = await createTronWallet();

        // Save wallet
        const wallet = await Wallet.create({
            userId: user._id,
            balance: 0,
            currency: "RWF",
            tronAddress: walletData.address,
            tronPrivateKey: walletData.privateKey
        });

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
        );

        res.json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            wallet: {
                tronAddress: wallet.tronAddress
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Wrong password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
        );

        res.json({
            success: true,
            message: "Login success",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ================= GET CURRENT USER =================
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
