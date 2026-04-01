cat > models/Loan.js << 'EOF'
import mongoose from 'mongoose';

const LoanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  purpose: String,
  dueDate: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  repaidAmount: { type: Number, default: 0 },
  interestRate: { type: Number, default: 5 }
}, { timestamps: true });

export default mongoose.model('Loan', LoanSchema);
EOF
