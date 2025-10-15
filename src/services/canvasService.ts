import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Determine canvas ID based on environment
const determineCanvasId = (): string => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || 
                       import.meta.env.MODE === 'development' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
  
  if (isDevelopment) {
    return 'dev-canvas';
  } else {
    return 'prod-canvas';
  }
};

const CANVAS_ID = determineCanvasId();

// Log the canvas ID being used for debugging
console.log(`Canvas ID determined: ${CANVAS_ID} (Environment: ${import.meta.env.DEV ? 'development' : 'production'})`);

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
