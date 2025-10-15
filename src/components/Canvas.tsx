import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT } from '../types/canvas';
import type { Point, Size } from '../types/canvas';
import type { User } from '../types/user';
import type { PresenceData } from '../types/presence';
import type { Rectangle, TempShape } from '../types/shape';
import { useThrottle } from '../hooks/useThrottle';
import { useTempShapes } from '../hooks/useTempShapes';
import { useShapes } from '../hooks/useShapes';
import { useShapeDragging } from '../hooks/useShapeDragging';
import { useDragPositions } from '../hooks/useDragPositions';
import { useLocks } from '../hooks/useLocks';
import { normalizeRect, createInitialRectangle } from '../utils/shapeHelpers';
import MultiplayerCursor from './MultiplayerCursor';
import ShapeComponent from './ShapeComponent';
import { LoadingOverlay } from './LoadingSpinner';

interface CanvasProps {
  canvasId: string;
  onStageChange?: (pos: Point, scale: number) => void;
  user: User | null;
  otherUsers: PresenceData[];
  isDrawMode: boolean;
  userColor: string;
  showGrid?: boolean;
  updateCursor: (x: number, y: number) => void;
}

export interface CanvasRef {
  clearCanvas: () => Promise<void>;
  adjustViewportToFit: () => void;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ canvasId, onStageChange, user, otherUsers, isDrawMode, userColor, showGrid = true, updateCursor }, canvasRef) => {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [windowSize, setWindowSize] = useState<Size>({ 
    width: window.innerWidth, 
    height: window.innerHeight - TOOLBAR_HEIGHT 
  });
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const stageRef = useRef<any>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);

  // Temporary shapes for real-time drawing sync
  const { tempShapes, saveTempShape, removeTempShape } = useTempShapes(
    canvasId,
    user?.uid || null
  );

  // Persistent shapes from Firestore
  const { shapes, addShape, clearAll, isLoading: shapesLoading } = useShapes(canvasId);

  // Shape dragging functionality
  const { startDrag, updateDrag, endDrag } = useShapeDragging(canvasId, user?.uid || null);
  const { dragPositions } = useDragPositions(canvasId, user?.uid || null);
  
  // Locking system
  const { 
    acquireLock, 
    releaseLock, 
    isLocked, 
    isLockedByCurrentUser, 
    getCurrentUserLock 
  } = useLocks(canvasId, user?.uid || null);

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
    
    // First, check if the current scale allows the canvas to fit properly
    const canvasWidth = CANVAS_WIDTH * currentScale;
    const canvasHeight = CANVAS_HEIGHT * currentScale;
    
    // If canvas is smaller than viewport, we might need to scale up
    // If canvas is larger than viewport, we might need to scale down
    const needsScaleAdjustment = canvasWidth < newWidth || canvasHeight < newHeight;
    
    let newScale = currentScale;
    let newPos = currentPos;
    
    if (needsScaleAdjustment) {
      // Calculate scale to fit canvas to viewport
      const scaleX = newWidth / CANVAS_WIDTH;
      const scaleY = newHeight / CANVAS_HEIGHT;
      
      // Use the smaller scale to ensure canvas fits completely
      newScale = Math.min(scaleX, scaleY);
      
      // Calculate zoom limits to ensure reasonable bounds
      const limits = calculateZoomLimits(newViewport);
      newScale = Math.max(limits.min, Math.min(limits.max, newScale));
      
      // Center the canvas in the viewport
      const scaledCanvasWidth = CANVAS_WIDTH * newScale;
      const scaledCanvasHeight = CANVAS_HEIGHT * newScale;
      
      newPos = {
        x: (newWidth - scaledCanvasWidth) / 2,
        y: (newHeight - scaledCanvasHeight) / 2
      };
    } else {
      // Just constrain the current position
      newPos = constrainPosition(currentPos, currentScale, newViewport);
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

  const calculateInitialViewport = (viewport: Size): { x: number; y: number; scale: number } => {
    // Use the larger dimension to determine the starting zoom level
    const largerDimension = Math.max(viewport.width, viewport.height);
    
    // Set zoom so that the larger dimension displays 1000px of canvas space
    const targetCanvasSpace = 1000;
    const scale = largerDimension / targetCanvasSpace;
    
    // Apply zoom limits to ensure reasonable bounds
    const limits = calculateZoomLimits(viewport);
    const clampedScale = Math.max(limits.min, Math.min(limits.max, scale));
    
    // Calculate center position
    const scaledCanvasWidth = CANVAS_WIDTH * clampedScale;
    const scaledCanvasHeight = CANVAS_HEIGHT * clampedScale;
    
    const x = (viewport.width - scaledCanvasWidth) / 2;
    const y = (viewport.height - scaledCanvasHeight) / 2;
    
    console.log('Initial viewport calculation:', {
      largerDimension,
      targetCanvasSpace,
      scale: clampedScale,
      position: { x, y }
    });
    
    return { x, y, scale: clampedScale };
  };

  // Cursor position tracking with window focus check
  const throttledCursorUpdate = useThrottle((x: number, y: number) => {
    // Only update cursor position if window is focused
    if (isWindowFocused) {
      updateCursor(x, y);
    }
  }, 33); // ~30fps

  // Throttled temp shape update for real-time sync
  const throttledTempShapeUpdate = useThrottle((rect: Rectangle) => {
    if (!user) return;
    
    const tempShape: TempShape = {
      ...rect,
      isInProgress: true,
      userId: user.uid,
    };
    
    saveTempShape(tempShape);
  }, 33); // ~30fps

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (pointerPos) {
      // Convert to canvas coordinates
      const x = (pointerPos.x - stagePos.x) / stageScale;
      const y = (pointerPos.y - stagePos.y) / stageScale;
      
      // Update cursor position for presence
      throttledCursorUpdate(x, y);
      
      // Handle drawing if in draw mode
      if (isDrawing && currentRect && isDrawMode) {
        // Constrain to canvas boundaries
        const constrainedX = Math.max(0, Math.min(CANVAS_WIDTH, x));
        const constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
        
        const width = constrainedX - currentRect.x;
        const height = constrainedY - currentRect.y;
        
        const updatedRect = {
          ...currentRect,
          width,
          height,
        };
        
        setCurrentRect(updatedRect);
        
        // Sync to Realtime DB for other users
        throttledTempShapeUpdate(updatedRect);
      }
    }
  };

  const handleMouseDown = (e: any) => {
    if (!isDrawMode || !user) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (pointerPos) {
      const x = (pointerPos.x - stagePos.x) / stageScale;
      const y = (pointerPos.y - stagePos.y) / stageScale;
      
      // Constrain to canvas boundaries
      const constrainedX = Math.max(0, Math.min(CANVAS_WIDTH, x));
      const constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
      
      const initialRect = createInitialRectangle(
        constrainedX,
        constrainedY,
        userColor,
        user.uid
      );
      
      setIsDrawing(true);
      setCurrentRect(initialRect);
      
      // Save initial temp shape to Realtime DB
      const tempShape: TempShape = {
        ...initialRect,
        isInProgress: true,
        userId: user.uid,
      };
      saveTempShape(tempShape);
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !currentRect) return;
    
    setIsDrawing(false);
    
    // Remove temp shape from Realtime DB
    removeTempShape();
    
    // Check minimum size (10x10px)
    if (Math.abs(currentRect.width) >= 10 && Math.abs(currentRect.height) >= 10) {
      // Normalize negative dimensions
      const normalizedRect = normalizeRect(currentRect);
      
      // Save to Firestore
      try {
        await addShape(normalizedRect);
        console.log('Rectangle saved to Firestore:', normalizedRect);
      } catch (error) {
        console.error('Failed to save rectangle:', error);
      }
    }
    
    setCurrentRect(null);
  };

  const clearCanvas = useCallback(async () => {
    try {
      await clearAll();
      console.log('Canvas cleared successfully');
      // Note: onClearCanvas is called by the parent, not here to avoid circular calls
    } catch (error) {
      console.error('Failed to clear canvas:', error);
    }
  }, [clearAll]);

  const adjustViewportToFit = useCallback(() => {
    const currentWindowSize = {
      width: window.innerWidth,
      height: window.innerHeight - TOOLBAR_HEIGHT
    };
    
    // Get current stage values directly from the stage ref to avoid stale state
    const stage = stageRef.current;
    if (stage) {
      const currentPos = { x: stage.x(), y: stage.y() };
      const currentScale = stage.scaleX();
      
      const adjusted = adjustViewportOnResize(
        currentWindowSize.width,
        currentWindowSize.height,
        currentPos,
        currentScale
      );
      
      setWindowSize(currentWindowSize);
      setStagePos({ x: adjusted.x, y: adjusted.y });
      setStageScale(adjusted.scale);
    } else {
      // Fallback to state values if stage ref is not available
      const adjusted = adjustViewportOnResize(
        currentWindowSize.width,
        currentWindowSize.height,
        stagePos,
        stageScale
      );
      
      setWindowSize(currentWindowSize);
      setStagePos({ x: adjusted.x, y: adjusted.y });
      setStageScale(adjusted.scale);
    }
  }, [stagePos, stageScale]);

  useImperativeHandle(canvasRef, () => ({
    clearCanvas,
    adjustViewportToFit
  }), [clearCanvas, adjustViewportToFit]);

  // Notify parent of stage changes
  useEffect(() => {
    onStageChange?.(stagePos, stageScale);
  }, [stagePos, stageScale, onStageChange]);

  // Initialize viewport on first load
  useEffect(() => {
    const initializeViewport = () => {
      const currentWindowSize = {
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      };
      
      console.log('Initializing viewport with window size:', currentWindowSize);
      console.log('Canvas dimensions:', { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
      
      const initialViewport = calculateInitialViewport(currentWindowSize);
      console.log('Calculated initial viewport:', initialViewport);
      
      setStagePos({ x: initialViewport.x, y: initialViewport.y });
      setStageScale(initialViewport.scale);
    };
    
    // Small delay to ensure DOM is ready and window size is accurate
    const timeoutId = setTimeout(initializeViewport, 0);
    
    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      };
      
      // Get current stage values directly from the stage ref to avoid stale state
      const stage = stageRef.current;
      if (stage) {
        const currentPos = { x: stage.x(), y: stage.y() };
        const currentScale = stage.scaleX();
        
        // Adjust viewport to maintain canvas visibility
        const adjusted = adjustViewportOnResize(
          newSize.width,
          newSize.height,
          currentPos,
          currentScale
        );
        
        setWindowSize(newSize);
        setStagePos({ x: adjusted.x, y: adjusted.y });
        setStageScale(adjusted.scale);
      } else {
        // Fallback to state values if stage ref is not available
        const adjusted = adjustViewportOnResize(
          newSize.width,
          newSize.height,
          stagePos,
          stageScale
        );
        
        setWindowSize(newSize);
        setStagePos({ x: adjusted.x, y: adjusted.y });
        setStageScale(adjusted.scale);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stagePos, stageScale]);

  // Handle window focus/blur for cursor updates
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true);
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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
    <LoadingOverlay isLoading={shapesLoading} message="Loading shapes...">
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
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
          {showGrid && (
            <>
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
            </>
          )}
          
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

          {/* Persistent shapes from Firestore */}
          {shapes.map((shape) => {
            // Get drag position if this shape is being dragged by another user
            const dragPos = Object.values(dragPositions).find(
              dragPos => dragPos.shapeId === shape.id
            );
            const displayShape = dragPos ? { ...shape, x: dragPos.x, y: dragPos.y } : shape;
            
            // Check lock status
            const shapeIsLocked = isLocked(shape.id);
            const shapeIsLockedByCurrentUser = isLockedByCurrentUser(shape.id);
            
            return (
              <ShapeComponent
                key={shape.id}
                shape={displayShape}
                isLocked={shapeIsLocked}
                isLockedByCurrentUser={shapeIsLockedByCurrentUser}
                isDrawMode={isDrawMode}
                stagePos={stagePos}
                stageScale={stageScale}
                onCursorUpdate={throttledCursorUpdate}
                onDragStart={async (shapeId) => {
                  // Check if user already has a lock on another shape
                  const currentUserLock = getCurrentUserLock();
                  if (currentUserLock && currentUserLock !== shapeId) {
                    console.log(`User already has lock on shape ${currentUserLock}, cannot lock ${shapeId}`);
                    return;
                  }
                  
                  // Try to acquire lock before starting drag
                  const lockAcquired = await acquireLock(shapeId);
                  if (lockAcquired) {
                    startDrag(shapeId, shape.x, shape.y);
                  } else {
                    console.log(`Failed to acquire lock for shape ${shapeId}`);
                  }
                }}
                onDragMove={(shapeId, x, y, width, height) => updateDrag(shapeId, x, y, width, height)}
                onDragEnd={async (shapeId, x, y, width, height) => {
                  await endDrag(shapeId, x, y, width, height);
                  // Release lock after drag ends
                  await releaseLock(shapeId);
                }}
              />
            );
          })}

          {/* Other users' temp shapes */}
          {tempShapes.map((shape) => (
            <Rect
              key={`temp-${shape.userId}`}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill}
              opacity={0.5}
              stroke="#000"
              strokeWidth={1}
              listening={false}
            />
          ))}

          {/* Current rectangle being drawn - rendered above all other shapes */}
          {currentRect && (
            <Rect
              x={currentRect.x}
              y={currentRect.y}
              width={currentRect.width}
              height={currentRect.height}
              fill={currentRect.fill}
              opacity={0.7}
              stroke="#000"
              strokeWidth={1}
              listening={false}
            />
          )}

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
    </LoadingOverlay>
  );
});

export default Canvas;