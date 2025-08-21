import React, { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import notificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationToast component to handle toast notifications
 * This component sets up the toast container and connects to the notification service
 */
const NotificationToast: React.FC = () => {
  const { user } = useAuth();

  // Test function to show a toast - can be triggered from browser console
  // @ts-ignore - add to window for debugging
  window.testToast = () => {
    toast.success('This is a test notification');
    toast('Default toast', {
      duration: 4000,
      style: {
        backgroundColor: '#E0F2FE',
        border: '1px solid #0EA5E9',
        color: '#0C4A6E'
      }
    });
  };

  useEffect(() => {
    // When user logs in, identify them to the socket service
    if (user?.id) {
      notificationService.identifyUser(user.id);
    }
    
    // Show a test toast when component mounts
    setTimeout(() => {
      toast.success('NotificationToast component mounted');
    }, 1000);
    
    return () => {
      // Cleanup will be handled by the notification service when user logs out
    };
  }, [user?.id]);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName="notification-toaster"
      containerStyle={{
        top: 70, // Leave space for header
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 5000,
        style: {
          background: '#fff',
          color: '#363636',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
        },
      }}
    />
  );
};

export default NotificationToast;
