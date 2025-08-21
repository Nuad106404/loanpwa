import User from '../models/User.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// Get wallet for the current user
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user with wallet fields
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Find user's loans
    let loans = [];
    try {
      
      // Try both user and userId fields to find loans
      const loansByUser = await Loan.find({ user: userId });
      const loansByUserId = await Loan.find({ userId: userId });
      
      
      // Use whichever query returned results
      loans = loansByUser.length > 0 ? loansByUser : loansByUserId;
      
      if (loans.length > 0) {
      } else {
      }
    } catch (err) {
    }
    
    // Initialize wallet fields if they don't exist
    if (user.availableBalance === undefined) {
      // Calculate approved loan amount from loan data
      const approvedLoanAmount = loans
        .filter(loan => loan.status === 'approved')
        .reduce((total, loan) => total + loan.amount, 0);
      
      
      // Set wallet fields
      user.availableBalance = approvedLoanAmount;
      user.approvedLoanAmount = approvedLoanAmount;
      user.pendingWithdrawals = 0;
      
      await user.save();
      
      // Create transactions for approved loans
      for (const loan of loans.filter(loan => loan.status === 'approved')) {
        const newTransaction = new Transaction({
          user: userId,
          type: 'disbursement',
          status: 'completed',
          amount: loan.amount,
          reference: `LOAN-${loan._id}`,
          note: 'Loan disbursement',
          bankAccount: user.bankAccount
        });
        
        await newTransaction.save();
      }
    }
    
    // Find recent transactions
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get all loans with relevant statuses for display
    const relevantLoans = loans.filter(loan => 
      ['pending', 'approved', 'disbursed', 'completed'].includes(loan.status)
    );
    
    // Format loan data for the response
    const formattedLoans = relevantLoans.map(loan => ({
      id: loan._id,
      amount: loan.amount,
      term: loan.term,
      interestRate: loan.appliedRate || 0, // Include interest rate
      monthlyPayment: loan.monthlyPayment || (loan.amount / loan.term), // Calculate if not present
      totalInterest: (loan.amount * (loan.appliedRate || 0)) || 0, // Calculate total interest
      totalRepayment: loan.totalPayment || loan.amount, // Total repayment or principal if missing
      status: loan.status,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      approvedAt: loan.approvedAt || loan.statusHistory?.find(h => h.status === 'approved')?.date,
      disbursedAt: loan.disbursedAt || loan.statusHistory?.find(h => h.status === 'disbursed')?.date,
      completedAt: loan.completedAt || loan.statusHistory?.find(h => h.status === 'completed')?.date,
      nextPaymentDue: loan.nextPaymentDate
    }));
    
    // Format transactions for the response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      date: transaction.createdAt,
      reference: transaction.reference
    }));
    
    return res.status(200).json({
      status: 'success',
      data: {
        availableBalance: user.availableBalance || 0,
        approvedLoanAmount: user.approvedLoanAmount || 0,
        pendingWithdrawals: user.pendingWithdrawals || 0,
        loans: formattedLoans,
        recentTransactions: formattedTransactions,
        bankDetails: user.bankAccount
      }
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถดึงข้อมูลกระเป๋าเงินได้' });
  }
};

// Create a withdrawal request
export const createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุจำนวนเงินที่ถอนที่ถูกต้อง'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Check if user has sufficient balance
    if (!user.availableBalance || user.availableBalance < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'ยอดเงินไม่เพียงพอสำหรับการถอน'
      });
    }
    
    // Create transaction
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      status: 'pending',
      amount: amount,
      bankAccount: user.bankAccount
    });
    
    await transaction.save();
    
    // Update user's wallet balances
    user.availableBalance -= amount;
    user.pendingWithdrawals += amount;
    await user.save();
    
    return res.status(201).json({
      status: 'success',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          // Using _id as reference
          _id: transaction._id,
          date: transaction.createdAt
        },
        availableBalance: user.availableBalance,
        pendingWithdrawals: user.pendingWithdrawals
      }
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถสร้างคำขอถอนเงินได้' });
  }
};

