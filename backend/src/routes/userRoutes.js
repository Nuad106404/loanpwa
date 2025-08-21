import express from 'express';
import { register, getProfile, updateProfile, updateDocuments } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// File upload configuration for required documents
const documentUpload = upload.fields([
  { name: 'idCardFront', maxCount: 1 },
  { name: 'idCardBack', maxCount: 1 },
  { name: 'selfieWithId', maxCount: 1 }
]);

// Public routes
router.post('/register', documentUpload, register);

// Protected routes
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/documents', protect, documentUpload, updateDocuments);

export default router;
