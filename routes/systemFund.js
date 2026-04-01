import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import SystemFund from '../models/SystemFund.js';

const router = express.Router();

// GET system fund
router.get('/', protect, admin, async (req, res) => {
    try {
        let fund = await SystemFund.findOne();
        if (!fund) {
            fund = await SystemFund.create({
                totalSupply: 700000000,
                reservedForLoans: 500000000,
                communityFund: 100000000,
                operationalFund: 100000000
            });
        }
        res.json({ success: true, data: fund });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// MINT money (admin only)
router.post('/mint', protect, admin, async (req, res) => {
    try {
        const { amount, to } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        
        let fund = await SystemFund.findOne();
        if (!fund) {
            fund = await SystemFund.create({
                totalSupply: 700000000,
                reservedForLoans: 500000000,
                communityFund: 100000000,
                operationalFund: 100000000
            });
        }
        
        fund.totalSupply += amount;
        fund.circulatingSupply += amount;
        fund.transactions.push({
            type: 'mint',
            amount,
            to: to || 'system',
            description: 'Minted new tokens'
        });
        await fund.save();
        
        res.json({ success: true, message: `✅ $${amount} yongewemo`, data: fund });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
