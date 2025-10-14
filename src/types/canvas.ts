export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasState {
  position: Point;
  scale: number;
  windowSize: Size;
}

export const CANVAS_WIDTH = 10000;
export const CANVAS_HEIGHT = 10000;
export const TOOLBAR_HEIGHT = 40;
