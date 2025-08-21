import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for broadcast notifications
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isGlobal: {
    type: Boolean,
    default: false // If true, this notification is sent to all users
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: false // Optional expiration date
  }
}, { timestamps: true });

// Create indexes for more efficient querying
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
