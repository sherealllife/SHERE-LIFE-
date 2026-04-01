import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET my wallet
router.get('/', protect, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
        }
        res.json({ success: true, data: wallet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET balance
router.get('/balance', protect, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
        }
        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET transactions
router.get('/transactions', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE wallet (Admin only)
router.put('/', protect, admin, async (req, res) => {
    try {
        const { userId, tronAddress, balance, trumpBalance, usdtBalance } = req.body;
        
        const updateData = {};
        if (tronAddress !== undefined) updateData.tronAddress = tronAddress;
        if (balance !== undefined) updateData.balance = balance;
        if (trumpBalance !== undefined) updateData.trumpBalance = trumpBalance;
        if (usdtBalance !== undefined) updateData.usdtBalance = usdtBalance;
        updateData.updatedAt = Date.now();
        
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true }
        );
        
        res.json({ success: true, data: wallet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
