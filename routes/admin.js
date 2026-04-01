import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import SystemFund from '../models/SystemFund.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all loans (admin only)
router.get('/loans', protect, admin, async (req, res) => {
  try {
    const loans = await Loan.find().populate('userId', 'name email');
    res.json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system fund
router.get('/fund', protect, admin, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

export default router;
