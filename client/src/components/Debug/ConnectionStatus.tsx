import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';

interface ConnectionStatusData {
  connected: boolean;
  socketId?: string;
  timestamp?: string;
  transport?: string;
  serverUrl?: string;
  reason?: string;
  error?: string;
  attempts?: number;
  reconnected?: boolean;
}

const ConnectionStatus: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatusData>({
    connected: false
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Get initial status
    const initialStatus = socketService.getConnectionStatus();
    setStatus({
      connected: initialStatus.connected,
      socketId: initialStatus.socketId,
      serverUrl: initialStatus.serverUrl,
      transport: initialStatus.transport
    });

    // Listen for status updates
    const handleStatusUpdate = (event: CustomEvent) => {
      const newStatus = event.detail;
      setStatus(newStatus);
      setLastUpdate(new Date().toLocaleTimeString());
    };

    window.addEventListener('socketStatusUpdate', handleStatusUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('socketStatusUpdate', handleStatusUpdate as EventListener);
    };
  }, []);

  const getStatusColor = () => {
    if (status.connected) {
      return status.reconnected ? 'bg-yellow-500' : 'bg-green-500';
    }
    
    // Handle disconnected states based on authentication
    if (!user && !isLoading) {
      return 'bg-gray-500'; // Gray for not authenticated
    }
    if (isLoading) {
      return 'bg-blue-500'; // Blue for loading
    }
    return status.error ? 'bg-red-500' : 'bg-orange-500';
  };

  const getStatusText = () => {
    if (status.connected) {
      return status.reconnected ? 'RECONNECTED' : 'CONNECTED';
    }
    
    // Handle specific disconnect reasons
    if (status.reason === 'not_authenticated') {
      return 'NOT AUTHENTICATED';
    }
    if (status.reason === 'user_logout') {
      return 'LOGGED OUT';
    }
    
    // Handle disconnected states based on authentication
    if (!user && !isLoading) {
      return 'NOT AUTHENTICATED';
    }
    if (isLoading) {
      return 'LOADING...';
    }
    return status.error ? 'ERROR' : 'DISCONNECTED';
  };

  const getStatusIcon = () => {
    if (status.connected) {
      return status.reconnected ? '🔄' : '✅';
    }
    
    // Handle disconnected states based on authentication
    if (!user && !isLoading) {
      return '👤'; // User icon for not authenticated
    }
    if (isLoading) {
      return '⏳'; // Hourglass for loading
    }
    return status.error ? '❌' : '⚠️';
  };

  return (
    <div className="fixed top-20 left-4 z-50 max-w-sm">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-semibold text-gray-800">
              Socket {getStatusText()}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          {status.socketId && (
            <div>
              <span className="font-medium">ID:</span> 
              <code className="ml-1 px-1 bg-gray-100 rounded text-xs">
                {status.socketId.substring(0, 8)}...
              </code>
            </div>
          )}
          
          {status.transport && (
            <div>
              <span className="font-medium">Transport:</span> 
              <span className="ml-1 capitalize">{status.transport}</span>
            </div>
          )}
          
          {status.serverUrl && (
            <div>
              <span className="font-medium">Server:</span> 
              <code className="ml-1 px-1 bg-gray-100 rounded text-xs">
                {status.serverUrl.replace('http://', '').replace('https://', '')}
              </code>
            </div>
          )}
          
          {status.reason && (
            <div>
              <span className="font-medium text-orange-600">Reason:</span> 
              <span className="ml-1">{status.reason}</span>
            </div>
          )}
          
          {status.error && (
            <div>
              <span className="font-medium text-red-600">Error:</span> 
              <span className="ml-1 text-red-600">{status.error}</span>
            </div>
          )}
          
          {status.attempts && status.attempts > 0 && (
            <div>
              <span className="font-medium text-blue-600">Attempts:</span> 
              <span className="ml-1">{status.attempts}</span>
            </div>
          )}
          
          {status.timestamp && (
            <div>
              <span className="font-medium">Updated:</span> 
              <span className="ml-1">{new Date(status.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
          
          {lastUpdate && (
            <div className="text-xs text-gray-500 pt-1 border-t">
              Last UI update: {lastUpdate}
            </div>
          )}
        </div>
        
        {/* Manual refresh button for testing */}
        <button
          onClick={() => {
            const currentStatus = socketService.getConnectionStatus();
            setStatus({
              connected: currentStatus.connected,
              socketId: currentStatus.socketId,
              serverUrl: currentStatus.serverUrl,
              transport: currentStatus.transport
            });
            setLastUpdate(new Date().toLocaleTimeString());
          }}
          className="mt-3 w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
