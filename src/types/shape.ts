export interface BaseShape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
}

export interface Rectangle extends BaseShape {
  type: 'rectangle';
}

export type Shape = Rectangle;

export interface TempShape extends Shape {
  isInProgress: boolean;
  userId: string;
}

/**
 * ShapeLock interface for Task 3.8 (Object Locking System)
 * Currently unused - will be implemented in Task 3.8
 */
export interface ShapeLock {
  userId: string;
  timestamp: number;
  shapeId: string;
}
