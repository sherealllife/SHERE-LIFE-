import express from 'express';
import { protect } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { sendUSDT, sendTRX } from '../services/tronService.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
    try {
        const { amount, paymentMethod, walletAddress, currency } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount igomba kuba iri hejuru ya 0' });
        }

        const wallet = await Wallet.findOne({ userId: req.user.id });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet ntaboneka' });
        }

        let oldBalance, newBalance;
        
        if (currency === 'USDT') {
            const usdtBalance = wallet.usdtBalance || 0;
            if (usdtBalance < amount) {
                return res.status(400).json({ error: `Amafaranga ahagije ntaboneka. USDT Balance: ${usdtBalance}, Withdraw: ${amount}` });
            }
            oldBalance = usdtBalance;
            
            // Send USDT to exchange via Tron
            if (walletAddress) {
                const sendResult = await sendUSDT(walletAddress, amount);
                if (!sendResult.success) {
                    return res.status(400).json({ error: 'Failed to send USDT: ' + sendResult.error });
                }
                console.log('✅ USDT sent:', sendResult.transactionId);
            }
            
            wallet.usdtBalance = usdtBalance - amount;
            newBalance = wallet.usdtBalance;
        } else {
            if (wallet.balance < amount) {
                return res.status(400).json({ error: `Amafaranga ahagije ntaboneka. Balance: ${wallet.balance}, Withdraw: ${amount}` });
            }
            oldBalance = wallet.balance;
            wallet.balance -= amount;
            newBalance = wallet.balance;
        }
        
        wallet.updatedAt = Date.now();
        await wallet.save();

        await Transaction.create({
            userId: req.user.id,
            type: 'withdraw',
            amount,
            status: 'completed',
            reference: `WIT_${Date.now()}_${req.user.id}`,
            description: `Withdraw ya ${amount} ${currency || 'RWF'}${walletAddress ? ` yoherejwe kuri ${walletAddress}` : ''}`,
            metadata: {
                paymentMethod: paymentMethod || 'bank_transfer',
                walletAddress: walletAddress || null,
                currency: currency || 'RWF',
                oldBalance,
                newBalance
            }
        });

        res.json({
            success: true,
            message: `Withdraw ya ${amount} ${currency || 'RWF'} yagenze neza${walletAddress ? ` yoherejwe kuri ${walletAddress}` : ''}`,
            data: {
                transaction: { amount, status: 'completed', currency: currency || 'RWF' },
                wallet: { 
                    balance: wallet.balance, 
                    usdtBalance: wallet.usdtBalance,
                    currency: 'RWF' 
                }
            }
        });

    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
