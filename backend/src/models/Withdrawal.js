import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending'
  },
  bankAccount: {
    bankName: {
      type: String,
      required: [true, 'Bank name is required']
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      validate: {
        validator: function(v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: props => `${props.value} is not a valid account number!`
      }
    },
    accountName: {
      type: String,
      required: [true, 'Account holder name is required']
    }
  },
  transactionId: String,
  failureReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  completedAt: Date,
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'failed']
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Pre-save hook to track status history
withdrawalSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: this.isNew ? 'Withdrawal request created' : 'Status updated'
    });

    // Set approval or completion dates
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
    } else if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  
  next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
