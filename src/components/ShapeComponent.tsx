import React from 'react';
import { Rect } from 'react-konva';
import type { Shape } from '../types/shape';

interface ShapeComponentProps {
  shape: Shape;
  isLocked?: boolean;
  onDragStart?: (shapeId: string) => void;
  onDragMove?: (shapeId: string, x: number, y: number) => void;
  onDragEnd?: (shapeId: string, x: number, y: number) => void;
}

const ShapeComponent: React.FC<ShapeComponentProps> = ({ 
  shape, 
  isLocked = false,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  if (shape.type === 'rectangle') {
    return (
      <Rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isLocked ? '#ff0000' : '#000'}
        strokeWidth={isLocked ? 3 : 1}
        draggable={!isLocked}
        onDragStart={() => onDragStart?.(shape.id)}
        onDragMove={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          onDragMove?.(shape.id, x, y);
        }}
        onDragEnd={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          onDragEnd?.(shape.id, x, y);
        }}
      />
    );
  }
  
  return null;
};

export default ShapeComponent;
