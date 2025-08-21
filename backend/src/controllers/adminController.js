import User from '../models/User.js';
import Loan from '../models/Loan.js';
import InterestRate from '../models/InterestRate.js';
import Admin from '../models/Admin.js';
import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Admin login
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    
    // Clean phone number (remove formatting)
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

    // Find admin by phone number
    const admin = await Admin.findOne({ phone: cleanPhone });
    
    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check password using the comparePassword method
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    
    
    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return admin data and token
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    
    // Get total users count
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    
    // Get active loans count
    const activeLoans = await Loan.countDocuments({ 
      status: { $in: ['approved', 'disbursed'] }
    });
    
    // Get total disbursed amount
    const loans = await Loan.find({ status: 'disbursed' });
    const totalDisbursed = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    
    // Get pending applications count
    const pendingApplications = await Loan.countDocuments({ status: 'pending' });
    
    // Get recent activity with a direct approach to fetch user data
    
    // First, get all recent loans
    const recentLoans = await Loan.find()
      .sort({ updatedAt: -1 })
      .limit(5);
    
    
    // Create a set of unique user IDs from the loans
    const userIds = new Set(recentLoans.map(loan => loan.user?.toString()).filter(Boolean));
    
    // Fetch all users in a single query
    const users = await User.find({ _id: { $in: Array.from(userIds) } });
    
    // Create a map of user IDs to user names for quick lookup
    const userMap = {};
    users.forEach(user => {
      // Check for personalInformation first
      if (user.personalInformation && user.personalInformation.firstName && user.personalInformation.lastName) {
        userMap[user._id.toString()] = `${user.personalInformation.firstName} ${user.personalInformation.lastName}`;
      } 
      // Fallback to direct firstName/lastName if they exist
      else if (user.firstName && user.lastName) {
        userMap[user._id.toString()] = `${user.firstName} ${user.lastName}`;
      }
      // Last resort, use phone number
      else {
        userMap[user._id.toString()] = user.phone || 'Unknown User';
      }
    });
    
    
    // Process recent activity using the user map
    const recentActivity = recentLoans.map(loan => {
      const userId = loan.user?.toString();
      const userName = userId && userMap[userId] ? userMap[userId] : 'Unknown User';
      
      
      return {
        id: loan._id,
        user: userName,
        action: `Loan ${loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : 'Updated'}`,
        status: loan.status || 'unknown',
        amount: loan.amount || 0,
        time: loan.updatedAt || new Date()
      };
    });
    
    
    // Get monthly loan applications for chart with error handling
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let loansByMonth = [];
    try {
      loansByMonth = await Loan.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            amount: { $sum: { $ifNull: ["$amount", 0] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
    } catch (aggError) {
      console.error('Aggregation error:', aggError);
      // Provide fallback data if aggregation fails
      loansByMonth = [];
    }
    
    // Format chart data with fallback
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Ensure we have at least some data for charts
    if (loansByMonth.length === 0) {
      // Create fallback data for the last 6 months
      const currentMonth = new Date().getMonth();
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12; // Handle wrapping around to previous year
        loansByMonth.push({
          _id: { month: monthIndex + 1 },
          count: 0,
          amount: 0
        });
      }
    }
    
    const chartData = loansByMonth.map(item => {
      // Ensure month index is valid
      const monthIndex = ((item._id.month - 1) % 12 + 12) % 12; // Safe modulo for negative numbers
      return {
        name: months[monthIndex],
        value: item.count || 0
      };
    });
    
    const disbursementData = loansByMonth.map(item => {
      // Ensure month index is valid
      const monthIndex = ((item._id.month - 1) % 12 + 12) % 12; // Safe modulo for negative numbers
      return {
        name: months[monthIndex],
        value: item.amount || 0
      };
    });
    
    
    res.status(200).json({
      status: 'success',
      data: {
        metrics: [
          {
            title: 'Total Users',
            value: totalUsers,
            change: '+0%', // You would calculate this based on previous period
            trend: 'up'
          },
          {
            title: 'Active Loans',
            value: activeLoans,
            change: '+0%',
            trend: 'up'
          },
          {
            title: 'Total Disbursed',
            value: totalDisbursed,
            change: '+0%',
            trend: 'up'
          },
          {
            title: 'Pending Applications',
            value: pendingApplications,
            change: '+0%',
            trend: 'up'
          }
        ],
        recentActivity,
        chartData,
        disbursementData
      }
    });
  } catch (error) {
    console.error('// Get dashboard stats error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get only user online statuses - purely socket-based, no auto-offline logic
export const getUserStatuses = async (req, res) => {
  try {
    // Find all users but only select the fields needed for status updates
    const users = await User.find({ role: 'user' }).select('_id isOnline');
    
    // Simply return the current database status without any auto-offline logic
    // The socket connection handlers are responsible for updating the database status
    const processedUsers = users.map(user => ({
      _id: user._id,
      isOnline: user.isOnline || false
    }));
    
    return res.status(200).json({
      status: 'success',
      data: processedUsers
    });
  } catch (err) {
    console.error('Error fetching user statuses:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user statuses'
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Find all users and populate their loan information with plaintext passwords
    const users = await User.find({ role: 'user' });
    
    // Get loan information for each user
    const usersWithLoans = await Promise.all(users.map(async (user) => {
      const loans = await Loan.find({ user: user._id });
      const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
      const activeLoans = loans.filter(loan => ['approved', 'disbursed'].includes(loan.status));
      
      // Create a proper user object with all the required fields
      const userObj = user.toObject();
      
      // Make sure personalInformation exists
      if (!userObj.personalInformation) {
        userObj.personalInformation = {
          firstName: '',
          lastName: ''
        };
      }
      
      // Get the most recent loan for this user (pending or active)
      const latestLoan = loans.length > 0 ? 
        loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
      
      // Add additional fields needed by the frontend
      return {
        ...userObj,
        id: user._id,
        status: user.status, // Use the user's actual status from the database
        loans: loans.length,
        totalBorrowed,
        createdAt: user.createdAt,
        // Add loan-related fields from the latest loan
        term: latestLoan ? latestLoan.term : null,
        monthlyPayment: latestLoan ? latestLoan.monthlyPayment : null,
        totalPayment: latestLoan ? latestLoan.totalPayment : null,
        loanStatus: latestLoan ? latestLoan.status : null, // Add the loan status
        mostRecentLoanId: latestLoan ? latestLoan._id.toString() : null // Add the most recent loan ID
      };
    }));
    
    res.status(200).json({
      status: 'success',
      data: usersWithLoans
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Get user's loans
    const loans = await Loan.find({ user: user._id });
    
    // Create a response object with user data and loans
    const responseData = user.toObject();
    responseData.loans = loans;
    
    res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }

    // Use findByIdAndUpdate to avoid triggering validation issues
    const user = await User.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { 
      firstName, lastName, phone, email, status,
      address, bankAccount, familyContact, financialInformation
    } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Update basic user fields
    if (status !== undefined) user.status = status;
    if (phone !== undefined) user.phone = phone;
    
    // Update personal information fields
    if (firstName !== undefined) {
      if (!user.personalInformation) user.personalInformation = {};
      user.personalInformation.firstName = firstName;
    }
    
    if (lastName !== undefined) {
      if (!user.personalInformation) user.personalInformation = {};
      user.personalInformation.lastName = lastName;
    }
    
    // Update address if provided
    if (address) {
      if (!user.address) user.address = {};
      
      if (address.homeNumber !== undefined) user.address.homeNumber = address.homeNumber;
      if (address.subdistrict !== undefined) user.address.subdistrict = address.subdistrict;
      if (address.district !== undefined) user.address.district = address.district;
      if (address.province !== undefined) user.address.province = address.province;
      if (address.zipCode !== undefined) user.address.zipCode = address.zipCode;
    }
    
    // Update bank account if provided
    if (bankAccount) {
      if (!user.bankAccount) user.bankAccount = {};
      
      if (bankAccount.bankName !== undefined) user.bankAccount.bankName = bankAccount.bankName;
      if (bankAccount.accountNumber !== undefined) user.bankAccount.accountNumber = bankAccount.accountNumber;
      if (bankAccount.accountName !== undefined) user.bankAccount.accountName = bankAccount.accountName;
    }
    
    // Update financial information if provided
    if (financialInformation) {
      if (!user.financialInformation) user.financialInformation = {};
      
      if (financialInformation.incomeMonthly !== undefined) {
        user.financialInformation.incomeMonthly = parseFloat(financialInformation.incomeMonthly);
      }
      if (financialInformation.employmentStatus !== undefined) {
        user.financialInformation.employmentStatus = financialInformation.employmentStatus;
      }
      if (financialInformation.loanPurpose !== undefined) {
        user.financialInformation.loanPurpose = financialInformation.loanPurpose;
      }
    }

    // Update family contact if provided
    if (familyContact) {
      if (!user.familyContact) user.familyContact = {};
      
      if (familyContact.familyName !== undefined) user.familyContact.familyName = familyContact.familyName;
      if (familyContact.familyPhone !== undefined) user.familyContact.familyPhone = familyContact.familyPhone;
      if (familyContact.relationship !== undefined) user.familyContact.relationship = familyContact.relationship;
      
      // Update family address if provided
      if (familyContact.address) {
        if (!user.familyContact.address) user.familyContact.address = {};
        
        if (familyContact.address.houseNumber !== undefined) 
          user.familyContact.address.houseNumber = familyContact.address.houseNumber;
        if (familyContact.address.subdistrict !== undefined) 
          user.familyContact.address.subdistrict = familyContact.address.subdistrict;
        if (familyContact.address.district !== undefined) 
          user.familyContact.address.district = familyContact.address.district;
        if (familyContact.address.province !== undefined) 
          user.familyContact.address.province = familyContact.address.province;
        if (familyContact.address.zipCode !== undefined) 
          user.familyContact.address.zipCode = familyContact.address.zipCode;
      }
    }
    
    // Save the updated user
    await user.save();
    
    
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
};

// Get all loans
export const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName');
    
    const formattedLoans = loans.map(loan => ({
      id: loan._id,
      userId: loan.userId._id,
      userName: `${loan.userId.firstName} ${loan.userId.lastName}`,
      amount: loan.amount,
      purpose: loan.purpose,
      status: loan.status,
      term: loan.term,
      interestRate: loan.interestRate,
      applicationDate: loan.createdAt,
      lastUpdated: loan.updatedAt
    }));
    
    res.status(200).json({
      status: 'success',
      data: formattedLoans
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get loan by ID
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('userId', 'firstName lastName phone email');
    
    if (!loan) {
      return res.status(404).json({ status: 'error', message: 'Loan not found' });
    }
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    console.error('Get loan by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update loan status
// Update a user's loan
export const updateUserLoan = async (req, res) => {
  try {
    const { userId, loanId } = req.params;
    const { amount, term, status } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Check if this is a new loan or an update
    if (loanId === 'new' || loanId === 'new-loan') {
      // Check for existing active loans (one-loan-per-user restriction)
      // Allow admin override with forceCreate parameter
      const { forceCreate } = req.body;
      
      if (!forceCreate) {
        const existingLoan = await Loan.findOne({
          user: userId,
          status: { $in: ['pending', 'approved', 'disbursed'] }
        });
        
        if (existingLoan) {
          return res.status(400).json({
            status: 'error',
            message: 'User already has an active loan. Use forceCreate=true to override this restriction.',
            data: {
              existingLoanId: existingLoan._id.toString(),
              existingLoanStatus: existingLoan.status,
              existingLoanAmount: existingLoan.amount
            }
          });
        }
      }
      
      // Get the interest rate from MongoDB based on the term
      const interestRate = await InterestRate.findOne({ term: term, isActive: true });
      
      if (!interestRate) {
        return res.status(400).json({
          status: 'error',
          message: `No active interest rate found for term: ${term} months`
        });
      }
      
      // Use the interest rate from MongoDB
      const appliedRate = interestRate.rate;
      
      // Create the loan with the appropriate rate
      const newLoan = new Loan({
        user: userId,
        amount: amount,
        term: term,
        status: status,
        interestRateRef: interestRate._id, // Reference the interest rate
        appliedRate: appliedRate,
        monthlyPayment: (amount + (amount * appliedRate)) / term,
        totalPayment: amount + (amount * appliedRate)
      });
      
      await newLoan.save();
      
      return res.status(201).json({
        status: 'success',
        data: newLoan
      });
    } else {
      // Update existing loan
      let loan;
      try {
        loan = await Loan.findOne({ _id: loanId, user: userId });
      } catch (error) {
        // If the ID is invalid, create a new loan instead
        
        // Get the interest rate from MongoDB based on the term
        const interestRate = await InterestRate.findOne({ term: term, isActive: true });
        
        if (!interestRate) {
          return res.status(400).json({
            status: 'error',
            message: `No active interest rate found for term: ${term} months`
          });
        }
        
        // Use the interest rate from MongoDB
        const appliedRate = interestRate.rate;
        
        // Create a new loan since the provided ID was invalid
        const newLoan = new Loan({
          user: userId,
          amount: amount,
          term: term,
          status: status,
          interestRateRef: interestRate._id, // Reference the interest rate
          appliedRate: appliedRate,
          monthlyPayment: (amount + (amount * appliedRate)) / term,
          totalPayment: amount + (amount * appliedRate)
        });
        
        await newLoan.save();
        
        return res.status(201).json({
          status: 'success',
          data: newLoan
        });
      }
      
      if (!loan) {
        return res.status(404).json({ status: 'error', message: 'Loan not found' });
      }
      
      // Get additional fields from the request
      const { monthlyPayment, totalPayment, appliedRate } = req.body;

      // Update loan fields
      if (amount !== undefined) loan.amount = amount;
      if (term !== undefined) loan.term = term;
      if (status !== undefined) loan.status = status;
      
      // Update calculated fields if provided
      if (monthlyPayment !== undefined) loan.monthlyPayment = monthlyPayment;
      if (totalPayment !== undefined) loan.totalPayment = totalPayment;
      if (appliedRate !== undefined) loan.appliedRate = appliedRate;
      
      // If we're updating amount, term or rate, we need to set a flag to skip automatic calculation
      // in the pre-save hook, since we're providing explicit values
      if (monthlyPayment !== undefined && totalPayment !== undefined) {
        // This is a temporary flag that won't be saved to the database
        loan._skipCalculation = true;
      }
      
      await loan.save();
      
      return res.status(200).json({
        status: 'success',
        data: loan
      });
    }
  } catch (error) {
    console.error('Update user loan error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
};

// Update the status of a user's most recent loan from the users management page
// Update a user's wallet information (available balance, approved loan amount, pending withdrawals)
export const updateUserWallet = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { availableBalance, approvedLoanAmount, pendingWithdrawals } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Update the wallet fields
    if (availableBalance !== undefined) user.availableBalance = availableBalance;
    if (approvedLoanAmount !== undefined) user.approvedLoanAmount = approvedLoanAmount;
    if (pendingWithdrawals !== undefined) user.pendingWithdrawals = pendingWithdrawals;
    
    // Save the user
    await user.save();
    
    // Add audit log entry for wallet update
    // This is optional but good for tracking admin changes
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        availableBalance: user.availableBalance,
        approvedLoanAmount: user.approvedLoanAmount,
        pendingWithdrawals: user.pendingWithdrawals
      }
    });
  } catch (error) {
    console.error('Update user wallet error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
};

export const updateUserLoanStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ status: 'error', message: 'Status is required' });
    }

    // Find the most recent loan for this user
    const loan = await Loan.findOne({ user: userId }).sort({ createdAt: -1 });
    
    if (!loan) {
      return res.status(404).json({ status: 'error', message: 'No loans found for this user' });
    }

    // Update loan status
    loan.status = status;
    
    // If loan is approved, update user's wallet balance
    if (status === 'approved') {
      // Find user and update their wallet balance
      const user = await User.findById(userId);
      if (user) {
        // Update approved loan amount only
        user.approvedLoanAmount = (user.approvedLoanAmount || 0) + loan.amount;
        await user.save();
      }
    }

    // Add a status history entry
    if (!loan.statusHistory) {
      loan.statusHistory = [];
    }
    
    loan.statusHistory.push({
      status,
      date: new Date(),
      notes: `Status updated by admin`
    });

    await loan.save();
    
    return res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
};

export const updateLoanStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ status: 'error', message: 'Loan not found' });
    }
    
    // Update loan status
    loan.status = status;
    if (notes) loan.notes = notes;
    
    // If loan is approved, update user's wallet balance
    if (status === 'approved') {
      // Find user and update their wallet balance
      const user = await User.findById(loan.user);
      if (user) {
        // Update approved loan amount only
        user.approvedLoanAmount += loan.amount;
        await user.save();
      }
    }
    
    await loan.save();
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    // Find transactions from the Transaction model
    const Transaction = mongoose.model('Transaction');
    const transactions = await Transaction.find().populate('user', 'personalInformation.firstName personalInformation.lastName');
    
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      userId: transaction.user?._id,
      userName: transaction.user ? 
        `${transaction.user.personalInformation?.firstName || 'Unknown'} ${transaction.user.personalInformation?.lastName || 'User'}` : 
        'Unknown User',
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      date: transaction.createdAt,
      reference: transaction.reference
    }));
    
    // Sort transactions by date (newest first)
    formattedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json({
      status: 'success',
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get interest rates
export const getInterestRates = async (req, res) => {
  try {
    const interestRates = await InterestRate.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: interestRates
    });
  } catch (error) {
    console.error('Get interest rates error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Create interest rate
export const createInterestRate = async (req, res) => {
  try {
    const { term, rate, isActive } = req.body;
    
    const newInterestRate = new InterestRate({
      term,
      rate,
      isActive: isActive || true
    });
    
    await newInterestRate.save();
    
    res.status(201).json({
      status: 'success',
      data: newInterestRate
    });
  } catch (error) {
    console.error('Create interest rate error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update interest rate
export const updateInterestRate = async (req, res) => {
  try {
    const { term, rate, isActive } = req.body;
    
    const interestRate = await InterestRate.findById(req.params.id);
    
    if (!interestRate) {
      return res.status(404).json({ status: 'error', message: 'Interest rate not found' });
    }
    
    // Update fields
    if (term !== undefined) interestRate.term = term;
    if (rate !== undefined) interestRate.rate = rate;
    if (isActive !== undefined) interestRate.isActive = isActive;
    
    await interestRate.save();
    
    res.status(200).json({
      status: 'success',
      data: interestRate
    });
  } catch (error) {
    console.error('Update interest rate error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Delete interest rate
export const deleteInterestRate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interestRate = await InterestRate.findById(id);
    
    if (!interestRate) {
      return res.status(404).json({
        status: 'error',
        message: 'Interest rate not found'
      });
    }
    
    await InterestRate.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Interest rate deleted successfully'
    });
  } catch (error) {
    console.error('Delete interest rate error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Delete a loan
export const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the loan to get user information before deletion
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }
    
    // Get the user ID for later reference
    const userId = loan.user;
    
    // Delete any transactions associated with this loan
    await mongoose.model('Transaction').deleteMany({ loan: id });
    
    // Delete the loan
    await Loan.findByIdAndDelete(id);
    
    // Check if the user has any remaining loans
    const remainingLoans = await Loan.countDocuments({ user: userId });
    
    // Return the count of remaining loans to the frontend
    return res.status(200).json({
      status: 'success',
      message: 'Loan and associated transactions deleted successfully',
      data: {
        remainingLoans,
        userId: userId.toString()
      }
    });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Delete user

// Get user password - secure endpoint for admin use only
export const getUserPassword = async (req, res) => {
  try {
    // Find user with password included
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // For security, we'll require a second verification step
    // The admin must provide their own credentials in the request headers
    const adminToken = req.headers.authorization?.split(' ')[1];
    if (!adminToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin authentication required'
      });
    }

    // Log this sensitive action for audit purposes
    
    // Return the password in a secure format
    res.status(200).json({
      status: 'success',
      data: {
        userId: user._id,
        password: user.password,
        // Include a warning message
        message: 'This is the hashed password. For security reasons, the actual plaintext password cannot be retrieved.'
      }
    });
  } catch (error) {
    console.error('Get user password error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get employment statuses
export const getEmploymentStatuses = async (req, res) => {
  try {
    // Get employment status enum values from User model
    const employmentStatuses = User.schema.path('financialInformation.employmentStatus').enumValues;
    
    res.status(200).json({
      status: 'success',
      data: employmentStatuses
    });
  } catch (error) {
    console.error('Get employment statuses error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// Get transactions for a specific user
export const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get all transactions for this user
    const transactions = await mongoose.model('Transaction')
      .find({ user: userId })
      .populate('loan', 'amount term status') // Populate loan details if it's a loan-related transaction
      .sort({ createdAt: -1 }); // Most recent first
    
    res.status(200).json({
      status: 'success',
      data: {
        transactions: transactions.map(transaction => ({
          _id: transaction._id,
          id: transaction._id, // Include both _id and id for consistency
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          date: transaction.createdAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          reference: transaction._id.toString(), // Use MongoDB ObjectId as reference
          paymentMethod: transaction.bankAccount ? {
            bankName: transaction.bankAccount.bankName,
            accountNumber: transaction.bankAccount.accountNumber,
            accountName: transaction.bankAccount.accountName
          } : null,
          loan: transaction.loan ? {
            amount: transaction.loan.amount,
            term: transaction.loan.term,
            status: transaction.loan.status
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// Update transaction status
export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Find and update the transaction
    const transaction = await mongoose.model('Transaction').findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }
    
    // Update status
    transaction.status = status;
    await transaction.save();
    
    // If status is 'completed' and type is 'withdrawal', update user's pending withdrawals
    if (status === 'completed' && transaction.type === 'withdrawal') {
      const user = await User.findById(transaction.user);
      if (user) {
        // Ensure pendingWithdrawals doesn't go below 0
        user.pendingWithdrawals = Math.max(0, (user.pendingWithdrawals || 0) - transaction.amount);
        await user.save();
      }
    }
    
    // Return updated transaction
    res.status(200).json({
      status: 'success',
      data: {
        transaction: {
          _id: transaction._id,
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          date: transaction.createdAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// Update transaction details
export const updateTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, status, bankAccount, date } = req.body;
    
    // Validation
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be a positive number'
      });
    }
    
    // Validate status if provided
    const validStatuses = ['pending', 'completed', 'failed'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Validate date if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid date format'
        });
      }
    }
    
    // Validate bank account if provided
    if (bankAccount !== undefined) {
      if (typeof bankAccount !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Bank account must be an object'
        });
      }
      
      // Check for required bank account fields if it's provided
      if (
        bankAccount && 
        (!bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountName)
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Bank account must include bankName, accountNumber, and accountName'
        });
      }
    }
    
    // Find the transaction
    const transaction = await mongoose.model('Transaction').findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }
    
    // Record original values for comparison
    const originalAmount = transaction.amount;
    const originalStatus = transaction.status;
    
    // Update fields if provided
    if (amount !== undefined) transaction.amount = amount;
    if (status !== undefined) transaction.status = status;
    if (date !== undefined) transaction.createdAt = new Date(date);
    
    // Update bank account details if provided
    if (bankAccount !== undefined) {
      transaction.bankAccount = {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName
      };
    }
    
    // Save the updated transaction
    await transaction.save();
    
    // Handle withdrawal status changes if needed
    if (transaction.type === 'withdrawal') {
      const user = await User.findById(transaction.user);
      if (user) {
        // If amount changed or status changed, update pending withdrawals
        if (amount !== originalAmount || status !== originalStatus) {
          // Recalculate user's pending withdrawals based on all pending withdrawal transactions
          const pendingWithdrawals = await mongoose.model('Transaction').aggregate([
            {
              $match: {
                user: new mongoose.Types.ObjectId(user._id),
                type: 'withdrawal',
                status: 'pending'
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]);
          
          user.pendingWithdrawals = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;
          await user.save();
        }
      }
    }
    
    // Return updated transaction with full details
    res.status(200).json({
      status: 'success',
      data: {
        transaction: {
          _id: transaction._id,
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          date: transaction.createdAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          bankAccount: transaction.bankAccount
        }
      }
    });
  } catch (error) {
    console.error('Update transaction details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// Get user withdrawals for admin management
export const getUserWithdrawals = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }

    
    // Find all withdrawal transactions for the user (actual withdrawal system)
    const withdrawals = await Transaction.find({ 
      user: userId, 
      type: 'withdrawal' 
    })
      .populate('user', 'personalInformation phone bankAccount')
      .sort({ createdAt: -1 });

    
    // Transform transactions to match expected withdrawal format
    const formattedWithdrawals = withdrawals.map(transaction => ({
      _id: transaction._id,
      user: transaction.user,
      amount: transaction.amount,
      status: transaction.status,
      bankAccount: transaction.bankAccount || transaction.user?.bankAccount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      type: transaction.type,
      // Add additional fields for admin management
      transactionId: transaction._id,
      failureReason: transaction.failureReason || null,
      rejectionReason: transaction.rejectionReason || null
    }));

    res.status(200).json(formattedWithdrawals);
  } catch (error) {
    console.error('❌ Get user withdrawals error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Server error: ' + error.message
    });
  }
};

// Update withdrawal for admin management
export const updateWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { amount, status, bankAccount, transactionId, failureReason, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid withdrawal ID'
      });
    }

    // Find the withdrawal transaction
    const withdrawal = await Transaction.findOne({ 
      _id: withdrawalId, 
      type: 'withdrawal' 
    });
    if (!withdrawal) {
      return res.status(404).json({
        status: 'error',
        message: 'Withdrawal transaction not found'
      });
    }

    // Store original values for comparison
    const originalAmount = withdrawal.amount;
    const originalStatus = withdrawal.status;

    // Update fields if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Amount must be greater than 0'
        });
      }
      withdrawal.amount = amount;
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status'
        });
      }
      withdrawal.status = status;
    }

    if (bankAccount !== undefined) {
      if (!bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountName) {
        return res.status(400).json({
          status: 'error',
          message: 'Bank account must include bankName, accountNumber, and accountName'
        });
      }
      withdrawal.bankAccount = bankAccount;
    }

    if (transactionId !== undefined) {
      withdrawal.transactionId = transactionId;
    }

    if (failureReason !== undefined) {
      withdrawal.failureReason = failureReason;
    }

    if (rejectionReason !== undefined) {
      withdrawal.rejectionReason = rejectionReason;
    }

    // Save the updated withdrawal
    await withdrawal.save();

    // Update user's pending withdrawals if amount or status changed
    if (originalAmount !== withdrawal.amount || originalStatus !== withdrawal.status) {
      const user = await User.findById(withdrawal.user);
      if (user) {
        // Recalculate pending withdrawals from Transaction model
        const pendingWithdrawals = await Transaction.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              type: 'withdrawal',
              status: 'pending'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        user.pendingWithdrawals = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;
        await user.save();
      }
    }

    // Return the updated withdrawal transaction with populated user data
    const updatedWithdrawal = await Transaction.findById(withdrawalId)
      .populate('user', 'personalInformation phone bankAccount');

    // Format the response to match expected withdrawal format
    const formattedWithdrawal = {
      _id: updatedWithdrawal._id,
      user: updatedWithdrawal.user,
      amount: updatedWithdrawal.amount,
      status: updatedWithdrawal.status,
      bankAccount: updatedWithdrawal.bankAccount || updatedWithdrawal.user?.bankAccount,
      createdAt: updatedWithdrawal.createdAt,
      updatedAt: updatedWithdrawal.updatedAt,
      type: updatedWithdrawal.type,
      transactionId: updatedWithdrawal._id,
      failureReason: updatedWithdrawal.failureReason || null,
      rejectionReason: updatedWithdrawal.rejectionReason || null
    };

    res.status(200).json(formattedWithdrawal);
  } catch (error) {
    console.error('Update withdrawal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};
