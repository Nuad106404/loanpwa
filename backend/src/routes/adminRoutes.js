import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Admin authentication
router.post('/login', adminController.login);

// Protected admin routes (require admin authentication)
router.get('/dashboard/stats', adminAuth, adminController.getDashboardStats);
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/status', adminAuth, adminController.getUserStatuses);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.get('/users/:id/password', adminAuth, adminController.getUserPassword);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.patch('/users/:id/status', adminAuth, adminController.updateUserStatus);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
// Update the status of a user's most recent loan from the users list page
router.put('/users/:userId/loans/status', adminAuth, adminController.updateUserLoanStatus);
// Update a user's wallet information (balance, approved loans, pending withdrawals)
router.put('/users/:userId/wallet', adminAuth, adminController.updateUserWallet);
// Update a specific loan with full details
router.put('/users/:userId/loans/:loanId', adminAuth, adminController.updateUserLoan);

// Get employment statuses
router.get('/employment-statuses', adminAuth, adminController.getEmploymentStatuses);

router.get('/loans', adminAuth, adminController.getAllLoans);
router.get('/loans/:id', adminAuth, adminController.getLoanById);
router.put('/loans/:id/status', adminAuth, adminController.updateLoanStatus);
router.delete('/loans/:id', adminAuth, adminController.deleteLoan);

router.get('/transactions', adminAuth, adminController.getAllTransactions);
router.get('/users/:userId/transactions', adminAuth, adminController.getUserTransactions);
router.put('/transactions/:transactionId/status', adminAuth, adminController.updateTransactionStatus);
router.put('/transactions/:transactionId', adminAuth, adminController.updateTransactionDetails);

// Withdrawal management routes
router.get('/users/:userId/withdrawals', adminAuth, adminController.getUserWithdrawals);
router.put('/withdrawals/:withdrawalId', adminAuth, adminController.updateWithdrawal);

router.get('/interest-rates', adminAuth, adminController.getInterestRates);
router.post('/interest-rates', adminAuth, adminController.createInterestRate);
router.put('/interest-rates/:id', adminAuth, adminController.updateInterestRate);
router.delete('/interest-rates/:id', adminAuth, adminController.deleteInterestRate);

export default router;
