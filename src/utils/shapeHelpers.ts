import { v4 as uuidv4 } from 'uuid';
import type { Rectangle, Shape } from '../types/shape';

export const createRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  userId: string
): Rectangle => {
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

export const normalizeRect = (rect: Rectangle): Rectangle => {
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
  return (
    shape.x >= 0 &&
    shape.y >= 0 &&
    shape.x + shape.width <= canvasWidth &&
    shape.y + shape.height <= canvasHeight
  );
};
