import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  type: {
    type: String,
    enum: ['disbursement', 'payment', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  note: String,
  failureReason: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// We no longer need a reference generation hook as we'll use the MongoDB _id directly

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
