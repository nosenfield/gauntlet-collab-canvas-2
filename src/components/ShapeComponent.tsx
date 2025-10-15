import React from 'react';
import { Rect } from 'react-konva';
import type { Shape } from '../types/shape';
import type { Point } from '../types/canvas';
import { constrainShapeToCanvas } from '../utils/shapeHelpers';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types/canvas';

interface ShapeComponentProps {
  shape: Shape;
  isLocked?: boolean;
  isLockedByCurrentUser?: boolean;
  isDrawMode?: boolean;
  stagePos?: Point;
  stageScale?: number;
  onDragStart?: (shapeId: string) => void;
  onDragMove?: (shapeId: string, x: number, y: number, width: number, height: number) => void;
  onDragEnd?: (shapeId: string, x: number, y: number, width: number, height: number) => void;
  onCursorUpdate?: (x: number, y: number) => void;
}

const ShapeComponent: React.FC<ShapeComponentProps> = ({ 
  shape, 
  isLocked = false,
  isLockedByCurrentUser = false,
  isDrawMode = false,
  stagePos,
  stageScale,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCursorUpdate
}) => {
  if (shape.type === 'rectangle') {
    // Determine visual styling based on lock status
    const strokeColor = isLocked ? '#ff0000' : '#000';
    const strokeWidth = isLocked ? 3 : 1;
    const isDraggable = !isLocked && !isDrawMode; // Only allow dragging if not locked by another user and not in draw mode
    
    // Optional: Add visual indicator for shapes locked by current user
    const opacity = isLockedByCurrentUser ? 0.9 : 1.0;
    
    return (
      <Rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        opacity={opacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        draggable={isDraggable}
        onDragStart={() => onDragStart?.(shape.id)}
        onDragMove={(e) => {
          const newX = e.target.x();
          const newY = e.target.y();

          // Constrain the shape to the canvas boundaries
          const constrainedPos = constrainShapeToCanvas(
            { ...shape, x: newX, y: newY },
            CANVAS_WIDTH,
            CANVAS_HEIGHT
          );

          e.target.x(constrainedPos.x);
          e.target.y(constrainedPos.y);

          onDragMove?.(shape.id, constrainedPos.x, constrainedPos.y, shape.width, shape.height);
          
          // Update cursor position during drag
          if (onCursorUpdate && stagePos && stageScale) {
            const stage = e.target.getStage();
            if (stage) {
              const pointerPos = stage.getPointerPosition();
              if (pointerPos) {
                // Convert to canvas coordinates
                const x = (pointerPos.x - stagePos.x) / stageScale;
                const y = (pointerPos.y - stagePos.y) / stageScale;
                onCursorUpdate(x, y);
              }
            }
          }
        }}
        onDragEnd={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          onDragEnd?.(shape.id, x, y, shape.width, shape.height);
        }}
      />
    );
  }
  
  return null;
};

export default ShapeComponent;
