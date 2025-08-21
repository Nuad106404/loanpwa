import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const adminAuth = async (req, res, next) => {
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

    // Add admin to request object
    req.admin = admin;
    req.adminId = admin._id;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    res.status(401).json({ status: 'error', message: 'Token is invalid or expired' });
  }
};
