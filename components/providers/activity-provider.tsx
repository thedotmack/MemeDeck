"use client"

import type { ActivityToken, ConnectionState } from '@/lib/jupiter/realtime/activity-websocket';
import { initializeActivityWebSocket } from '@/lib/jupiter/realtime/activity-websocket';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';

interface ActivityProviderProps {
  children: React.ReactNode;
}

export function ActivityProvider({ children }: ActivityProviderProps) {
  
  const updateActivityTokens = useStore.use.updateActivityTokens();
  const setConnectionState = useStore.use.setConnectionState();
  const setActivityError = useStore.use.setActivityError();

  useEffect(() => {
    
    
    const { cleanup } = initializeActivityWebSocket({
      onTokenUpdate: (tokens: ActivityToken[]) => {
        updateActivityTokens(tokens);
      },
      onConnectionChange: (state: ConnectionState) => {
        setConnectionState(state);
      },
      onError: (error: string) => {
        setActivityError(error);
      }
    });
    
    return cleanup;
  }, [updateActivityTokens, setConnectionState, setActivityError]);
  
  return <>{children}</>;
}