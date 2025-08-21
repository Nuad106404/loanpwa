import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './utils/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import interestRateRoutes from './routes/interestRateRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import User from './models/User.js';

// Load environment variables - ensure we're looking in the right location
// Use import.meta.url to get the current file's path in ES modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First try the root directory
dotenv.config();

// If that doesn't work, try relative to the current directory
if (!process.env.MONGO_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}


// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available globally
global.io = io;

// Store for pending messages (offline users)
const pendingMessages = new Map(); // userId -> array of messages
const connectedUsers = new Map(); // socketId -> userId
const userSockets = new Map(); // userId -> socketId (latest connection)
const userSocketHistory = new Map(); // userId -> Set of socketIds (all connections)

// Socket.IO connection handling with authentication support
io.on('connection', (socket) => {
  
  // Send a test event to verify connection
  socket.emit('connection_test', { message: 'Connection established successfully' });
  
  // Join admin room for targeted broadcasts
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    
    // Send confirmation that the client joined the admin room
    socket.emit('admin_room_joined', { success: true });
    
    // Log all rooms
    const rooms = io.sockets.adapter.rooms;
  });
  
  // Identify user for notifications - ULTRA-ROBUST reconnection handling
  socket.on('identify_user', async (data) => {
    const { userId, source, timestamp, immediate, attempt, reconnection, pageRefresh } = data;
    if (!userId) {
      return;
    }
    
    const logPrefix = immediate ? '⚡ INSTANT' : 
                     attempt ? `🎯 RETRY-${attempt}` : 
                     reconnection ? '🔄 RECONNECT' :
                     pageRefresh ? '🔃 REFRESH' : '🔌👤';
    
    // ULTRA-PRIORITY: Handle aggressive reconnection scenarios
    if (immediate || source === 'connect' || source === 'reconnect' || source === 'reconnect_backup' || reconnection || pageRefresh) {
    }
    
    // AGGRESSIVE: Handle multiple connections per user with instant binding
    const previousSocketId = userSockets.get(userId);
    if (previousSocketId && previousSocketId !== socket.id) {
      
      // Immediately update to latest socket - no delays
      if (connectedUsers.has(previousSocketId)) {
        // Don't disconnect old socket, just update mappings
      }
    } else {
    }
    
    // INSTANT: Store user-socket mapping (latest connection takes precedence)
    connectedUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id); // ALWAYS bind latest socket immediately
    
    // Track all socket connections for this user (for multi-tab support)
    if (!userSocketHistory.has(userId)) {
      userSocketHistory.set(userId, new Set());
    }
    userSocketHistory.get(userId).add(socket.id);
    
    
    // Join user to their personal room for targeted messaging
    socket.join(`user_${userId}`);
    
    // ULTRA-ROBUST: Immediate database update for zero offline time
    try {
      const updateData = {
        isOnline: true, // Always true when user identifies
        lastActive: new Date(),
        socketConnected: true,
        lastSocketConnection: new Date(),
        currentSocketId: socket.id,
        lastReconnectSource: source,
        totalConnections: (userSocketHistory.get(userId)?.size || 1)
      };
      
      // Don't await - fire and forget for speed
      User.findByIdAndUpdate(userId, updateData, { new: true })
        .then(result => {
          const priority = immediate ? 'INSTANT' : 
                          reconnection ? 'RECONNECT' : 
                          pageRefresh ? 'REFRESH' : 'NORMAL';
        })
        .catch(err => {
          console.error('❌ DB Error (non-blocking):', err.message);
        });
    } catch (err) {
      console.error('❌ CRITICAL: Database update failed:', err);
      // Continue with identification even if DB fails
    }
    
    // Deliver any pending messages for this user
    if (pendingMessages.has(userId)) {
      const messages = pendingMessages.get(userId);
      
      messages.forEach(message => {
        socket.emit('new_notification', message);
      });
      
      // Clear pending messages after delivery
      pendingMessages.delete(userId);
      
      // Notify admin about successful delivery of queued messages
      io.to('admin_room').emit('queued_messages_delivered', {
        userId,
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // INSTANT: Emit status change events (non-blocking)
    const statusChangeEvent = {
      userId: userId,
      isOnline: true,
      timestamp: new Date().toISOString(),
      source: source || 'user_identification',
      socketId: socket.id,
      hasMultipleConnections: userSocketHistory.get(userId).size > 1,
      reconnection: reconnection || false,
      pageRefresh: pageRefresh || false
    };
    
    // Fire events immediately without blocking
    setImmediate(() => {
      io.emit('user_status_change', statusChangeEvent);
      io.to('admin_room').emit('user_online_status_update', {
        userId: userId,
        isOnline: true,
        socketCount: userSocketHistory.get(userId).size,
        activeSocketId: socket.id,
        timestamp: new Date().toISOString(),
        reconnectionType: source
      });
    });
    
    
    // OPTIMIZED: Lightweight heartbeat only for active socket
    if (userSockets.get(userId) === socket.id) {
      const heartbeatInterval = setInterval(() => {
        // Quick check and non-blocking update
        if (connectedUsers.has(socket.id) && userSockets.get(userId) === socket.id) {
          User.findByIdAndUpdate(userId, { lastActive: new Date() })
            .catch(err => console.warn('Heartbeat update failed:', err.message));
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
      
      socket.heartbeatInterval = heartbeatInterval;
    } else {
    }
  });
  
  // Handle explicit user logout (only way to set user as inactive)
  socket.on('user_logout', async (data) => {
    const { userId } = data;
    if (!userId) {
      return;
    }
    
    
    try {
      // Update user status in database
      const updateResult = await User.findByIdAndUpdate(userId, {
        isOnline: false, // Only set to false on explicit logout
        socketConnected: false,
        lastActive: new Date(),
        lastSeen: new Date().toISOString()
      });
      
      if (updateResult) {
      } else {
      }
      
      // Clean up user tracking
      const socketId = userSockets.get(userId);
      if (socketId) {
        connectedUsers.delete(socketId);
        userSockets.delete(userId);
      }
      
      // Clean up socket history
      if (userSocketHistory.has(userId)) {
        userSocketHistory.delete(userId);
      }
      
      // Emit status change event for logout
      const statusChangeEvent = {
        userId: userId,
        isOnline: false,
        timestamp: new Date().toISOString(),
        source: 'user_logout',
        socketId: socket.id
      };
      
      io.emit('user_status_change', statusChangeEvent);
      
      // Also emit to admin room specifically
      io.to('admin_room').emit('user_status_change', statusChangeEvent);
      
    } catch (err) {
      console.error('❌ Error updating user logout status:', err);
    }
  });
  
  // Handle explicit user status update requests
  socket.on('request_user_status_update', (data) => {
    if (data && data.userId) {
      // Broadcast to all clients
      io.emit('user_status_change', {
        userId: data.userId,
        isOnline: data.isOnline,
        timestamp: new Date().toISOString(),
        source: 'explicit_request'
      });
    }
  });
  
  // Handle admin request for online users list with multi-layer detection
  socket.on('get_online_users', async () => {
    
    try {
      // Get ALL users from database (not just online ones)
      const allUsers = await User.find({}).select('_id firstName lastName phone isOnline lastActive socketConnected currentSocketId lastSeen personalInformation');
      
      // Enhance each user with multi-layer online detection (same logic as message delivery)
      const enhancedUsers = allUsers.map(user => {
        const userId = user._id.toString();
        
        // Multi-layer detection (same as message delivery system)
        const hasActiveSocket = userSockets.has(userId);
        const hasAnySocket = userSocketHistory.has(userId) && userSocketHistory.get(userId).size > 0;
        const isUserOnline = hasActiveSocket || hasAnySocket;
        
        // Additional socket information
        const socketCount = userSocketHistory.has(userId) ? userSocketHistory.get(userId).size : 0;
        const activeSocketId = userSockets.get(userId) || null;
        
        
        return {
          ...user.toObject(),
          // Multi-layer online status (matches message delivery logic)
          isOnline: isUserOnline,
          // Additional connection details
          hasActiveSocket,
          hasAnySocket,
          socketCount,
          activeSocketId,
          // Database status for comparison
          dbIsOnline: user.isOnline,
          // Real-time status determination
          isReallyOnline: isUserOnline,
          // Connection metadata
          connectionDetails: {
            activeSocket: hasActiveSocket,
            anySocket: hasAnySocket,
            socketCount: socketCount,
            activeSocketId: activeSocketId,
            databaseOnline: user.isOnline
          }
        };
      });
      
      // Filter to only include users that have some activity (either online or have been online)
      const relevantUsers = enhancedUsers.filter(user => 
        user.isReallyOnline || user.dbIsOnline || user.lastActive || user.socketCount > 0
      );
      
      
      // Send to requesting admin
      socket.emit('online_users_update', relevantUsers);
      
    } catch (error) {
      console.error('❌ Error fetching users with multi-layer detection:', error);
      socket.emit('online_users_update', []);
    }
  });
  
  // Send notification from admin panel to a specific user
  socket.on('admin_send_notification', (data) => {
    if (!data || !data.userId) return;
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enhancedMessage = {
      ...data,
      messageId,
      timestamp: new Date().toISOString(),
      adminSocketId: socket.id
    };
    
    // Check if user is online using multiple connection logic
    const hasActiveSocket = userSockets.has(data.userId);
    const hasAnySocket = userSocketHistory.has(data.userId) && userSocketHistory.get(data.userId).size > 0;
    const isUserOnline = hasActiveSocket || hasAnySocket;
    
    
    if (isUserOnline) {
      // User is online - send immediately and request delivery confirmation
      io.to(`user_${data.userId}`).emit('new_notification', enhancedMessage);
      
      // Send immediate feedback to admin
      socket.emit('message_delivery_status', {
        messageId,
        userId: data.userId,
        status: 'sent',
        timestamp: new Date().toISOString(),
        message: `Message sent to online user (${hasAnySocket ? userSocketHistory.get(data.userId).size : 0} active connections)`
      });
      
      // Set timeout for delivery confirmation
      setTimeout(() => {
        socket.emit('message_delivery_timeout', {
          messageId,
          userId: data.userId,
          message: 'Delivery confirmation timeout - message may not have been received'
        });
      }, 10000); // 10 second timeout
      
    } else {
      // User is offline - queue the message
      if (!pendingMessages.has(data.userId)) {
        pendingMessages.set(data.userId, []);
      }
      pendingMessages.get(data.userId).push(enhancedMessage);
      
      socket.emit('message_delivery_status', {
        messageId,
        userId: data.userId,
        status: 'queued',
        timestamp: new Date().toISOString(),
        message: 'User is offline. Message queued for delivery when user comes online.'
      });
    }
  });
  
  // Send broadcast notification from admin panel
  socket.on('admin_broadcast_notification', (data) => {
    if (!data) return;
    
    // Global notification - broadcast to everyone
    io.emit('new_notification', data);
  });
  
  // Handle client delivery confirmation
  socket.on('message_received_confirmation', (data) => {
    if (data && data.messageId && data.adminSocketId) {
      // Forward confirmation to the admin who sent the message
      io.to(data.adminSocketId).emit('message_delivery_confirmed', {
        messageId: data.messageId,
        userId: data.userId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        message: 'Message successfully delivered and displayed to user'
      });
    }
  });
  
  socket.on('disconnect', async () => {
    
    // Clean up heartbeat interval
    if (socket.heartbeatInterval) {
      clearInterval(socket.heartbeatInterval);
    }
    
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      
      // Remove this specific socket from mappings
      connectedUsers.delete(socket.id);
      
      // Remove from socket history
      if (userSocketHistory.has(userId)) {
        userSocketHistory.get(userId).delete(socket.id);
        
        // If no more sockets for this user, clean up the history entry
        if (userSocketHistory.get(userId).size === 0) {
          userSocketHistory.delete(userId);
        }
      }
      
      // Only update user socket mapping if this was the active socket
      if (userSockets.get(userId) === socket.id) {
        
        // Check if user has other active sockets
        const remainingSockets = userSocketHistory.get(userId);
        if (remainingSockets && remainingSockets.size > 0) {
          // Promote another socket to be the active one
          const newActiveSocket = Array.from(remainingSockets)[remainingSockets.size - 1];
          userSockets.set(userId, newActiveSocket);
        } else {
          // No other sockets, remove user socket mapping
          userSockets.delete(userId);
        }
      } else {
      }
      
      // Update socket connection status in database (but keep user online)
      // Only update if this was the last socket
      const stillHasSockets = userSocketHistory.has(userId) && userSocketHistory.get(userId).size > 0;
      
      try {
        await User.findByIdAndUpdate(userId, {
          socketConnected: stillHasSockets,
          lastActive: new Date(),
          currentSocketId: stillHasSockets ? userSockets.get(userId) : null
        });
        
        if (stillHasSockets) {
        } else {
          
          // CRITICAL FIX: Emit status change event to update admin panel with multi-layer detection
          // Even though database keeps user as "online", the multi-layer detection should show offline
          const hasActiveSocket = userSockets.has(userId);
          const hasAnySocket = userSocketHistory.has(userId) && userSocketHistory.get(userId).size > 0;
          const isUserOnline = hasActiveSocket || hasAnySocket;
          
          
          const statusChangeEvent = {
            userId: userId,
            isOnline: isUserOnline, // Multi-layer detection result (should be false)
            hasActiveSocket: hasActiveSocket,
            hasAnySocket: hasAnySocket,
            socketCount: hasAnySocket ? userSocketHistory.get(userId).size : 0,
            activeSocketId: userSockets.get(userId) || null,
            dbIsOnline: true, // Database still shows online
            timestamp: new Date().toISOString(),
            source: 'socket_disconnect'
          };
          
          // Emit to all clients and admin room
          io.emit('user_status_change', statusChangeEvent);
          io.to('admin_room').emit('user_status_change', statusChangeEvent);
        }
      } catch (err) {
        console.error('❌ Error updating socket status:', err);
      }
    }
  });
});

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], // Client and Admin URLs with fallbacks
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on field name
    let uploadPath = 'uploads/';
    
    // Create specific folder for each file type
    if (file.fieldname === 'idCardFront') {
      uploadPath = 'uploads/_idCard_front/';
    } else if (file.fieldname === 'idCardBack') {
      uploadPath = 'uploads/_idCard_back/';
    } else if (file.fieldname === 'selfieWithId') {
      uploadPath = 'uploads/_idCard_selfie/';
    } else if (file.fieldname === 'signature') {
      uploadPath = 'uploads/_signature/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static('../uploads'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Loan Management System API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Mount specific file upload routes with middleware BEFORE general loan routes
app.post('/api/loans/id-verification', upload.fields([
  { name: 'idCardFront', maxCount: 1 },
  { name: 'idCardBack', maxCount: 1 },
  { name: 'selfieWithId', maxCount: 1 }
]), async (req, res, next) => {
  // Import the controller function
  const { saveIdVerification } = await import('./controllers/loanController.js');
  return saveIdVerification(req, res, next);
});

// Mount loan routes without file upload middleware after specific upload routes
app.use('/api/loans', loanRoutes);

// Logout API endpoint (fallback for when socket is unavailable)
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    
    // Update user status in database
    const updateResult = await User.findByIdAndUpdate(userId, {
      isOnline: false,
      socketConnected: false,
      lastActive: new Date(),
      lastSeen: new Date().toISOString()
    });
    
    if (updateResult) {
    } else {
    }
    
    // Clean up user tracking
    const socketId = userSockets.get(userId);
    if (socketId) {
      connectedUsers.delete(socketId);
      userSockets.delete(userId);
    }
    
    // Clean up socket history
    if (userSocketHistory.has(userId)) {
      userSocketHistory.delete(userId);
    }
    
    // Emit status change event for logout
    const statusChangeEvent = {
      userId: userId,
      isOnline: false,
      timestamp: new Date().toISOString(),
      source: 'api_logout'
    };
    
    io.emit('user_status_change', statusChangeEvent);
    
    // Also emit to admin room specifically
    io.to('admin_room').emit('user_status_change', statusChangeEvent);
    
    res.json({ success: true, message: 'User logged out successfully' });
  } catch (error) {
    console.error('❌ Error during API logout:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

app.use('/api/interest-rates', interestRateRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/public', publicRoutes); // Public routes for non-authenticated access
app.use('/api/notifications', notificationRoutes); // Notification routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid conflicts

httpServer.listen(PORT, () => {
});
