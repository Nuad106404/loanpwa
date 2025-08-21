import { io, Socket } from "socket.io-client";
import Swal from 'sweetalert2';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private pendingUserIdentification: string | null = null;
  private connectionLostAlert: any | null = null;
  private isOfflineAlertShown: boolean = false;
  private reconnectAttempts: number = 0;

  private constructor() {
    // Private constructor for singleton pattern
  }

  // Singleton instance getter
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Initialize socket connection
  public connect(): void {
    
    if (this.socket && this.socket.connected) {
      return;
    }

    // Disconnect existing socket if it exists but isn't connected
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }


    this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      timeout: 3000, // Even faster timeout for quicker failure detection
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 50, // ULTRA-aggressive: 50ms initial delay
      reconnectionDelayMax: 500, // Cap at 500ms maximum
      reconnectionAttempts: 100, // Even more attempts for maximum persistence
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      randomizationFactor: 0.05 // Minimal randomization
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) {
      console.error('Socket is null in setupEventListeners');
      return;
    }

    this.socket.on("connect", () => {
      
      // Emit custom event for UI components to listen to
      this.emitConnectionStatusUpdate({
        connected: true,
        socketId: this.socket?.id || 'unknown',
        timestamp: new Date().toISOString(),
        transport: this.socket?.io.engine.transport.name || 'unknown',
        serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
      });

      // IMMEDIATE re-identification on any connection (including refresh)
      this.performUserIdentification('connect');
    });

    this.socket.on("disconnect", (reason) => {

      // Emit custom event for UI components to listen to
      this.emitConnectionStatusUpdate({
        connected: false,
        reason: reason,
        timestamp: new Date().toISOString(),
        serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
      });

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, force reconnect immediately
        this.socket?.connect();
      } else if (reason === 'transport close' || reason === 'transport error') {
        // This is likely a page refresh - socket.io will handle reconnection automatically
      } else if (reason === 'ping timeout') {
        // Network issue, force reconnect
        this.socket?.connect();
      } else {
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌💥 Socket connection error:", error);
      this.reconnectAttempts++;

      // Emit custom event for UI components to listen to
      this.emitConnectionStatusUpdate({
        connected: false,
        error: error.message || error.toString(),
        attempts: this.reconnectAttempts,
        timestamp: new Date().toISOString(),
        serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
      });
    });

    this.socket.on("reconnect", (attemptNumber) => {

      this.reconnectAttempts = 0;

      // Emit custom event for UI components to listen to
      this.emitConnectionStatusUpdate({
        connected: true,
        reconnected: true,
        attempts: attemptNumber,
        socketId: this.socket?.id || 'unknown',
        timestamp: new Date().toISOString(),
        transport: this.socket?.io.engine.transport.name || 'unknown',
        serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
      });

      // IMMEDIATE re-identification after reconnection
      this.performUserIdentification('reconnect');

      // Double-check: Ensure identification happens even if performUserIdentification fails
      const userId = localStorage.getItem('userId');
      if (userId && this.socket) {
        setTimeout(() => {
          if (this.socket?.connected) {
            this.socket.emit("identify_user", {
              userId: userId,
              source: 'reconnect_backup',
              timestamp: new Date().toISOString()
            });
          }
        }, 100);
      }
    });



    this.socket.on("reconnect_error", (error) => {
      console.error("🔌❌ Socket reconnection error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket failed to reconnect after all attempts");
      // Show user-friendly message about connection issues
      Swal.fire({
        title: 'การเชื่อมต่อขาดหาย',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณารีเฟรชหน้าเว็บ',
        icon: 'error',
        confirmButtonText: 'รีเฟรชหน้าเว็บ',
        allowOutsideClick: false
      }).then(() => {
        window.location.reload();
      });
    });

    // Listen for test connection
    this.socket.on("connection_test", (data) => {
    });

    // Listen for user room confirmation
    this.socket.on("user_room_joined", (data) => {
    });

    // Add default listener for notifications - with enhanced SweetAlert2 popup, sound, and delivery confirmation
    this.socket.on("new_notification", (notification: any) => {

      // Play notification sound immediately when notification is received
      this.playNotificationSound();

      // Use SweetAlert2 for popup notifications with enhanced styling
      const { title, message, type, messageId, adminSocketId, userId } = notification;


      // Map notification types to SweetAlert2 icons and colors
      let icon: 'success' | 'error' | 'warning' | 'info' = 'info';
      let confirmButtonColor = '#3085d6';
      let backdrop: boolean | string = true;

      switch (type) {
        case 'success':
          icon = 'success';
          confirmButtonColor = '#28a745';
          break;
        case 'error':
          icon = 'error';
          confirmButtonColor = '#dc3545';
          backdrop = 'rgba(220, 53, 69, 0.1)';
          break;
        case 'warning':
          icon = 'warning';
          confirmButtonColor = '#ffc107';
          backdrop = 'rgba(255, 193, 7, 0.1)';
          break;
        case 'info':
        default:
          icon = 'info';
          confirmButtonColor = '#17a2b8';
          backdrop = 'rgba(23, 162, 184, 0.1)';
          break;
      }

      // Show the notification with enhanced styling
      Swal.fire({
        title: title,
        html: `<div style="font-size: 16px; line-height: 1.5; color: #333;">${message}</div>`,
        icon: icon,
        confirmButtonText: 'Got it!',
        confirmButtonColor: confirmButtonColor,
        showCloseButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        backdrop: backdrop,
        customClass: {
          popup: 'notification-popup-enhanced',
          title: 'notification-title-enhanced',
          htmlContainer: 'notification-content-enhanced',
          confirmButton: 'notification-button-enhanced'
        },
        didOpen: () => {
          // Add custom styling
          const popup = Swal.getPopup();
          if (popup) {
            popup.style.borderRadius = '12px';
            popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            popup.style.border = `2px solid ${confirmButtonColor}`;
          }
        }
      }).then((result) => {
        // Send delivery confirmation back to server
        if (messageId && adminSocketId) {
          this.socket?.emit('message_received_confirmation', {
            messageId,
            adminSocketId,
            userId,
            timestamp: new Date().toISOString(),
            userAction: result.isConfirmed ? 'confirmed' : 'dismissed'
          });
        }
      });
    });
  }

  // Check if socket is connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  // Centralized user identification method
  private performUserIdentification(source: 'connect' | 'reconnect' | 'manual'): void {
    // Process any pending user identification first
    if (this.pendingUserIdentification) {
      this.socket!.emit("identify_user", {
        userId: this.pendingUserIdentification,
        source: source,
        timestamp: new Date().toISOString()
      });
      this.pendingUserIdentification = null;
      return;
    }

    // ROBUST: Try multiple localStorage keys for userId persistence
    const userData = localStorage.getItem('userData') || localStorage.getItem('user') || localStorage.getItem('userToken');
    let userId = null;

    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id || user.userId || user._id;
      } catch (error) {
        // If JSON parsing fails, maybe it's a direct userId string
        userId = userData;
      }
    }

    // Also check for direct userId in localStorage
    if (!userId) {
      userId = localStorage.getItem('userId');
    }

    if (userId) {

      // Store userId directly for future use
      localStorage.setItem('userId', userId);

      this.socket!.emit("identify_user", {
        userId: userId,
        source: source,
        timestamp: new Date().toISOString(),
        reconnection: source === 'reconnect',
        pageRefresh: source === 'connect' && performance.navigation?.type === 1
      });
    } else {
      console.warn('🔌⚠️ No userId found in localStorage for auto-identification');
    }
  }

  // Send identity to server for user-specific notifications
  public identifyUser(userId: string): void {
    // CRITICAL: Store userId in localStorage for persistence across refreshes
    localStorage.setItem('userId', userId);

    // CRITICAL: Always store pending identification for immediate processing
    this.pendingUserIdentification = userId;

    // AGGRESSIVE: Try to connect if socket doesn't exist
    if (!this.socket) {
      this.connect();
    }

    // IMMEDIATE: Try to identify even if not fully connected (will queue if needed)
    if (this.socket) {

      // Try to emit immediately
      try {
        this.socket.emit("identify_user", {
          userId,
          source: 'manual',
          timestamp: new Date().toISOString(),
          immediate: true
        });

        // If successful and connected, clear pending
        if (this.socket.connected) {
          this.pendingUserIdentification = null;
        } else {
        }
      } catch (error) {
        console.warn("⚠️ WARNING: Failed to emit identification, will retry:", error);
      }
    }

    // BACKUP: Set up aggressive retry mechanism
    let retryCount = 0;
    const maxRetries = 30;

    const aggressiveIdentify = () => {
      retryCount++;

      if (retryCount > maxRetries) {
        console.error("💥 CRITICAL: Failed to identify user after", maxRetries, "attempts:", userId);
        return;
      }

      if (this.socket && this.socket.connected && this.pendingUserIdentification === userId) {

        try {
          this.socket.emit("identify_user", {
            userId,
            source: 'retry',
            timestamp: new Date().toISOString(),
            attempt: retryCount
          });
          this.pendingUserIdentification = null;
        } catch (error) {
          console.warn(`⚠️ RETRY ${retryCount} FAILED:`, error);
          // Continue retrying
          setTimeout(aggressiveIdentify, 50); // Very fast retry
        }
      } else if (this.pendingUserIdentification === userId) {
        // Still pending, keep trying
        setTimeout(aggressiveIdentify, 50); // Very fast retry
      }
    };

    // Start aggressive retry after a tiny delay
    setTimeout(aggressiveIdentify, 10);
  }

  // Show connection lost debugging alert
  private showConnectionLostAlert(reason: string): void {
    if (this.connectionLostAlert) {
      return; // Don't show multiple alerts
    }

    this.connectionLostAlert = Swal.fire({
      title: '🔌❌ การเชื่อมต่อ Socket ขาดหาย',
      html: `
        <div style="text-align: left;">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          <p><strong>Status:</strong> Attempting to reconnect...</p>
          <div id="reconnect-status" style="margin-top: 10px; font-weight: bold; color: #ff6b6b;">🔄 Reconnecting...</div>
        </div>
      `,
      icon: 'warning',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'socket-debug-alert'
      }
    });
  }

  // Show connection error debugging alert
  private showConnectionErrorAlert(error: any, attemptNumber: number): void {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Update existing alert or create new one
    if (this.connectionLostAlert) {
      const statusElement = document.getElementById('reconnect-status');
      if (statusElement) {
        statusElement.innerHTML = `🔄 Reconnect attempt ${attemptNumber} failed: ${errorMessage}`;
        statusElement.style.color = '#ff6b6b';
      }
    } else {
      this.connectionLostAlert = Swal.fire({
        title: '🔌💥 Connection Error',
        html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${errorMessage}</p>
            <p><strong>Attempt:</strong> ${attemptNumber}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            <div id="reconnect-status" style="margin-top: 10px; font-weight: bold; color: #ff6b6b;">🔄 Retrying connection...</div>
          </div>
        `,
        icon: 'error',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'socket-debug-alert'
        }
      });
    }
  }

  // Detect if this is a page refresh/reload
  private isPageRefresh(): boolean {
    try {
      // Method 1: Modern Performance Navigation API
      const perfNavigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfNavigation) {
        const isReload = perfNavigation.type === 'reload';
        const isBackForward = perfNavigation.type === 'back_forward';
        if (isReload || isBackForward) {
          return true;
        }
      }
      
      // Method 2: Legacy Performance Navigation (for older browsers)
      if (performance.navigation) {
        const legacyType = performance.navigation.type;
        if (legacyType === 1) { // TYPE_RELOAD
          return true;
        }
      }
      
      // Method 3: Check if this is the first connection after page load
      const pageLoadTime = performance.timing?.navigationStart || performance.timeOrigin;
      const currentTime = Date.now();
      const timeSincePageLoad = currentTime - pageLoadTime;
      const isRecentPageLoad = timeSincePageLoad < 5000; // Within 5 seconds of page load
      
      // If socket connects within 5 seconds of page load, likely a refresh
      return isRecentPageLoad;
      
    } catch (error) {
      console.warn('🔍 REFRESH DEBUG - Detection error:', error);
      // Fallback: assume it's a refresh if we can't detect otherwise
      return true;
    }
  }

  // Emit connection status update for UI components
  private emitConnectionStatusUpdate(status: any): void {
    // Emit custom event that UI components can listen to
    const event = new CustomEvent('socketStatusUpdate', { detail: status });
    window.dispatchEvent(event);
  }

  // Show reconnection success alert
  private showReconnectionSuccessAlert(attemptNumber: number): void {
    const connectionUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const socketId = this.socket?.id || 'Unknown';
    const transport = this.socket?.io.engine.transport.name || 'Unknown';
    
    Swal.fire({
      title: '🔌✅ Reconnected Successfully!',
      html: `
        <div style="text-align: left;">
          <p><strong>Reconnected after:</strong> ${attemptNumber} attempts</p>
          <p><strong>Server:</strong> <code>${connectionUrl}</code></p>
          <p><strong>Socket ID:</strong> <code>${socketId}</code></p>
          <p><strong>Transport:</strong> <code>${transport}</code></p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          <p><strong>Status:</strong> ✅ Online and active</p>
        </div>
      `,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false,
      customClass: {
        popup: 'socket-debug-alert'
      }
    });
  }

  // Show user offline alert
  private showUserOfflineAlert(userId: string): void {
    if (this.isOfflineAlertShown) {
      return; // Don't show multiple offline alerts
    }

    this.isOfflineAlertShown = true;

    Swal.fire({
      title: '👤❌ User Offline',
      html: `
        <div style="text-align: left;">
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Status:</strong> ❌ Offline</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          <p><strong>Action:</strong> Attempting to reconnect...</p>
        </div>
      `,
      icon: 'warning',
      showConfirmButton: true,
      confirmButtonText: 'Dismiss',
      customClass: {
        popup: 'socket-debug-alert'
      }
    }).then(() => {
      this.isOfflineAlertShown = false;
    });
  }

  // Clear connection alerts
  private clearConnectionAlerts(): void {
    if (this.connectionLostAlert) {
      Swal.close();
      this.connectionLostAlert = null;
    }
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/Thailand-Address/chime-alert-demo-309545.mp3');
      audio.volume = 0.7; // Set volume to 70%

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
          })
          .catch(error => {
            console.warn('🔔⚠️ Audio autoplay blocked or failed:', error);
            // Fallback: Try to play on next user interaction
            const playOnInteraction = () => {
              audio.play().catch(e => console.warn('🔔❌ Audio playback failed:', e));
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('keydown', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
            document.addEventListener('keydown', playOnInteraction);
          });
      }
    } catch (error) {
      console.error('🔔❌ Error creating audio:', error);
    }
  }

  // Emit logout event to backend to mark user as inactive
  public emitLogout(userId: string): Promise<void> {
    // Clear any debugging alerts on logout
    this.clearConnectionAlerts();
    this.isOfflineAlertShown = false;

    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.logoutViaAPI(userId).finally(() => resolve());
        return;
      }

      this.socket.emit("user_logout", { userId });
      
      // Wait a bit to ensure the event is sent before disconnecting
      setTimeout(() => {
        resolve();
      }, 200);
    });
  }

  // Disconnect socket and clean up user data on logout
  public disconnectSocket(): void {
    
    // Clear any debugging alerts
    this.clearConnectionAlerts();
    this.isOfflineAlertShown = false;
    
    // Clear pending user identification
    this.pendingUserIdentification = null;
    
    // Clear userId from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    
    // Emit disconnection status update
    this.emitConnectionStatusUpdate({
      connected: false,
      reason: 'user_logout',
      timestamp: new Date().toISOString(),
      serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
    });
    
    // Disconnect the socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
  }

  // Disconnect socket for unauthenticated users (without clearing user data)
  public disconnectUnauthenticated(): void {
    
    // Clear any debugging alerts
    this.clearConnectionAlerts();
    this.isOfflineAlertShown = false;
    
    // Clear pending user identification
    this.pendingUserIdentification = null;
    
    // Emit disconnection status update with appropriate reason
    this.emitConnectionStatusUpdate({
      connected: false,
      reason: 'not_authenticated',
      timestamp: new Date().toISOString(),
      serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'
    });
    
    // Disconnect the socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
  }

  // Fallback API logout when socket is unavailable
  private async logoutViaAPI(userId: string): Promise<void> {
    try {
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
      } else {
        console.warn('⚠️ API logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('❌ API logout error:', error);
    }
  }

  // Add event listener for socket events
  public addListener<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbackSet = this.listeners.get(event)!;
    callbackSet.add(callback);

    // Add listener to socket if it exists
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return function to remove this listener
    return () => this.removeListener(event, callback);
  }

  // Remove specific event listener
  public removeListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.delete(callback);

    if (this.socket) {
      this.socket.off(event, callback as (...args: any[]) => void);
    }
  }

  // Disconnect socket connection
  public disconnect(): void {
    // Clear any debugging alerts on disconnect
    this.clearConnectionAlerts();
    this.isOfflineAlertShown = false;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Public method to manually trigger offline alert (for testing)
  public triggerOfflineAlert(userId: string): void {
    this.showUserOfflineAlert(userId);
  }

  // Get current connection status for debugging
  public getConnectionStatus(): { 
    connected: boolean; 
    attempts: number; 
    socketId?: string;
    serverUrl?: string;
    transport?: string;
    userId?: string;
  } {
    return {
      connected: this.socket?.connected || false,
      attempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001',
      transport: this.socket?.io.engine.transport.name,
      userId: localStorage.getItem('userId') || undefined
    };
  }

  // Public method to manually show connection info (for testing/debugging)
  public showConnectionInfo(): void {
    const status = this.getConnectionStatus();
    
    if (status.connected) {
    } else {
    }
  }
}

export default SocketService.getInstance();
