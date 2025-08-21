import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { 
  submitApplication, 
  savePersonalInfo,
  saveFinancialInfo,
  saveFamilyContact,
  saveAddressInfo,
  getAddressInfo,
  getLoanDetails,
  createLoanApplication,
  saveIdVerification
} from '../controllers/loanController.js';

const router = express.Router();

// Apply authentication middleware to specific routes rather than all routes
// This allows us to have some public endpoints

// Submit a new loan application - no authentication required
router.post('/apply', submitApplication);

// Save personal information immediately - no authentication required
router.post('/personal-info', savePersonalInfo);

// Update personal information by ID - no authentication required
router.put('/personal-info/:id', savePersonalInfo);

// Save financial information - no authentication required
router.post('/financial-info', saveFinancialInfo);

// Save family contact information - no authentication required
router.post('/family-contact', saveFamilyContact);

// This route is currently disabled as the function is not available
// router.post('/loan-details', saveLoanDetails);

// ID verification endpoint - handled directly in index.js with file upload middleware
// router.post('/id-verification', saveIdVerification);

// Enable loan application creation from calculator
router.post('/create-application', createLoanApplication);

// Save address information - no authentication required
router.post('/address-info', saveAddressInfo);

// Get address information - no authentication required
router.get('/address-info', getAddressInfo);

// Test endpoint to verify route mounting
router.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Loan routes are working correctly' });
});

// Get loan details - no authentication required
router.get('/details', getLoanDetails);

// Get user's loan applications - requires authentication
// Temporarily using submitApplication as a placeholder since getAllUserLoans is not available
router.get('/', authenticateJWT, (req, res) => {
  res.status(200).json({ message: 'This endpoint is temporarily disabled' });
});

export default router;
