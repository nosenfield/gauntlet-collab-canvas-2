import { useState } from 'react';
import { ref, set, remove } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { rtdb, db } from '../services/firebase';
import type { Shape } from '../types/shape';
import { constrainShapeToCanvas } from '../utils/shapeHelpers';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types/canvas';

export const useShapeDragging = (canvasId: string, userId: string | null) => {
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const startDrag = async (shapeId: string, x: number, y: number) => {
    if (!userId) return;

    try {
      // Save drag position to Realtime DB for real-time sync
      const dragRef = ref(rtdb, `canvases/${canvasId}/drag-positions/${userId}`);
      await set(dragRef, {
        shapeId,
        x,
        y,
        timestamp: Date.now(),
      });

      setDraggedShapeId(shapeId);
      setDragPosition({ x, y });
    } catch (error) {
      console.error('Error starting drag:', error);
    }
  };

  const updateDrag = async (shapeId: string, x: number, y: number) => {
    if (!userId || draggedShapeId !== shapeId) return;

    // Constrain to canvas boundaries
    const constrainedPos = constrainShapeToCanvas(
      { id: shapeId, type: 'rectangle', x, y, width: 0, height: 0, fill: '', createdBy: '', createdAt: 0, lastModified: 0 },
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    try {
      // Update drag position in Realtime DB
      const dragRef = ref(rtdb, `canvases/${canvasId}/drag-positions/${userId}`);
      await set(dragRef, {
        shapeId,
        x: constrainedPos.x,
        y: constrainedPos.y,
        timestamp: Date.now(),
      });

      setDragPosition({ x: constrainedPos.x, y: constrainedPos.y });
    } catch (error) {
      console.error('Error updating drag:', error);
    }
  };

  const endDrag = async (shapeId: string, x: number, y: number) => {
    if (!userId || draggedShapeId !== shapeId) return;

    try {
      // Constrain final position
      const constrainedPos = constrainShapeToCanvas(
        { id: shapeId, type: 'rectangle', x, y, width: 0, height: 0, fill: '', createdBy: '', createdAt: 0, lastModified: 0 },
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      // Update shape position in Firestore
      const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
      await updateDoc(shapeRef, {
        x: constrainedPos.x,
        y: constrainedPos.y,
        lastModified: Date.now(),
      });

      // Remove drag position from Realtime DB
      const dragRef = ref(rtdb, `canvases/${canvasId}/drag-positions/${userId}`);
      await remove(dragRef);

      setDraggedShapeId(null);
      setDragPosition(null);
    } catch (error) {
      console.error('Error ending drag:', error);
    }
  };

  return {
    draggedShapeId,
    dragPosition,
    startDrag,
    updateDrag,
    endDrag,
  };
};