// Process a loan disbursement
export const processLoanDisbursement = async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Find loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินเชื่อ' });
    }
    
    // Find user
    const user = await User.findById(loan.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Create transaction
    const transaction = new Transaction({
      user: loan.user,
      loan: loanId,
      type: 'disbursement',
      status: 'completed',
      amount: loan.amount,
      reference: `DSB-${loanId}`,
      note: 'Loan disbursement',
      bankAccount: user.bankAccount
    });
    
    await transaction.save();
    
    // Update user's wallet balances
    user.availableBalance = (user.availableBalance || 0) + loan.amount;
    user.approvedLoanAmount = (user.approvedLoanAmount || 0) + loan.amount;
    await user.save();
    
    // Update loan status
    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    await loan.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          // Using _id as reference
          _id: transaction._id,
          date: transaction.createdAt
        },
        availableBalance: user.availableBalance,
        approvedLoanAmount: user.approvedLoanAmount
      }
    });
  } catch (error) {
    console.error('Error processing loan disbursement:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถดำเนินการเบิกจ่ายสินเชื่อได้' });
  }
};

// Update transaction status
export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, failureReason } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุสถานะที่ถูกต้อง (รอดำเนินการ, เสร็จสิ้น, ล้มเหลว)'
      });
    }
    
    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }
    
    // Find user
    const user = await User.findById(transaction.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    const oldStatus = transaction.status;
    transaction.status = status;
    
    if (failureReason) {
      transaction.note = failureReason;
    }
    
    await transaction.save();
    
    // Update user's wallet balances based on transaction type and status change
    if (transaction.type === 'withdrawal') {
      if (oldStatus === 'pending' && status === 'completed') {
        // Withdrawal completed - just remove from pending
        user.pendingWithdrawals -= transaction.amount;
      } else if (oldStatus === 'pending' && status === 'failed') {
        // Withdrawal failed - refund the amount
        user.pendingWithdrawals -= transaction.amount;
        user.availableBalance += transaction.amount;
      }
      
      await user.save();
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          // Using _id as reference
          _id: transaction._id,
          date: transaction.createdAt,
          note: transaction.note
        },
        availableBalance: user.availableBalance,
        pendingWithdrawals: user.pendingWithdrawals
      }
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถอัปเดตสถานะรายการได้' });
  }
};

// Get all transactions for the current user
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status, sort = 'date', order = 'desc' } = req.query;
    
    // Build query
    let query = { user: userId };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Build sort options
    let sortOptions = {};
    
    if (sort === 'date') {
      sortOptions.createdAt = order === 'asc' ? 1 : -1;
    } else if (sort === 'amount') {
      sortOptions.amount = order === 'asc' ? 1 : -1;
    }
    
    // Find transactions
    const transactions = await Transaction.find(query).sort(sortOptions);
    
    // Format transactions
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      date: transaction.createdAt,
      // Using _id as reference
      _id: transaction._id,
      note: transaction.note,
      failureReason: transaction.failureReason || null,
      rejectionReason: transaction.rejectionReason || null,
      bankAccount: transaction.bankAccount || null
    }));
    
    return res.status(200).json({
      status: 'success',
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถดึงข้อมูลรายการได้' });
  }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;
    
    // Find transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId
    });
    
    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        id: transaction._id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        date: transaction.createdAt,
        // Using _id as reference
          _id: transaction._id,
        note: transaction.note,
        bankAccount: transaction.bankAccount
      }
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถดึงข้อมูลรายการได้' });
  }
};

// Update bank details
export const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;
    
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'กรุณาระบุชื่อธนาคาร หมายเลขบัญชี และชื่อเจ้าของบัญชี' 
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Update bank details
    if (!user.bankAccount) {
      user.bankAccount = {};
    }
    
    user.bankAccount.bankName = bankName;
    user.bankAccount.accountNumber = accountNumber;
    user.bankAccount.accountName = accountName;
    
    await user.save();
    
    return res.status(200).json({
      status: 'success',
      data: user.bankAccount
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'ไม่สามารถอัปเดตข้อมูลธนาคารได้' });
  }
};
