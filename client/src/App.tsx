import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/socket-debug.css';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import AuthPage from './pages/AuthPage';
import ApplicationPage from './pages/ApplicationPage';
import AgreementPage from './pages/AgreementPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import socketService from './services/socketService';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import './styles/animations.css';

// Component to handle socket identification on every render when user is logged in
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Always connect socket on page load and authenticate if userId exists in localStorage
  useEffect(() => {
    
    // Always connect socket first
    socketService.connect();
    
    // Check for existing userId in localStorage (multiple keys for robustness)
    const storedUserId = localStorage.getItem('userId') || 
                        localStorage.getItem('user')?.match(/"id":"([^"]+)"/)?.[1] ||
                        localStorage.getItem('userData')?.match(/"id":"([^"]+)"/)?.[1];
    
    if (storedUserId) {
      
      // IMMEDIATE socket connection and identification - NO DELAYS
      const ensureInstantReconnection = () => {
        // Step 1: Ensure socket is connected
        if (!socketService.isConnected()) {
          socketService.connect();
        }
        
        // Step 2: IMMEDIATELY attempt identification (don't wait for connection)
        socketService.identifyUser(storedUserId);
        
        // Step 3: Aggressive retry mechanism with NO delays for first few attempts
        let attemptCount = 0;
        const maxAttempts = 20;
        
        const aggressiveRetry = () => {
          attemptCount++;
          
          if (attemptCount > maxAttempts) {
            console.error(`💥 CRITICAL FAILURE: Could not reconnect user after ${maxAttempts} attempts:`, storedUserId);
            return;
          }
          
          // For first 10 attempts: NO delay (immediate retry)
          // For attempts 11-20: minimal 100ms delay
          const delay = attemptCount <= 10 ? 0 : 100;
          
          setTimeout(() => {
            if (!socketService.isConnected()) {
              socketService.connect();
              socketService.identifyUser(storedUserId);
              aggressiveRetry();
            } else {
              // Double-check identification
              socketService.identifyUser(storedUserId);
            }
          }, delay);
        };
        
        // Start aggressive retry immediately
        aggressiveRetry();
        
        // Step 4: Backup mechanism - force identification every 500ms for first 5 seconds
        const backupInterval = setInterval(() => {
          if (socketService.isConnected()) {
            socketService.identifyUser(storedUserId);
          }
        }, 500);
        
        // Clear backup after 5 seconds
        setTimeout(() => {
          clearInterval(backupInterval);
        }, 5000);
      };
      
      // Execute immediately with no delays
      ensureInstantReconnection();
    } else {
    }
  }, []); // Run once on mount
  
  // Handle additional user identification when React auth state loads
  useEffect(() => {
    if (user?.id && !isLoading) {
      // Ensure the user is identified (this will be a no-op if already identified)
      socketService.identifyUser(user.id);
    } else if (!user && !isLoading) {
      // React auth confirms no user is logged in - disconnect socket
      socketService.disconnectUnauthenticated();
    }
  }, [user, isLoading]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PWAInstallPrompt />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/apply" 
            element={
              <ProtectedRoute>
                <ApplicationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agreement" 
            element={
              <ProtectedRoute>
                <AgreementPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;