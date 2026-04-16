import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'RWF'
    },
    tronAddress: {
        type: String,
        default: null
        // NTA unique: true cyangwa sparse: true
    },
    tronPrivateKey: {
        type: String,
        default: null,
        select: false
    },
    trumpBalance: {
        type: Number,
        default: 0
    },
    usdtBalance: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Wallet', WalletSchema);
