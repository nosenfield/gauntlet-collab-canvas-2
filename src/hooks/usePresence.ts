import { useState, useEffect } from 'react';
import { ref, set, onValue, onDisconnect, remove, serverTimestamp } from 'firebase/database';
import { rtdb } from '../services/firebase';
import type { PresenceData, PresenceState } from '../types/presence';
import type { Point } from '../types/canvas';

export const usePresence = (
  userId: string | null,
  userColor: string,
  canvasId: string = 'default'
): PresenceState => {
  const [otherUsers, setOtherUsers] = useState<PresenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const presenceRef = ref(rtdb, `canvases/${canvasId}/presence/${userId}`);

      // Set initial presence
      set(presenceRef, {
        userId,
        color: userColor,
        cursor: { x: 0, y: 0 },
        timestamp: serverTimestamp(),
        isActive: true,
      });

      // Set up onDisconnect to remove presence when user leaves
      onDisconnect(presenceRef).remove();

      // Listen to all presence updates
      const allPresenceRef = ref(rtdb, `canvases/${canvasId}/presence`);
      const unsubscribe = onValue(allPresenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const users = Object.values(data)
            .filter((u: any) => u.userId !== userId && u.isActive)
            .map((u: any) => ({
              userId: u.userId,
              color: u.color,
              cursor: u.cursor || { x: 0, y: 0 },
              timestamp: u.timestamp || Date.now(),
              isActive: u.isActive || false,
            })) as PresenceData[];

          setOtherUsers(users);
        } else {
          setOtherUsers([]);
        }
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        remove(presenceRef).catch(console.error);
      };
    } catch (err) {
      console.error('Presence error:', err);
      setError(err instanceof Error ? err.message : 'Presence setup failed');
      setIsLoading(false);
    }
  }, [userId, userColor, canvasId]);

  return { otherUsers, isLoading, error };
};
