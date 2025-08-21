import mongoose from 'mongoose';

const interestRateSchema = new mongoose.Schema({
  term: {
    type: Number,
    required: true,
    unique: true // Each term should have only one rate
  },
  rate: {
    type: Number,
    required: true,
    min: 0 // Allow zero interest rate, no maximum limit
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field on save
interestRateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const InterestRate = mongoose.model('InterestRate', interestRateSchema);
export default InterestRate;
