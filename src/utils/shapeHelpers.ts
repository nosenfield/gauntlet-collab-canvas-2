import { v4 as uuidv4 } from 'uuid';
import type { Rectangle, Shape } from '../types/shape';

export class ShapeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShapeValidationError';
  }
}

export const validateShapeDimensions = (
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number = 10000,
  canvasHeight: number = 10000
): void => {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
    throw new ShapeValidationError('All dimensions must be numbers');
  }

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
    throw new ShapeValidationError('Dimensions cannot be NaN');
  }

  if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
    throw new ShapeValidationError('Dimensions must be finite numbers');
  }

  if (width < 0 || height < 0) {
    throw new ShapeValidationError('Width and height must be non-negative');
  }

  if (width === 0 || height === 0) {
    throw new ShapeValidationError('Width and height must be greater than 0');
  }

  if (x < 0 || y < 0) {
    throw new ShapeValidationError('X and Y coordinates must be non-negative');
  }

  if (x + width > canvasWidth || y + height > canvasHeight) {
    throw new ShapeValidationError('Shape extends beyond canvas boundaries');
  }
};

export const createRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  userId: string,
  canvasWidth: number = 10000,
  canvasHeight: number = 10000,
  skipValidation: boolean = false
): Rectangle => {
  // Only validate if not skipping (for completed rectangles)
  if (!skipValidation) {
    validateShapeDimensions(x, y, width, height, canvasWidth, canvasHeight);
  }

  if (!fill || typeof fill !== 'string') {
    throw new ShapeValidationError('Fill color must be a non-empty string');
  }

  if (!userId || typeof userId !== 'string') {
    throw new ShapeValidationError('User ID must be a non-empty string');
  }

  return {
    id: uuidv4(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
  };
};

export const createInitialRectangle = (
  x: number,
  y: number,
  fill: string,
  userId: string,
  canvasWidth: number = 10000,
  canvasHeight: number = 10000
): Rectangle => {
  // Basic validation for initial rectangle (no width/height validation)
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new ShapeValidationError('X and Y coordinates must be numbers');
  }

  if (isNaN(x) || isNaN(y)) {
    throw new ShapeValidationError('Coordinates cannot be NaN');
  }

  if (!isFinite(x) || !isFinite(y)) {
    throw new ShapeValidationError('Coordinates must be finite numbers');
  }

  if (x < 0 || y < 0) {
    throw new ShapeValidationError('X and Y coordinates must be non-negative');
  }

  if (x >= canvasWidth || y >= canvasHeight) {
    throw new ShapeValidationError('Initial position must be within canvas boundaries');
  }

  if (!fill || typeof fill !== 'string') {
    throw new ShapeValidationError('Fill color must be a non-empty string');
  }

  if (!userId || typeof userId !== 'string') {
    throw new ShapeValidationError('User ID must be a non-empty string');
  }

  return {
    id: uuidv4(),
    type: 'rectangle',
    x,
    y,
    width: 0,
    height: 0,
    fill,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
  };
};

export const normalizeRect = (rect: Rectangle): Rectangle => {
  if (!rect || typeof rect !== 'object') {
    throw new ShapeValidationError('Invalid rectangle object');
  }

  const normalizedX = rect.width < 0 ? rect.x + rect.width : rect.x;
  const normalizedY = rect.height < 0 ? rect.y + rect.height : rect.y;
  const normalizedWidth = Math.abs(rect.width);
  const normalizedHeight = Math.abs(rect.height);

  return {
    ...rect,
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
    lastModified: Date.now(),
  };
};

export const constrainShapeToCanvas = (
  shape: Shape,
  canvasWidth: number,
  canvasHeight: number
): Shape => {
  if (!shape || typeof shape !== 'object') {
    throw new ShapeValidationError('Invalid shape object');
  }

  if (typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number') {
    throw new ShapeValidationError('Canvas dimensions must be numbers');
  }

  const constrainedX = Math.max(0, Math.min(canvasWidth - shape.width, shape.x));
  const constrainedY = Math.max(0, Math.min(canvasHeight - shape.height, shape.y));

  return {
    ...shape,
    x: constrainedX,
    y: constrainedY,
    lastModified: Date.now(),
  };
};

export const isShapeInCanvas = (
  shape: Shape,
  canvasWidth: number,
  canvasHeight: number
): boolean => {
  if (!shape || typeof shape !== 'object') {
    return false;
  }

  if (typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number') {
    return false;
  }

  return (
    shape.x >= 0 &&
    shape.y >= 0 &&
    shape.x + shape.width <= canvasWidth &&
    shape.y + shape.height <= canvasHeight
  );
};
