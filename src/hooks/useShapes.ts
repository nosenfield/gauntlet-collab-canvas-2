import { useState, useEffect, useCallback } from 'react';
import { saveShape, subscribeToShapes, clearAllShapes } from '../services/shapeService';
import type { Shape } from '../types/shape';

export const useShapes = (canvasId: string) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShapesUpdate = useCallback((newShapes: Shape[]) => {
    setShapes(newShapes);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      const unsubscribe = subscribeToShapes(canvasId, handleShapesUpdate);

      return () => unsubscribe();
    } catch (err) {
      console.error('Shapes subscription error:', err);
      setError(err instanceof Error ? err.message : 'Shapes subscription failed');
      setIsLoading(false);
    }
  }, [canvasId, handleShapesUpdate]);

  const addShape = useCallback(async (shape: Shape): Promise<void> => {
    try {
      await saveShape(shape, canvasId);
      // Optimistic update - shape will be added via subscription
    } catch (err) {
      console.error('Error adding shape:', err);
      throw err;
    }
  }, [canvasId]);

  const clearAll = useCallback(async (): Promise<void> => {
    try {
      await clearAllShapes(canvasId);
      // Shapes will be cleared via subscription
    } catch (err) {
      console.error('Error clearing all shapes:', err);
      throw err;
    }
  }, [canvasId]);

  return { shapes, isLoading, error, addShape, clearAll };
};
