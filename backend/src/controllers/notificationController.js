import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create and send a notification to a specific user
export const createUserNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', expiresAt } = req.body;

    // Validate userId if provided
    if (userId) {
      // Check if userId is valid
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user ID format'
        });
      }

      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
    }

    // Create the notification
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isGlobal: false,
      expiresAt: expiresAt || null
    });

    await notification.save();
    
    // Send real-time notification via Socket.IO
    if (global.io) {
      if (userId) {
        // Emit to specific user using their room (userId)
        global.io.to(`user_${userId}`).emit('new_notification', notification);
      }
    } else {
      console.warn('Socket.IO instance not available for real-time notification');
    }

    return res.status(201).json({
      status: 'success',
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create notification'
    });
  }
};

// Create and send a global notification to all users
export const createGlobalNotification = async (req, res) => {
  try {
    const { title, message, type = 'info', expiresAt } = req.body;

    // Create the notification
    const notification = new Notification({
      userId: null,
      title,
      message,
      type,
      isGlobal: true,
      expiresAt: expiresAt || null
    });

    await notification.save();
    
    // Send real-time notification via Socket.IO to all clients
    if (global.io) {
      global.io.emit('new_notification', notification);
    } else {
      console.warn('Socket.IO instance not available for real-time notification');
    }

    return res.status(201).json({
      status: 'success',
      message: 'Global notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating global notification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create global notification'
    });
  }
};

// Get all notifications for a specific user (including global notifications)
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    // Find notifications for this user and global notifications
    // Sort by createdAt in descending order (newest first)
    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { isGlobal: true }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to most recent 50 notifications

    return res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Validate notificationId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid notification ID format'
      });
    }

    // Find and update the notification
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update notification'
    });
  }
};

// Mark all notifications for a user as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    // Update all notifications for this user
    const result = await Notification.updateMany(
      { userId: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update notifications'
    });
  }
};
