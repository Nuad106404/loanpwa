import express from 'express';
import { getAllInterestRates, getInterestRateByTerm } from '../controllers/interestRateController.js';

const router = express.Router();

// Public routes for interest rates
router.get('/interest-rates', getAllInterestRates);
router.get('/interest-rates/:term', getInterestRateByTerm);

export default router;
