import express from 'express';
import { protect } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// ============================================
// 💰 DEPOSIT MONEY
// ============================================
router.post('/', protect, async (req, res) => {
  try {
    const { amount, paymentMethod, reference } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount igomba kuba iri hejuru ya 0'
      });
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    }

    const oldBalance = wallet.balance;
    
    // Add money to wallet
    wallet.balance += amount;
    wallet.updatedAt = Date.now();
    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      reference: reference || `DEP_${Date.now()}_${req.user._id}`,
      description: `Deposit ya ${amount} RWF`,
      metadata: {
        paymentMethod: paymentMethod || 'mobile_money',
        oldBalance,
        newBalance: wallet.balance
      }
    });

    res.json({
      success: true,
      message: `Deposit ya ${amount} RWF yagenze neza`,
      data: {
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference
        },
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency
        }
      }
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Ikosa mu kora deposit',
      error: error.message
    });
  }
});

export default router;
