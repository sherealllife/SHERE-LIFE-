import express from 'express';
import { protect } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

router.post('/send', protect, async (req, res) => {
    try {
        const { currency, toAddress, amount } = req.body;
        
        // Get sender wallet
        const senderWallet = await Wallet.findOne({ userId: req.user.id });
        if (!senderWallet) return res.status(404).json({ message: 'Wallet not found' });
        
        // Check balance
        if (currency === 'USDT' && (senderWallet.usdtBalance || 0) < amount) {
            return res.status(400).json({ message: 'Insufficient USDT balance' });
        }
        if (currency === 'TRX') {
            return res.status(400).json({ message: 'TRX send via Tron API' });
        }
        if (currency === 'TRUMP' && (senderWallet.trumpBalance || 0) < amount) {
            return res.status(400).json({ message: 'Insufficient TRUMP balance' });
        }
        
        // Update sender balance
        if (currency === 'USDT') {
            senderWallet.usdtBalance -= amount;
            await senderWallet.save();
        }
        if (currency === 'TRUMP') {
            senderWallet.trumpBalance -= amount;
            await senderWallet.save();
        }
        
        res.json({ success: true, message: `✅ ${amount} ${currency} sent to ${toAddress}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
