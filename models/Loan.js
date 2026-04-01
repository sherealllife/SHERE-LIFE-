import mongoose from 'mongoose';

const LoanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    amountRWF: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        enum: ['RWF', 'USDT'],
        default: 'RWF'
    },
    purpose: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid'],
        default: 'pending'
    },
    repaidAmount: {
        type: Number,
        default: 0
    },
    interestRate: {
        type: Number,
        default: 5
    }
}, { timestamps: true });

export default mongoose.model('Loan', LoanSchema);
