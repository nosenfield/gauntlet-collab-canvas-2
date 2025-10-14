import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const CANVAS_ID = 'default-canvas';

export interface CanvasMetadata {
  id: string;
  createdAt: any; // serverTimestamp
  lastModified: any; // serverTimestamp
}

export class CanvasServiceError extends Error {
  public code?: string;
  public originalError?: any;
  
  constructor(message: string, code?: string, originalError?: any) {
    super(message);
    this.name = 'CanvasServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const initializeCanvas = async (): Promise<string> => {
  try {
    const canvasRef = doc(db, 'canvases', CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      console.log('Creating new canvas document...');
      await setDoc(canvasRef, {
        id: CANVAS_ID,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      });
      console.log('Canvas document created successfully');
    } else {
      console.log('Canvas document already exists');
    }
    
    return CANVAS_ID;
  } catch (error) {
    console.error('Error initializing canvas:', error);
    throw new CanvasServiceError('Failed to initialize canvas', 'INIT_ERROR', error);
  }
};

export const getCanvasId = (): string => {
  return CANVAS_ID;
};
