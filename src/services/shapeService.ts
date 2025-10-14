import { doc, setDoc, getDocs, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Shape } from '../types/shape';

export const saveShape = async (shape: Shape, canvasId: string): Promise<void> => {
  try {
    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
    await setDoc(shapeRef, shape);
  } catch (error) {
    console.error('Error saving shape:', error);
    throw error;
  }
};

export const getShapes = async (canvasId: string): Promise<Shape[]> => {
  try {
    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    const q = query(shapesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const shapes: Shape[] = [];
    querySnapshot.forEach((doc) => {
      shapes.push(doc.data() as Shape);
    });
    
    return shapes;
  } catch (error) {
    console.error('Error getting shapes:', error);
    throw error;
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
        shapes.push(doc.data() as Shape);
      });
      onShapesUpdate(shapes);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to shapes:', error);
    return () => {};
  }
};
