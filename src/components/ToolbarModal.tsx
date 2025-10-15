import React from 'react';

interface ToolbarModalProps {
  isDrawMode?: boolean;
  onToggleDrawMode?: () => void;
  onClearCanvas?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

const ToolbarModal: React.FC<ToolbarModalProps> = ({ 
  isDrawMode = false, 
  onToggleDrawMode,
  onClearCanvas,
  showGrid = true,
  onToggleGrid
}) => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(240, 240, 240, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
    >
      {/* Draw mode toggle */}
      <button
        onClick={onToggleDrawMode}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #ccc',
          borderRadius: '6px',
          backgroundColor: isDrawMode ? '#007bff' : '#fff',
          color: isDrawMode ? '#fff' : '#333',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '120px'
        }}
        title={isDrawMode ? 'Exit draw mode (R)' : 'Enter draw mode (R)'}
      >
        Draw Rect {isDrawMode ? '(ON)' : '(OFF)'}
      </button>
      
      {/* Toggle grid button */}
      <button
        onClick={onToggleGrid}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #28a745',
          borderRadius: '6px',
          backgroundColor: showGrid ? '#28a745' : '#fff',
          color: showGrid ? '#fff' : '#28a745',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '100px'
        }}
        title={showGrid ? 'Hide grid lines (G)' : 'Show grid lines (G)'}
      >
        Grid {showGrid ? '(ON)' : '(OFF)'}
      </button>
      
      {/* Clear canvas button */}
      <button
        onClick={onClearCanvas}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #dc3545',
          borderRadius: '6px',
          backgroundColor: '#fff',
          color: '#dc3545',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '120px'
        }}
        title="Clear all shapes from canvas"
      >
        Clear Canvas
      </button>
    </div>
  );
};

export default ToolbarModal;
