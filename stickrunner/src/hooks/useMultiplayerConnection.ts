import { useEffect, useRef, useState, useCallback } from 'react';

interface MultiplayerMessage {
  type: string;
  data: any;
  username?: string;
}

interface RegisterData {
  username: string;
}

interface ResponseData {
  username: string;
  message: string;
}

interface UseMultiplayerConnectionProps {
  serverUrl: string;
  username: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onRegistered?: (data: ResponseData) => void;
  onError?: (error: string) => void;
}

export const useMultiplayerConnection = ({
  serverUrl,
  username,
  onConnected,
  onDisconnected,
  onRegistered,
  onError,
}: UseMultiplayerConnectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'registered'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      ws.current = new WebSocket(serverUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        onConnected?.();
        
        // Auto-register with username if provided
        if (username) {
          register(username);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: MultiplayerMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsRegistered(false);
        setConnectionStatus('disconnected');
        onDisconnected?.();

        // Auto-reconnect after 3 seconds if not intentionally closed
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.('Connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
      onError?.('Failed to connect');
    }
  }, [serverUrl, username, onConnected, onDisconnected, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Intentional disconnect');
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: MultiplayerMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const register = useCallback((usernameToRegister: string) => {
    const registerMessage: MultiplayerMessage = {
      type: 'register',
      data: {
        username: usernameToRegister,
      } as RegisterData,
    };
    sendMessage(registerMessage);
  }, [sendMessage]);

  const handleMessage = useCallback((message: MultiplayerMessage) => {
    switch (message.type) {
      case 'response':
        const responseData = message.data as ResponseData;
        console.log('Registration successful:', responseData.message);
        setIsRegistered(true);
        setConnectionStatus('registered');
        onRegistered?.(responseData);
        break;

      case 'error':
        const errorMessage = message.data?.message || 'Unknown error';
        console.error('Server error:', errorMessage);
        onError?.(errorMessage);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [onRegistered, onError]);

  // Connect on mount only when username is available
  useEffect(() => {
    if (username && username.trim()) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [username]); // Remove connect and disconnect from deps to avoid loops

  // Reconnect when username changes
  useEffect(() => {
    if (isConnected && username && !isRegistered) {
      register(username);
    }
  }, [username, isConnected, isRegistered, register]);

  return {
    isConnected,
    isRegistered,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    register,
  };
};