import React from 'react';
import { Group, Line, Label, Tag, Text } from 'react-konva';

interface MultiplayerCursorProps {
  userId: string;
  color: string;
  x: number;
  y: number;
}

const MultiplayerCursor: React.FC<MultiplayerCursorProps> = ({ 
  userId, 
  color, 
  x, 
  y 
}) => {
  return (
    <Group x={x} y={y}>
      {/* SVG-style cursor shape */}
      <Line
        points={[0, 0, 0, 20, 5, 15, 10, 25, 15, 20, 10, 15, 15, 15]}
        fill={color}
        closed
        listening={false}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* User label */}
      <Label x={20} y={5}>
        <Tag 
          fill="white" 
          stroke={color} 
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text 
          text={userId.slice(0, 8)} 
          fill="black" 
          fontSize={12} 
          padding={4}
          fontFamily="Arial, sans-serif"
        />
      </Label>
    </Group>
  );
};

export default MultiplayerCursor;
