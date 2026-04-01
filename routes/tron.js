import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { 
  getTronBalance, 
  sendTRX, 
  getUSDTBalance, 
  sendUSDT,
  validateAddress,
  createWallet 
} from '../services/tronService.js';

const router = express.Router();

// Check Tron status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Tron service is running',
    network: process.env.TRON_NETWORK || 'mainnet',
    fullHost: process.env.TRON_FULL_HOST || 'https://api.trongrid.io'
  });
});

// Get balance
router.get('/balance/:address', protect, async (req, res) => {
  try {
    const { address } = req.params;
    const validation = validateAddress(address);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Invalid Tron address' });
    }
// GET USDT balance
router.get('/balance/usdt/:address', protect, async (req, res) => {
    const result = await getUSDTBalance(req.params.address);
    res.json(result);
});
    
    const trxBalance = await getTronBalance(address);
    const usdtBalance = await getUSDTBalance(address);
    
    res.json({ success: true, address, trx: trxBalance, usdt: usdtBalance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send TRX
router.post('/send-trx', protect, async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'To address and valid amount required' });
    }
    
    const validation = validateAddress(toAddress);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Invalid recipient address' });
    }
    
    const result = await sendTRX(toAddress, amount);
    if (result.success) {
      res.json({ success: true, message: `Successfully sent ${amount} TRX to ${toAddress}`, transactionId: result.transactionId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send USDT
router.post('/send-usdt', protect, async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'To address and valid amount required' });
    }
    
    const validation = validateAddress(toAddress);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Invalid recipient address' });
    }
    
    const result = await sendUSDT(toAddress, amount);
    if (result.success) {
      res.json({ success: true, message: `Successfully sent ${amount} USDT to ${toAddress}`, transactionId: result.transactionId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create wallet (Admin only)
router.post('/create-wallet', protect, admin, async (req, res) => {
  try {
    const result = await createWallet();
    if (result.success) {
      res.json({ success: true, message: 'New Tron wallet created', data: { address: result.address, privateKey: result.privateKey } });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate address
router.post('/validate-address', protect, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ success: false, message: 'Address required' });
    const result = validateAddress(address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
