import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in MongoDB first (using User model)
    let user = null;
    try {
      const User = (await import('../models/User.js')).default;
      user = await User.findById(decoded.id);
    } catch (err) {
    }
    
    // If not found in MongoDB, try Prisma
    if (!user) {
      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });
      } catch (err) {
      }
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

// Middleware to check if the user is an admin
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'User not authenticated'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Admin privileges required'
    });
  }

  next();
};
