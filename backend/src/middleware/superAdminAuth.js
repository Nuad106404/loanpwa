import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const superAdminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin by id
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(403).json({ status: 'error', message: 'Not authorized as admin' });
    }

    // Check if admin has superadmin role
    if (admin.role !== 'superadmin') {
      return res.status(403).json({ status: 'error', message: 'Access denied. Super admin privileges required.' });
    }

    // Add admin to request object
    req.admin = admin;
    req.adminId = admin._id;
    
    next();
  } catch (error) {
    console.error('Super admin auth error:', error.message);
    res.status(401).json({ status: 'error', message: 'Token is invalid or expired' });
  }
};

// Middleware that allows both admin and superadmin
export const adminOrSuperAdminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin by id
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(403).json({ status: 'error', message: 'Not authorized as admin' });
    }

    // Check if admin has admin or superadmin role
    if (!['admin', 'superadmin'].includes(admin.role)) {
      return res.status(403).json({ status: 'error', message: 'Access denied. Admin privileges required.' });
    }

    // Add admin to request object
    req.admin = admin;
    req.adminId = admin._id;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    res.status(401).json({ status: 'error', message: 'Token is invalid or expired' });
  }
};
