import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { ref, update } from 'firebase/database';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT } from '../types/canvas';
import type { Point, Size } from '../types/canvas';
import type { User } from '../types/user';
import type { PresenceData } from '../types/presence';
import { useThrottle } from '../hooks/useThrottle';
import { rtdb } from '../services/firebase';
import MultiplayerCursor from './MultiplayerCursor';

interface CanvasProps {
  onStageChange?: (pos: Point, scale: number) => void;
  user: User | null;
  otherUsers: PresenceData[];
}

const Canvas: React.FC<CanvasProps> = ({ onStageChange, user, otherUsers }) => {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [windowSize, setWindowSize] = useState<Size>({ 
    width: window.innerWidth, 
    height: window.innerHeight - TOOLBAR_HEIGHT 
  });

  const stageRef = useRef<any>(null);


  // Constraint functions
  const constrainPosition = (pos: Point, scale: number, viewport: Size): Point => {
    const canvasWidth = CANVAS_WIDTH * scale;
    const canvasHeight = CANVAS_HEIGHT * scale;
    
    // In Konva, positive position moves content right/down, showing left/top content
    // We need to constrain so we never show outside the canvas bounds
    const minX = Math.min(0, viewport.width - canvasWidth);
    const minY = Math.min(0, viewport.height - canvasHeight);
    const maxX = 0;
    const maxY = 0;
    
    const constrainedX = Math.max(minX, Math.min(maxX, pos.x));
    const constrainedY = Math.max(minY, Math.min(maxY, pos.y));
    
    return { x: constrainedX, y: constrainedY };
  };

  const adjustViewportOnResize = (
    newWidth: number,
    newHeight: number,
    currentPos: Point,
    currentScale: number
  ): { x: number; y: number; scale: number } => {
    const newViewport = { width: newWidth, height: newHeight };
    
    let newScale = currentScale;
    let newPos = currentPos;
    
    const constrainedPos = constrainPosition(currentPos, currentScale, newViewport);
    
    if (Math.abs(constrainedPos.x - currentPos.x) > 10 || 
        Math.abs(constrainedPos.y - currentPos.y) > 10) {
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      const viewportAspect = newWidth / newHeight;
      
      if (canvasAspect > viewportAspect) {
        newScale = newWidth / CANVAS_WIDTH;
      } else {
        newScale = newHeight / CANVAS_HEIGHT;
      }
      
      newPos = constrainPosition(currentPos, newScale, newViewport);
    } else {
      newPos = constrainedPos;
    }
    
    return { x: newPos.x, y: newPos.y, scale: newScale };
  };

  const calculateZoomLimits = (viewport: Size): { min: number; max: number } => {
    const minDimension = Math.min(viewport.width, viewport.height);
    const maxDimension = Math.max(viewport.width, viewport.height);
    
    const maxScale = minDimension / 100;
    const minScale = maxDimension / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    return { min: minScale, max: maxScale };
  };

  // Cursor position tracking
  const throttledCursorUpdate = useThrottle((x: number, y: number) => {
    if (!user) return;
    
    const presenceRef = ref(rtdb, `canvases/default/presence/${user.uid}/cursor`);
    update(presenceRef, { x, y }).catch(console.error);
  }, 33); // ~30fps

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (pointerPos) {
      // Convert to canvas coordinates
      const x = (pointerPos.x - stagePos.x) / stageScale;
      const y = (pointerPos.y - stagePos.y) / stageScale;
      
      throttledCursorUpdate(x, y);
    }
  };

  // Notify parent of stage changes
  useEffect(() => {
    onStageChange?.(stagePos, stageScale);
  }, [stagePos, stageScale, onStageChange]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      };
      
      // Adjust viewport to maintain canvas visibility
      const adjusted = adjustViewportOnResize(
        newSize.width,
        newSize.height,
        stagePos,
        stageScale
      );
      
      setWindowSize(newSize);
      setStagePos({ x: adjusted.x, y: adjusted.y });
      setStageScale(adjusted.scale);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stagePos, stageScale]);

  // Handle wheel events for panning and zooming
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    // Check if cmd/ctrl is pressed for zoom
    if (e.evt.metaKey || e.evt.ctrlKey) {
      handleZoom(e);
      return;
    }
    
    // Handle pan - corrected for Konva coordinate system
    const deltaX = e.evt.deltaX;
    const deltaY = e.evt.deltaY;
    
    const newPos = {
      x: stagePos.x - deltaX,  // Negative deltaX moves content right (shows left content)
      y: stagePos.y - deltaY,  // Negative deltaY moves content down (shows top content)
    };
    
    // Constrain to boundaries
    const constrainedPos = constrainPosition(newPos, stageScale, windowSize);
    setStagePos(constrainedPos);
  };

  // Handle zoom functionality
  const handleZoom = (e: any) => {
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Calculate and enforce zoom limits
    const limits = calculateZoomLimits(windowSize);
    const clampedScale = Math.max(limits.min, Math.min(limits.max, newScale));
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    // Constrain position to boundaries
    const constrainedPos = constrainPosition(newPos, clampedScale, windowSize);
    
    setStageScale(clampedScale);
    setStagePos(constrainedPos);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={windowSize.width}
        height={windowSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={false}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        <Layer>
          {/* Dark gray background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#2a2a2a"
            listening={false}
          />
          
          {/* Grid lines */}
          {Array.from({ length: Math.floor(CANVAS_WIDTH / 100) + 1 }, (_, i) => {
            const x = i * 100;
            const isMajorLine = i % 5 === 0;
            return (
              <React.Fragment key={`vertical-${i}`}>
                <Rect
                  x={x}
                  y={0}
                  width={1}
                  height={CANVAS_HEIGHT}
                  fill="white"
                  opacity={isMajorLine ? 1 : 0.5}
                  listening={false}
                />
              </React.Fragment>
            );
          })}
          
          {Array.from({ length: Math.floor(CANVAS_HEIGHT / 100) + 1 }, (_, i) => {
            const y = i * 100;
            const isMajorLine = i % 5 === 0;
            return (
              <React.Fragment key={`horizontal-${i}`}>
                <Rect
                  x={0}
                  y={y}
                  width={CANVAS_WIDTH}
                  height={1}
                  fill="white"
                  opacity={isMajorLine ? 1 : 0.5}
                  listening={false}
                />
              </React.Fragment>
            );
          })}
          
          {/* Canvas boundary */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#ff6b6b"
            strokeWidth={3}
            fill="transparent"
            listening={false}
          />

          {/* Multiplayer cursors */}
          {otherUsers.map((user) => (
            <MultiplayerCursor
              key={user.userId}
              userId={user.userId}
              color={user.color}
              x={user.cursor.x}
              y={user.cursor.y}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;