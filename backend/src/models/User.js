import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';



const userSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  plainPassword: {
    type: String,
    select: false // Not included in queries by default for security
  },
  personalInformation: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    nationalId: {
      type: String,
      required: [true, 'National ID number is required'],
      trim: true,
      validate: {
        validator: async function(v) {
          // Skip validation if this is not a new document and the value hasn't changed
          if (!this.isNew && this.personalInformation && this.personalInformation.nationalId === v) {
            return true;
          }

          // Basic format validation
          if (!/^[0-9]{13}$/.test(v)) {
            return false;
          }

          // Check uniqueness manually
          const existing = await mongoose.models.User.findOne({
            'personalInformation.nationalId': v,
            _id: { $ne: this._id } // Exclude current document in update cases
          });

          return !existing; // Return true if no other document has this nationalId
        },
        message: props => {
          if (!/^[0-9]{13}$/.test(props.value)) {
            return `${props.value} is not a valid Thai national ID number!`;
          }
          return `This National ID is already in use.`;
        }
      }
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: async function(v) {
        // Skip validation if this is not a new document and the value hasn't changed
        if (!this.isNew && this.phone === v) {
          return true;
        }

        // Basic format validation
        if (!/^[0-9]{10}$/.test(v)) {
          return false;
        }

        // Check uniqueness manually
        const existing = await mongoose.models.User.findOne({
          phone: v,
          _id: { $ne: this._id } // Exclude current document in update cases
        });

        return !existing; // Return true if no other document has this phone
      },
      message: props => {
        if (!/^[0-9]{10}$/.test(props.value)) {
          return `${props.value} is not a valid phone number!`;
        }
        return `This phone number is already in use.`;
      }
    }
  },
  password: {
    type: String,
    required: function() {
      // Only require password for new user creation, not for updates
      return this.isNew;
    },
    select: true // Always include password in queries
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  idCard: {
    number: String,
    type: String,
    issuedDate: Date,
    expiryDate: Date,
    image: String
  },
  // Required documents
  documents: {
    idCardFront: {
      url: {
        type: String,
        required: false
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    idCardBack: {
      url: {
        type: String,
        required: false
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    selfieWithId: {
      url: {
        type: String,
        required: false
      },
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  signatureUrl: String,
  address: {
    homeNumber: {
      type: String,
      required: false // Changed from required to optional
    },
    subdistrict: {
      type: String,
      required: false // Changed from required to optional
    },
    district: {
      type: String,
      required: false // Changed from required to optional
    },
    province: {
      type: String,
      required: false // Changed from required to optional
    },
    zipCode: {
      type: String,
      required: false, // Changed from required to optional
      validate: {
        validator: function(v) {
          // Only validate if a value is provided
          return !v || /^[0-9]{5}$/.test(v);
        },
        message: props => `${props.value} is not a valid zip code!`
      }
    }
  },
  bankAccount: {
    bankName: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    accountNumber: {
      type: String,
      required: function() {
        return this.isNew;
      },
      validate: {
        validator: function(v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: props => `${props.value} is not a valid account number!`
      }
    },
    accountName: {
      type: String,
      required: false
    }
  },
  financialInformation: {
    incomeMonthly: {
      type: Number,
      required: function() {
        return this.isNew;
      },
      min: [0, 'Monthly income cannot be negative']
    },
    employmentStatus: {
      type: String,
      required: function() {
        return this.isNew;
      },
      enum: {
        values: ['full-time', 'part-time', 'self-employed', 'unemployed'],
        message: '{VALUE} is not a valid employment status'
      }
    },
    loanPurpose: {
      type: String,
      required: function() {
        return this.isNew;
      }
    }
  },
  // Wallet fields directly on the user document
  availableBalance: {
    type: Number,
    default: 0
  },
  approvedLoanAmount: {
    type: Number,
    default: 0
  },
  pendingWithdrawals: {
    type: Number,
    default: 0
  },
  familyContact: {
    familyName: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    familyPhone: {
      type: String,
      required: function() {
        return this.isNew;
      },
      validate: {
        validator: function(v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    relationship: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    address: {
      homeNumber: String,
      subdistrict: String,
      district: String,
      province: String,
      zipCode: String
    }
  },
  // Wallet fields are now directly on the user document
}, {
  timestamps: true
});

// No longer hashing passwords - storing in plaintext
// But we still need the pre-save hook for other validations
userSchema.pre('save', async function(next) {
  // Skip password hashing - store as plaintext
  next();
});

// Compare password method - now using direct comparison since passwords are stored in plaintext
userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

// Method to update wallet balances
userSchema.methods.updateWalletBalances = async function(transactionType, amount, status) {
  // Update balances based on transaction type and status
  if (transactionType === 'disbursement' && status === 'completed') {
    this.availableBalance += amount;
    this.approvedLoanAmount += amount;
  } else if (transactionType === 'withdrawal') {
    if (status === 'pending') {
      this.pendingWithdrawals += amount;
      this.availableBalance -= amount;
    } else if (status === 'completed') {
      this.pendingWithdrawals -= amount;
    } else if (status === 'failed') {
      this.pendingWithdrawals -= amount;
      this.availableBalance += amount;
    }
  } else if (transactionType === 'payment' && status === 'completed') {
    // Handle loan payments
    this.approvedLoanAmount -= amount;
  }
  
  return await this.save();
};

const User = mongoose.model('User', userSchema);
export default User;
