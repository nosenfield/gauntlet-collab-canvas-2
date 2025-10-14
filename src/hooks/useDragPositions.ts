import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';

interface DragPosition {
  shapeId: string;
  x: number;
  y: number;
  timestamp: number;
}

export const useDragPositions = (canvasId: string, currentUserId: string | null) => {
  const [dragPositions, setDragPositions] = useState<Record<string, DragPosition>>({});
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

      const dragPositionsRef = ref(rtdb, `canvases/${canvasId}/drag-positions`);
      
      const unsubscribe = onValue(dragPositionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filter out current user's drag position
          const filteredData: Record<string, DragPosition> = {};
          Object.entries(data).forEach(([userId, position]) => {
            if (userId !== currentUserId) {
              filteredData[userId] = position as DragPosition;
            }
          });
          setDragPositions(filteredData);
        } else {
          setDragPositions({});
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Drag positions error:', err);
      setError(err instanceof Error ? err.message : 'Drag positions setup failed');
      setIsLoading(false);
    }
  }, [canvasId, currentUserId]);

  return { dragPositions, isLoading, error };
};
