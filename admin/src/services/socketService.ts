import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService | null = null;

  private constructor() {
    // Initialize connection
    this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private setupEventListeners(): void {
    if (!this.socket) {
      console.error('Socket is null in setupEventListeners');
      return;
    }

    this.socket.on('connect', () => {
      // Join admin room
      this.socket.emit('join_admin_room');
    });

    this.socket.on('admin_room_joined', (data) => {
    });

    this.socket.on('disconnect', (reason) => {
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    this.socket.on('user_status_change', (data) => {
    });
    
    // Listen for message delivery status updates
    this.socket.on('message_delivery_status', (data) => {
      this.handleDeliveryStatus(data);
    });
    
    // Listen for message delivery confirmations
    this.socket.on('message_delivery_confirmed', (data) => {
      this.handleDeliveryConfirmation(data);
    });
    
    // Listen for delivery timeouts
    this.socket.on('message_delivery_timeout', (data) => {
      this.handleDeliveryTimeout(data);
    });
    
    // Listen for queued message delivery notifications
    this.socket.on('queued_messages_delivered', (data) => {
      this.handleQueuedMessagesDelivered(data);
    });
  }

  // Send notification to a specific user
  public sendNotificationToUser(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }): void {
    if (!this.socket) return;
    
    this.socket.emit('admin_send_notification', {
      userId,
      ...notification
    });
  }

  // Send notification to all users
  public broadcastNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }): void {
    if (!this.socket) return;
    
    this.socket.emit('admin_broadcast_notification', notification);
  }

  // Get list of online users
  public requestOnlineUsers(): void {
    if (!this.socket) return;
    
    this.socket.emit('get_online_users');
  }

  // Listen for online users update
  public onOnlineUsersUpdate(callback: (users: any[]) => void): void {
    if (!this.socket) return;
    
    this.socket.on('online_users_update', (users) => {
      callback(users);
    });
  }

  // Handle delivery status updates
  private handleDeliveryStatus(data: any): void {
    import('sweetalert2').then(({ default: Swal }) => {
      const { status, message, userId } = data;
      
      if (status === 'sent') {
        // Show brief success notification
        Swal.fire({
          title: 'Message Sent',
          text: message,
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else if (status === 'queued') {
        // Show queued notification
        Swal.fire({
          title: 'Message Queued',
          text: message,
          icon: 'info',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }
  
  // Handle delivery confirmation
  private handleDeliveryConfirmation(data: any): void {
    import('sweetalert2').then(({ default: Swal }) => {
      const { message, userId } = data;
      
      Swal.fire({
        title: 'Message Delivered!',
        text: message,
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    });
  }
  
  // Handle delivery timeout
  private handleDeliveryTimeout(data: any): void {
    import('sweetalert2').then(({ default: Swal }) => {
      const { message, userId } = data;
      
      Swal.fire({
        title: 'Delivery Uncertain',
        text: message,
        icon: 'warning',
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    });
  }
  
  // Handle queued messages delivered
  private handleQueuedMessagesDelivered(data: any): void {
    import('sweetalert2').then(({ default: Swal }) => {
      const { userId, messageCount } = data;
      
      Swal.fire({
        title: 'Queued Messages Delivered',
        text: `${messageCount} queued message(s) delivered to user when they came online`,
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    });
  }

  // Cleanup
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService;
