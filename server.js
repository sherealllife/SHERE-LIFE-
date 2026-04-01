import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

// CREATE APP FIRST
const app = express();

// ============================================
// 🛡️ SECURITY MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ============================================
// 📍 IMPORT ROUTES
// ============================================
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import depositRoutes from './routes/deposit.js';
import withdrawRoutes from './routes/withdraw.js';
import loanRoutes from './routes/loan.js';
import adminRoutes from './routes/admin.js';
import okxRoutes from './routes/okx.js';
import tronRoutes from './routes/tron.js';
import systemFundRoutes from './routes/systemFund.js';
import cryptoRoutes from './routes/crypto.js';

// ============================================
// 📍 ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/okx", okxRoutes);
app.use("/api/tron", tronRoutes);
app.use("/api/system-fund", systemFundRoutes);
app.use("/api/crypto", cryptoRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "🚀 SHERE LIFE API ikora neza!" });
});

// ============================================
// 🗄️ MONGODB CONNECTION
// ============================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ MongoDB error:", err));

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
