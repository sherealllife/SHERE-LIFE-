import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Loan from '../models/Loan.js';
import Wallet from '../models/Wallet.js';
import SystemFund from '../models/SystemFund.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Apply for loan
router.post('/apply', protect, async (req, res) => {
    try {
        const { amount, purpose, dueDate, currency } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }

        // Convert to RWF for reserve check
        const rwfAmount = currency === 'USDT' ? amount * 1000 : amount;

        // Get system fund
        let fund = await SystemFund.findOne();
        if (!fund) {
            fund = await SystemFund.create({
                totalSupply: 700000000,
                reservedForLoans: 500000000,
                communityFund: 100000000,
                operationalFund: 100000000
            });
        }

        if (fund.reservedForLoans < rwfAmount) {
            return res.status(400).json({ error: 'Not enough reserve funds' });
        }

        // Create loan
        const loan = await Loan.create({
            userId: req.user._id,
            amount: amount,
            amountRWF: rwfAmount,
            currency: currency || 'RWF',
            purpose: purpose || 'Not specified',
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending'
        });

        // Update system fund
        fund.reservedForLoans -= rwfAmount;
        fund.transactions.push({
            type: 'loan',
            amount: rwfAmount,
            to: req.user._id,
            description: `Loan requested: ${amount} ${currency || 'RWF'}`
        });
        await fund.save();

        res.json({
            success: true,
            message: `Loan requested successfully: ${amount} ${currency || 'RWF'}`,
            data: loan
        });

    } catch (error) {
        console.error('Apply loan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get my loans
router.get('/my-loans', protect, async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: loans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all loans (admin only)
router.get('/all', protect, admin, async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: loans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve loan (admin only) - Send USDT instead of RWF
router.put('/approve/:id', protect, admin, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ error: `Loan already ${loan.status}` });
        }

        // Calculate amount in USDT (1000 RWF = 1 USDT)
        let usdtAmount;
        let description;
        
        if (loan.currency === 'USDT') {
            usdtAmount = loan.amount;
            description = `Loan approved: ${usdtAmount} USDT`;
        } else {
            usdtAmount = loan.amount / 1000;
            description = `Loan approved: ${usdtAmount} USDT (${loan.amount} RWF)`;
        }

        // Find user wallet
        let wallet = await Wallet.findOne({ userId: loan.userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId: loan.userId, balance: 0 });
        }

        // Add USDT to wallet
        const oldUsdtBalance = wallet.usdtBalance || 0;
        wallet.usdtBalance = oldUsdtBalance + usdtAmount;
        wallet.updatedAt = Date.now();
        await wallet.save();

        // Update loan status
        loan.status = 'approved';
        await loan.save();

        // Create transaction
        await Transaction.create({
            userId: loan.userId,
            type: 'loan',
            amount: loan.amount,
            usdtAmount: usdtAmount,
            status: 'completed',
            description: description,
            metadata: { 
                loanId: loan._id, 
                oldUsdtBalance, 
                newUsdtBalance: wallet.usdtBalance,
                exchangeRate: 1000,
                currency: loan.currency
            }
        });

        res.json({
            success: true,
            message: `Loan approved: ${usdtAmount} USDT sent`,
            data: { 
                loan, 
                wallet: { 
                    usdtBalance: wallet.usdtBalance,
                    balance: wallet.balance 
                } 
            }
        });

    } catch (error) {
        console.error('Approve loan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reject loan (admin only)
router.put('/reject/:id', protect, admin, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ error: `Loan already ${loan.status}` });
        }

        loan.status = 'rejected';
        await loan.save();

        res.json({
            success: true,
            message: 'Loan rejected',
            data: loan
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Repay loan
router.put('/repay/:id', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (loan.status !== 'approved') {
            return res.status(400).json({ error: 'Loan not approved yet' });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }

        // Find user wallet
        const wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Check USDT balance for repayment
        const usdtBalance = wallet.usdtBalance || 0;
        if (usdtBalance < amount) {
            return res.status(400).json({ error: `Insufficient USDT balance. Balance: ${usdtBalance}, Repayment: ${amount}` });
        }

        // Update wallet
        const oldUsdtBalance = usdtBalance;
        wallet.usdtBalance = oldUsdtBalance - amount;
        wallet.updatedAt = Date.now();
        await wallet.save();

        // Update loan
        const repaidInRWF = amount * 1000;
        loan.repaidAmount += repaidInRWF;
        if (loan.repaidAmount >= loan.amountRWF || loan.repaidAmount >= loan.amount * 1000) {
            loan.status = 'paid';
        }
        await loan.save();

        // Create transaction
        await Transaction.create({
            userId: req.user._id,
            type: 'repayment',
            amount: amount,
            usdtAmount: amount,
            status: 'completed',
            description: `Loan repayment: ${amount} USDT`,
            metadata: { 
                loanId: loan._id, 
                oldUsdtBalance, 
                newUsdtBalance: wallet.usdtBalance 
            }
        });

        res.json({
            success: true,
            message: `Repayment successful: ${amount} USDT`,
            data: { loan, wallet }
        });

    } catch (error) {
        console.error('Repay loan error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

