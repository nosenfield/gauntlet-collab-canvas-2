import { doc, setDoc, getDocs, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Shape } from '../types/shape';

export class ShapeServiceError extends Error {
  public code?: string;
  public originalError?: any;
  
  constructor(message: string, code?: string, originalError?: any) {
    super(message);
    this.name = 'ShapeServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const saveShape = async (shape: Shape, canvasId: string): Promise<void> => {
  try {
    // Validate shape data
    if (!shape.id || !shape.type || typeof shape.x !== 'number' || typeof shape.y !== 'number') {
      throw new ShapeServiceError('Invalid shape data provided');
    }

    if (shape.x < 0 || shape.y < 0 || shape.width < 0 || shape.height < 0) {
      throw new ShapeServiceError('Shape coordinates and dimensions must be non-negative');
    }

    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
    await setDoc(shapeRef, shape);
  } catch (error) {
    console.error('Error saving shape:', error);
    if (error instanceof ShapeServiceError) {
      throw error;
    }
    throw new ShapeServiceError('Failed to save shape', 'SAVE_ERROR', error);
  }
};

export const updateShape = async (shapeId: string, updates: Partial<Shape>, canvasId: string): Promise<void> => {
  try {
    // Validate updates
    if (updates.x !== undefined && updates.x < 0) {
      throw new ShapeServiceError('X coordinate must be non-negative');
    }
    if (updates.y !== undefined && updates.y < 0) {
      throw new ShapeServiceError('Y coordinate must be non-negative');
    }
    if (updates.width !== undefined && updates.width < 0) {
      throw new ShapeServiceError('Width must be non-negative');
    }
    if (updates.height !== undefined && updates.height < 0) {
      throw new ShapeServiceError('Height must be non-negative');
    }

    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
    await updateDoc(shapeRef, {
      ...updates,
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error updating shape:', error);
    if (error instanceof ShapeServiceError) {
      throw error;
    }
    throw new ShapeServiceError('Failed to update shape', 'UPDATE_ERROR', error);
  }
};

export const deleteShape = async (shapeId: string, canvasId: string): Promise<void> => {
  try {
    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw new ShapeServiceError('Failed to delete shape', 'DELETE_ERROR', error);
  }
};

export const clearAllShapes = async (canvasId: string): Promise<void> => {
  try {
    // Get all shapes first
    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    const querySnapshot = await getDocs(shapesRef);
    
    if (querySnapshot.empty) {
      return; // No shapes to delete
    }
    
    // Use batch delete for better performance
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error clearing all shapes:', error);
    throw new ShapeServiceError('Failed to clear all shapes', 'CLEAR_ERROR', error);
  }
};

export const getShapes = async (canvasId: string): Promise<Shape[]> => {
  try {
    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    const q = query(shapesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const shapes: Shape[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Shape;
      // Validate shape data
      if (data.id && data.type && typeof data.x === 'number' && typeof data.y === 'number') {
        shapes.push(data);
      } else {
        console.warn('Invalid shape data found:', data);
      }
    });
    
    return shapes;
  } catch (error) {
    console.error('Error getting shapes:', error);
    throw new ShapeServiceError('Failed to get shapes', 'GET_ERROR', error);
  }
};

export const subscribeToShapes = (
  canvasId: string,
  onShapesUpdate: (shapes: Shape[]) => void
): (() => void) => {
  try {
    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    const q = query(shapesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const shapes: Shape[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Shape;
        // Validate shape data
        if (data.id && data.type && typeof data.x === 'number' && typeof data.y === 'number') {
          shapes.push(data);
        } else {
          console.warn('Invalid shape data found:', data);
        }
      });
      onShapesUpdate(shapes);
    }, (error) => {
      console.error('Shapes subscription error:', error);
      throw new ShapeServiceError('Failed to subscribe to shapes', 'SUBSCRIBE_ERROR', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to shapes:', error);
    return () => {};
  }
};
