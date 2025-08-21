import axios from 'axios';
import socketService from './socketService';

// Removed toast imports - now using SweetAlert2 in socketService directly

export interface Notification {
  _id?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  isGlobal: boolean;
  createdAt: string;
  expiresAt?: string;
}

class NotificationService {
  private static instance: NotificationService | null = null;
  private notificationListeners: ((notification: Notification) => void)[] = [];
  
  private constructor() {
    // Socket initialization now handled by AuthContext to prevent conflicts
    // this.initSocketListeners(); // Removed to prevent duplicate connections
  }
  
  // Singleton pattern
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  // Initialize notification listener only (socket connection managed by AuthContext)
  public init(userId: string): void {
    
    // Only set up notification listener - don't manage socket connection or identification
    // Socket connection and user identification are now handled by AuthContext
    socketService.addListener<Notification>('new_notification', (notification) => {
      
      // Note: Notifications are now handled directly by socketService with SweetAlert2
      // The socketService will show the SweetAlert2 popup automatically
      this.notifyListeners(notification);
    });
    
    // Note: User identification is now handled by AuthContext to prevent conflicts
  }
  
  // Note: Toast notifications removed - now handled directly by socketService with SweetAlert2
  
  // Add notification listener
  public addNotificationListener(listener: (notification: Notification) => void): () => void {
    this.notificationListeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }
  
  // Notify all registered listeners about new notification
  private notifyListeners(notification: Notification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
  
  // Fetch user's notifications from API
  public async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await axios.get(`/api/notifications/user/${userId}`);
      return (response.data as any).data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }
  
  // Mark notification as read
  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await axios.patch(`/api/notifications/read/${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  // Mark all user notifications as read
  public async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await axios.patch(`/api/notifications/read-all/${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  // Identify user to socket server when user logs in
  public identifyUser(userId: string): void {
    socketService.identifyUser(userId);
  }
  
  // Clean up resources when logging out
  public cleanup(): void {
    // Clear notification listeners
    this.notificationListeners = [];
  }
}

export default NotificationService.getInstance();
