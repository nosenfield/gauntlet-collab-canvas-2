import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT } from '../types/canvas';
import type { Point, Size } from '../types/canvas';

interface CanvasProps {
  onStageChange?: (pos: Point, scale: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({ onStageChange }) => {
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
    
    const maxX = Math.max(0, canvasWidth - viewport.width);
    const maxY = Math.max(0, canvasHeight - viewport.height);
    
    const constrainedX = Math.max(0, Math.min(maxX, pos.x));
    const constrainedY = Math.max(0, Math.min(maxY, pos.y));
    
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
    
    // Handle pan
    const deltaX = e.evt.deltaX;
    const deltaY = e.evt.deltaY;
    
    const newPos = {
      x: stagePos.x - deltaX,
      y: stagePos.y - deltaY,
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
      >
        <Layer>
          {/* Visual canvas boundary for development */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#cccccc"
            strokeWidth={2}
            fill="#ffffff"
            listening={false}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;