import React from 'react';

interface ToolbarProps {
  stagePos?: { x: number; y: number };
  stageScale?: number;
}

const Toolbar: React.FC<ToolbarProps> = ({ stagePos, stageScale }) => {
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
      <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
        CollabCanvas MVP
      </h1>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {stagePos && stageScale && (
          <>
            Position: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)}) | 
            Scale: {stageScale.toFixed(2)}x
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
