import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { rtdb } from '../services/firebase';
import type { TempShape } from '../types/shape';

export const useTempShapes = (canvasId: string, currentUserId: string | null) => {
  const [tempShapes, setTempShapes] = useState<TempShape[]>([]);
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

      const tempShapesRef = ref(rtdb, `canvases/${canvasId}/temp-shapes`);
      
      const unsubscribe = onValue(tempShapesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const shapes = Object.values(data)
            .filter((s: any) => s.userId !== currentUserId && s.isInProgress)
            .map((s: any) => ({
              id: s.id,
              type: s.type,
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
              fill: s.fill,
              createdBy: s.createdBy,
              createdAt: s.createdAt,
              lastModified: s.lastModified,
              isInProgress: s.isInProgress,
              userId: s.userId,
            })) as TempShape[];

          setTempShapes(shapes);
        } else {
          setTempShapes([]);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Temp shapes error:', err);
      setError(err instanceof Error ? err.message : 'Temp shapes setup failed');
      setIsLoading(false);
    }
  }, [canvasId, currentUserId]);

  const saveTempShape = async (shape: TempShape) => {
    if (!currentUserId) return;
    
    try {
      const tempShapeRef = ref(rtdb, `canvases/${canvasId}/temp-shapes/${currentUserId}`);
      await set(tempShapeRef, shape);
    } catch (err) {
      console.error('Error saving temp shape:', err);
    }
  };

  const removeTempShape = async () => {
    if (!currentUserId) return;
    
    try {
      const tempShapeRef = ref(rtdb, `canvases/${canvasId}/temp-shapes/${currentUserId}`);
      await remove(tempShapeRef);
    } catch (err) {
      console.error('Error removing temp shape:', err);
    }
  };

  return { tempShapes, isLoading, error, saveTempShape, removeTempShape };
};
