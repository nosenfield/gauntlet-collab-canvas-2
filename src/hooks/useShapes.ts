import { useState, useEffect } from 'react';
import { saveShape, subscribeToShapes } from '../services/shapeService';
import type { Shape } from '../types/shape';

export const useShapes = (canvasId: string) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      const unsubscribe = subscribeToShapes(canvasId, (newShapes) => {
        setShapes(newShapes);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Shapes subscription error:', err);
      setError(err instanceof Error ? err.message : 'Shapes subscription failed');
      setIsLoading(false);
    }
  }, [canvasId]);

  const addShape = async (shape: Shape): Promise<void> => {
    try {
      await saveShape(shape, canvasId);
      // Optimistic update - shape will be added via subscription
    } catch (err) {
      console.error('Error adding shape:', err);
      throw err;
    }
  };

  return { shapes, isLoading, error, addShape };
};
