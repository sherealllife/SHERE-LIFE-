import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';
import TronWeb from 'tronweb';

const TRONGRID_API = 'https://api.trongrid.io';
let tronWeb;

console.log('TRON_PRIVATE_KEY from env:', process.env.TRON_PRIVATE_KEY ? '✅ Yes' : '❌ No');

try {
    if (process.env.TRON_PRIVATE_KEY) {
        tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io',
            privateKey: process.env.TRON_PRIVATE_KEY
        });
        console.log('✅ TronWeb initialized with private key');
    } else {
        console.log('⚠️ No TRON_PRIVATE_KEY, send functions disabled');
        tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
    }
} catch (error) {
    console.error('❌ TronWeb init error:', error.message);
    tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io'
    });
}

// Get TRX balance
export const getTronBalance = async (address) => {
    try {
        const response = await fetch(`${TRONGRID_API}/v1/accounts/${address}`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const balance = data.data[0].balance || 0;
            return { success: true, balance: balance / 1e6, address };
        }
        return { success: true, balance: 0, address };
    } catch (error) {
        console.error('TronGrid error:', error);
        return { success: true, balance: 0, address };
    }
};

// Get USDT balance
export const getUSDTBalance = async (address) => {
    try {
        const usdtContract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const response = await fetch(`${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?contract_address=${usdtContract}&limit=1`);
        const data = await response.json();
        
        // For demo, return 0 (real balance requires token balance endpoint)
        return { success: true, balance: 0, address };
    } catch (error) {
        return { success: true, balance: 0, address };
    }
};

// Send TRX
export const sendTRX = async (toAddress, amountTRX) => {
    try {
        if (!tronWeb || !process.env.TRON_PRIVATE_KEY) {
            return { success: false, error: 'TRON_PRIVATE_KEY not configured' };
        }
        const amountSun = amountTRX * 1e6;
        const transaction = await tronWeb.trx.sendTransaction(toAddress, amountSun);
        return {
            success: true,
            transactionId: transaction.txid,
            amount: amountTRX,
            message: `✅ ${amountTRX} TRX sent to ${toAddress}`
        };
    } catch (error) {
        console.error('Send TRX error:', error);
        return { success: false, error: error.message };
    }
};

// Send USDT (TRC20)
export const sendUSDT = async (toAddress, amountUSDT) => {
    try {
        if (!tronWeb || !process.env.TRON_PRIVATE_KEY) {
            return { success: false, error: 'TRON_PRIVATE_KEY not configured' };
        }
        
        // Convert amount to smallest unit (USDT has 6 decimals)
        const amount = amountUSDT * 1e6;
        const usdtContract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        
        // Get contract instance
        const contract = await tronWeb.contract().at(usdtContract);
        
        // Transfer USDT
        const result = await contract.transfer(toAddress, amount).send();
        
        console.log(`✅ USDT sent: ${amountUSDT} to ${toAddress}, txid: ${result}`);
        
        return {
            success: true,
            transactionId: result,
            amount: amountUSDT,
            message: `✅ ${amountUSDT} USDT sent to ${toAddress}`
        };
    } catch (error) {
        console.error('Send USDT error:', error);
        return { success: false, error: error.message };
    }
};

// Validate Tron address
export const validateAddress = (address) => {
    const isValid = address && address.length === 34 && (address[0] === 'T' || address[0] === 't');
    return { success: true, isValid, address };
};

// Create new Tron wallet
export const createWallet = async () => {
    try {
        if (!tronWeb) {
            return { success: false, error: 'TronWeb not initialized' };
        }
        const account = await tronWeb.createAccount();
        return {
            success: true,
            address: account.address.base58,
            privateKey: account.privateKey
        };
    } catch (error) {
        console.error('Create wallet error:', error);
        return { success: false, error: error.message };
    }
};

// Create wallet for user (with userId)
export const createWalletForUser = async (userId) => {
    try {
        if (!tronWeb) {
            return { success: false, error: 'TronWeb not initialized' };
        }
        const account = await tronWeb.createAccount();
        return {
            success: true,
            address: account.address.base58,
            privateKey: account.privateKey,
            userId: userId
        };
    } catch (error) {
        console.error('Create wallet error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getTronBalance,
    sendTRX,
    getUSDTBalance,
    sendUSDT,
    validateAddress,
    createWallet,
    createWalletForUser
};

