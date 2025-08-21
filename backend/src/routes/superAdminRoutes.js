import express from 'express';
import { superAdminAuth } from '../middleware/superAdminAuth.js';
import * as superAdminController from '../controllers/superAdminController.js';

const router = express.Router();

// Super admin routes - all require superadmin role
router.get('/stats', superAdminAuth, superAdminController.getAdminStats);
router.get('/admins', superAdminAuth, superAdminController.getAllAdmins);
router.get('/admins/:adminId', superAdminAuth, superAdminController.getAdminById);
router.post('/admins', superAdminAuth, superAdminController.createAdmin);
router.put('/admins/:adminId', superAdminAuth, superAdminController.updateAdmin);
router.delete('/admins/:adminId', superAdminAuth, superAdminController.deleteAdmin);

export default router;
