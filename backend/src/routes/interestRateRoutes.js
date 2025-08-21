import express from 'express';
import {
  getAllInterestRates,
  getInterestRateByTerm,
  createInterestRate,
  updateInterestRate,
  deleteInterestRate,
  seedInterestRates
} from '../controllers/interestRateController.js';
import { authenticateJWT, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - can be accessed without authentication
router.get('/', getAllInterestRates);
router.get('/:term', getInterestRateByTerm);
router.post('/seed', seedInterestRates);

// Protected routes - require admin authentication
router.post('/', authenticateJWT, authorizeAdmin, createInterestRate);
router.put('/:term', authenticateJWT, authorizeAdmin, updateInterestRate);
router.delete('/:term', authenticateJWT, authorizeAdmin, deleteInterestRate);

export default router;
