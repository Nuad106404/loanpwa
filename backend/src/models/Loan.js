import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // User must be authenticated to apply for a loan
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
    max: 1000000
  },
  term: {
    type: Number,
    required: true
    // Removed enum restriction to allow any term value
  },
  status: {
    type: String,
    enum: ['รอการอนุมัติ', 'อนุมัติแล้ว', 'ปฏิเสธ', 'จ่ายเงินแล้ว', 'เสร็จสิ้น', 'ผิดนัด'],
    default: 'รอการอนุมัติ'
  },
  interestRate: {
    type: Number,
    required: true
  },
  interestRateRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterestRate',
    required: false // Make it optional since we're using fixed rates
  },
  // We'll store the actual rate value at the time of loan creation for historical reference
  appliedRate: {
    type: Number,
    required: true
  },
  totalPayment: {
    type: Number
  },
  disbursementDate: Date,
  nextPaymentDate: Date,

  statusHistory: [{
    status: {
      type: String,
      enum: ['รอการอนุมัติ', 'อนุมัติแล้ว', 'ปฏิเสธ', 'จ่ายเงินแล้ว', 'เสร็จสิ้น', 'ผิดนัด']
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

// Pre-save hook to calculate loan details and track status history
loanSchema.pre('save', function(next) {
  // Skip automatic calculation if the _skipCalculation flag is set
  // This flag is set by the admin controller when explicit values are provided
  if (this._skipCalculation) {
    // Skip calculation but continue with the save
    // Ensure the flag isn't persisted in the database
    delete this._skipCalculation;
  } 
  // Calculate loan details if amount, term, or applied rate has changed
  else if (this.isModified('amount') || this.isModified('term') || this.isModified('appliedRate') || this.isNew) {
    // Calculate based on loan parameters
    // appliedRate is stored as a decimal (e.g., 0.0290 for 2.9%)
    // We're using simple interest calculation: principal * rate = total interest
    // Ensure we have valid numeric values for calculations
    const amount = Number(this.amount) || 0;
    const rate = Number(this.appliedRate) || 0;
    const term = Number(this.term) || 1; // Prevent division by zero
    
    const totalInterest = amount * rate * term; // Interest over the entire term
    this.totalPayment = amount + totalInterest;
    
    // We no longer store monthlyPayment in the model
    // But we calculate it for reference in other places
    const calculatedMonthlyPayment = this.totalPayment / term;
    
    // Ensure we never have NaN values
    if (isNaN(this.totalPayment)) this.totalPayment = amount;
  }
  
  // Add status history entry if status has changed or it's a new loan
  if (this.isNew || this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: this.isNew ? 'Loan created' : 'Status updated'
    });
  }
  
  next();
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
