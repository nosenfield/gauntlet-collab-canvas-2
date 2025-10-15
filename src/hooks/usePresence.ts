import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, set, onValue, onDisconnect, remove, serverTimestamp, update } from 'firebase/database';
import { rtdb } from '../services/firebase';
import type { PresenceData, PresenceState } from '../types/presence';

// Generate a unique session ID for this tab/window
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const usePresence = (
  userId: string | null,
  userColor: string,
  canvasId: string = 'default'
): PresenceState & { updateCursor: (x: number, y: number) => void } => {
  const [otherUsers, setOtherUsers] = useState<PresenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Function to update cursor position for this session
  const updateCursor = useCallback((x: number, y: number) => {
    if (!userId || !sessionIdRef.current) return;
    
    const sessionRef = ref(rtdb, `canvases/${canvasId}/presence/${userId}/sessions/${sessionIdRef.current}`);
    update(sessionRef, { 
      cursor: { x, y },
      timestamp: serverTimestamp()
    }).catch((error) => {
      console.error('Failed to update cursor position:', error);
    });
  }, [userId, canvasId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Generate unique session ID for this tab
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      const sessionRef = ref(rtdb, `canvases/${canvasId}/presence/${userId}/sessions/${sessionId}`);

      // Set initial presence for this session
      set(sessionRef, {
        userId,
        color: userColor,
        cursor: { x: 0, y: 0 },
        timestamp: serverTimestamp(),
        isActive: true,
        sessionId,
      });

      // Set up onDisconnect to remove only this session when tab closes
      onDisconnect(sessionRef).remove();

      // Listen to all presence updates
      const allPresenceRef = ref(rtdb, `canvases/${canvasId}/presence`);
      const unsubscribe = onValue(allPresenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Group sessions by userId and create presence data
          const userSessions: { [userId: string]: any[] } = {};
          
          Object.values(data).forEach((userData: any) => {
            if (userData.sessions) {
              Object.values(userData.sessions).forEach((session: any) => {
                if (session.isActive && session.userId !== userId) {
                  if (!userSessions[session.userId]) {
                    userSessions[session.userId] = [];
                  }
                  userSessions[session.userId].push(session);
                }
              });
            }
          });

          // Convert to PresenceData array - one entry per user (not per session)
          const users = Object.entries(userSessions).map(([userId, sessions]) => {
            // Use the most recent session's cursor position
            const latestSession = sessions.reduce((latest, current) => 
              current.timestamp > latest.timestamp ? current : latest
            );
            
            return {
              userId,
              color: latestSession.color,
              cursor: latestSession.cursor || { x: 0, y: 0 },
              timestamp: latestSession.timestamp || Date.now(),
              isActive: true,
            };
          }) as PresenceData[];

          setOtherUsers(users);
        } else {
          setOtherUsers([]);
        }
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        // Only remove this specific session, not all sessions for the user
        if (sessionIdRef.current) {
          remove(sessionRef).catch(console.error);
        }
      };
    } catch (err) {
      console.error('Presence error:', err);
      setError(err instanceof Error ? err.message : 'Presence setup failed');
      setIsLoading(false);
    }
  }, [userId, userColor, canvasId]);

  return { otherUsers, isLoading, error, updateCursor };
};
