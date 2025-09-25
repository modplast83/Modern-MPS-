import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ProductionSSEEvent {
  type: 'film' | 'printing' | 'cutting' | 'all';
  timestamp: string;
  queues: string[];
}

export function useProductionSSE() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const handleProductionUpdate = useCallback((event: MessageEvent) => {
    try {
      const data: ProductionSSEEvent = JSON.parse(event.data);
      
      console.log('[ProductionSSE] Received production update:', data);
      
      // Invalidate relevant queries based on the update type
      const queriesToInvalidate = [];
      
      if (data.type === 'all' || data.queues.includes('film')) {
        queriesToInvalidate.push(
          ['/api/production/film-queue'],
          ['/api/production/hierarchical-orders']
        );
      }
      
      if (data.type === 'all' || data.queues.includes('printing')) {
        queriesToInvalidate.push(['/api/production/printing-queue']);
      }
      
      if (data.type === 'all' || data.queues.includes('cutting')) {
        queriesToInvalidate.push(
          ['/api/production/cutting-queue'],
          ['/api/production/grouped-cutting-queue']
        );
      }
      
      // Invalidate all relevant queries
      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
    } catch (error) {
      console.error('[ProductionSSE] Error parsing production update:', error);
    }
  }, [queryClient]);

  const connect = useCallback(() => {
    if (eventSourceRef.current || isConnectedRef.current) {
      return; // Already connected or connecting
    }

    try {
      console.log('[ProductionSSE] Connecting to production updates stream...');
      
      const eventSource = new EventSource('/api/notifications/stream');
      // Removed withCredentials to avoid CORS issues with wildcard origin
      
      eventSource.addEventListener('production_update', handleProductionUpdate);
      
      eventSource.onopen = () => {
        console.log('[ProductionSSE] Connected to production updates stream');
        isConnectedRef.current = true;
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('[ProductionSSE] Connection error:', error);
        isConnectedRef.current = false;
        
        // Close current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt to reconnect after 5 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[ProductionSSE] Attempting to reconnect...');
            connect();
          }, 5000);
        }
      };
      
      eventSourceRef.current = eventSource;
      
    } catch (error) {
      console.error('[ProductionSSE] Failed to establish connection:', error);
      isConnectedRef.current = false;
    }
  }, [handleProductionUpdate]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[ProductionSSE] Disconnecting from production updates stream');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    isConnectedRef.current = false;
  }, []);

  // Manual refresh function for user-triggered updates
  const refreshProductionData = useCallback(() => {
    console.log('[ProductionSSE] Manual refresh triggered');
    
    // Invalidate all production-related queries
    const productionQueries = [
      ['/api/production/film-queue'],
      ['/api/production/printing-queue'],
      ['/api/production/cutting-queue'],
      ['/api/production/grouped-cutting-queue'],
      ['/api/production/hierarchical-orders']
    ];
    
    productionQueries.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);

  useEffect(() => {
    // Connect when hook is first used
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    refreshProductionData
  };
}