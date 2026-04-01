import express from 'express';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Mock OKX order (demo mode)
router.post('/order', protect, admin, async (req, res) => {
    try {
        const { instId, side, ordType, sz } = req.body;
        
        // Simulate order
        res.json({
            success: true,
            message: `✅ Order placed: ${side} ${sz} ${instId} on OKX (demo)`,
            data: { instId, side, ordType, sz, orderId: `DEMO_${Date.now()}` }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock OKX withdraw
router.post('/withdraw', protect, admin, async (req, res) => {
    try {
        const { ccy, amt, dest, toAddr } = req.body;
        
        // Simulate withdraw
        res.json({
            success: true,
            message: `✅ Withdraw: ${amt} ${ccy} sent to ${toAddr} (demo)`,
            data: { ccy, amt, toAddr, withdrawId: `WIT_${Date.now()}` }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get OKX balance
router.get('/balance', protect, admin, async (req, res) => {
    try {
        res.json({
            success: true,
            data: [
                { ccy: "USDT", bal: "1000000", availBal: "1000000" },
                { ccy: "BTC", bal: "0.5", availBal: "0.5" }
            ],
            demoMode: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
