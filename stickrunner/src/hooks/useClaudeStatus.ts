import { useState, useEffect, useRef } from 'react';

interface ClaudeStatus {
  state: 'idle' | 'working' | 'tool-executing';
  lastUpdate: number;
  timestamp: number;
}

interface UseClaudeStatusResult {
  status: ClaudeStatus | null;
  isConnected: boolean;
  error: string | null;
}

export function useClaudeStatus(serverPort: number = 3001, pollInterval: number = 1000): UseClaudeStatusResult {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const serverUrl = `http://localhost:${serverPort}`;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${serverUrl}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ClaudeStatus = await response.json();
        setStatus(data);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsConnected(false);
        console.warn(`[useClaudeStatus] Failed to fetch status: ${errorMessage}`);
      }
    };

    const startPolling = () => {
      fetchStatus();
      intervalRef.current = window.setInterval(fetchStatus, pollInterval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    return () => {
      stopPolling();
    };
  }, [serverPort, pollInterval]);

  return {
    status,
    isConnected,
    error,
  };
}