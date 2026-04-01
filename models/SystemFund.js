import mongoose from 'mongoose';

const SystemFundSchema = new mongoose.Schema({
  totalSupply: { type: Number, default: 700000000 },
  circulatingSupply: { type: Number, default: 0 },
  reservedForLoans: { type: Number, default: 500000000 },
  communityFund: { type: Number, default: 100000000 },
  operationalFund: { type: Number, default: 100000000 },
  transactions: [{
    type: { type: String, enum: ['mint', 'burn', 'transfer', 'loan'] },
    amount: Number,
    to: String,
    from: String,
    description: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('SystemFund', SystemFundSchema);
