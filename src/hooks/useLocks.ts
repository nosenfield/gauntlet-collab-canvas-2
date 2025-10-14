import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';
import { rtdb } from '../services/firebase';

interface Lock {
  userId: string;
  timestamp: number;
  shapeId: string;
}

export const useLocks = (canvasId: string, currentUserId: string | null) => {
  const [locks, setLocks] = useState<Record<string, Lock>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const locksRef = ref(rtdb, `canvases/${canvasId}/locks`);
      
      const unsubscribe = onValue(locksRef, (snapshot) => {
        const data = snapshot.val();
        setLocks(data || {});
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Locks error:', err);
      setError(err instanceof Error ? err.message : 'Locks setup failed');
      setIsLoading(false);
    }
  }, [canvasId, currentUserId]);

  const acquireLock = async (shapeId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const lockRef = ref(rtdb, `canvases/${canvasId}/locks/${shapeId}`);
      
      // Check if shape is already locked
      const existingLock = locks[shapeId];
      if (existingLock && existingLock.userId !== currentUserId) {
        console.log(`Shape ${shapeId} is already locked by ${existingLock.userId}`);
        return false;
      }

      // Create lock
      const lock: Lock = {
        userId: currentUserId,
        timestamp: Date.now(),
        shapeId,
      };

      await set(lockRef, lock);
      
      // Set up auto-release on disconnect
      onDisconnect(lockRef).remove();
      
      console.log(`Lock acquired for shape ${shapeId} by user ${currentUserId}`);
      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  };

  const releaseLock = async (shapeId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const lockRef = ref(rtdb, `canvases/${canvasId}/locks/${shapeId}`);
      
      // Verify user owns the lock
      const existingLock = locks[shapeId];
      if (!existingLock || existingLock.userId !== currentUserId) {
        console.log(`User ${currentUserId} does not own lock for shape ${shapeId}`);
        return false;
      }

      await remove(lockRef);
      console.log(`Lock released for shape ${shapeId} by user ${currentUserId}`);
      return true;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  };

  const isLocked = (shapeId: string): boolean => {
    const lock = locks[shapeId];
    return lock && lock.userId !== currentUserId;
  };

  const isLockedByCurrentUser = (shapeId: string): boolean => {
    const lock = locks[shapeId];
    return lock && lock.userId === currentUserId;
  };

  const canLock = (shapeId: string): boolean => {
    const lock = locks[shapeId];
    return !lock || lock.userId === currentUserId;
  };

  const getCurrentUserLock = (): string | null => {
    for (const [shapeId, lock] of Object.entries(locks)) {
      if (lock.userId === currentUserId) {
        return shapeId;
      }
    }
    return null;
  };

  return {
    locks,
    isLoading,
    error,
    acquireLock,
    releaseLock,
    isLocked,
    isLockedByCurrentUser,
    canLock,
    getCurrentUserLock,
  };
};
