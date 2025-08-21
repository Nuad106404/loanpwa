import express from 'express';
import { authenticateJWT as authenticate } from '../middleware/authMiddleware.js';
import {
  getWallet,
  createWithdrawal,
  processLoanDisbursement,
  updateTransactionStatus,
  getTransactions,
  getTransactionById,
  updateBankDetails
} from '../controllers/walletController.js';

const router = express.Router();

// User routes - require authentication
router.get('/', authenticate, getWallet);
router.post('/withdraw', authenticate, createWithdrawal);
router.get('/transactions', authenticate, getTransactions);
router.get('/transactions/:transactionId', authenticate, getTransactionById);
router.put('/bank-details', authenticate, updateBankDetails);

// Admin routes - would typically require admin authentication
// For now using the same authenticate middleware, but in production
// you would want to add an isAdmin middleware
router.post('/loan-disbursement', authenticate, processLoanDisbursement);
router.put('/transaction-status', authenticate, updateTransactionStatus);

export default router;
