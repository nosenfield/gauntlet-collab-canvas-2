import React from 'react';
import type { Point, Size } from '../types/canvas';
import type { PresenceData } from '../types/presence';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types/canvas';

interface ToolbarProps {
  stagePos?: Point;
  stageScale?: number;
  windowSize?: Size;
  otherUsers?: PresenceData[];
  userColor?: string;
  isDrawMode?: boolean;
  onToggleDrawMode?: () => void;
  onClearCanvas?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  stagePos, 
  stageScale, 
  windowSize,
  otherUsers = [], 
  userColor, 
  isDrawMode = false, 
  onToggleDrawMode,
  onClearCanvas
}) => {
  // Calculate viewport centerpoint and visible canvas dimensions
  const getViewportInfo = () => {
    if (!stagePos || !stageScale || !windowSize) {
      return null;
    }

    // Calculate the center of the viewport in canvas coordinates
    const viewportCenterX = windowSize.width / 2;
    const viewportCenterY = windowSize.height / 2;
    
    // Convert viewport center to canvas coordinates
    const canvasCenterX = (viewportCenterX - stagePos.x) / stageScale;
    const canvasCenterY = (viewportCenterY - stagePos.y) / stageScale;
    
    // Calculate visible canvas dimensions
    const visibleCanvasWidth = windowSize.width / stageScale;
    const visibleCanvasHeight = windowSize.height / stageScale;
    
    return {
      centerpoint: { x: canvasCenterX, y: canvasCenterY },
      visibleDimensions: { width: visibleCanvasWidth, height: visibleCanvasHeight }
    };
  };

  const viewportInfo = getViewportInfo();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          CollabCanvas MVP
        </h1>
        
        {/* Draw mode toggle */}
        <button
          onClick={onToggleDrawMode}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: isDrawMode ? '#007bff' : '#fff',
            color: isDrawMode ? '#fff' : '#333',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isDrawMode ? 'Exit draw mode (R)' : 'Enter draw mode (R)'}
        >
          Draw Rect {isDrawMode ? '(ON)' : '(OFF)'}
        </button>
        
        {/* Clear canvas button */}
        <button
          onClick={onClearCanvas}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #dc3545',
            borderRadius: '4px',
            backgroundColor: '#fff',
            color: '#dc3545',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Clear all shapes from canvas"
        >
          Clear Canvas
        </button>
      </div>
      <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {viewportInfo && (
          <>
            Center: ({Math.round(viewportInfo.centerpoint.x)}, {Math.round(viewportInfo.centerpoint.y)}) | 
            Scale: {stageScale!.toFixed(2)}x | 
            Visible: {Math.round(viewportInfo.visibleDimensions.width)}×{Math.round(viewportInfo.visibleDimensions.height)} | 
            Canvas: {CANVAS_WIDTH}×{CANVAS_HEIGHT}
          </>
        )}
        
        {/* User presence indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{otherUsers.length + 1} users online</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Current user */}
            {userColor && (
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: userColor, 
                  borderRadius: '50%',
                  border: '1px solid #ccc'
                }} 
                title="You"
              />
            )}
            {/* Other users */}
            {otherUsers.map((user) => (
              <div 
                key={user.userId}
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: user.color, 
                  borderRadius: '50%',
                  border: '1px solid #ccc'
                }} 
                title={user.userId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
