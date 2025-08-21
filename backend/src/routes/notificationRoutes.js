import express from 'express';
import {
  createUserNotification,
  createGlobalNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';
import { authenticateJWT as checkAuth, authorizeAdmin as checkAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for admin only
router.post('/user', checkAuth, checkAdmin, createUserNotification); // Send notification to specific user
router.post('/global', checkAuth, checkAdmin, createGlobalNotification); // Send global notification to all users

// Routes for any authenticated user
router.get('/user/:userId', checkAuth, getUserNotifications); // Get notifications for a specific user
router.patch('/read/:notificationId', checkAuth, markNotificationAsRead); // Mark notification as read
router.patch('/read-all/:userId', checkAuth, markAllNotificationsAsRead); // Mark all notifications as read

export default router;
