import React from 'react';
import type { Point } from '../types/canvas';
import type { PresenceData } from '../types/presence';

interface ToolbarProps {
  stagePos?: Point;
  stageScale?: number;
  otherUsers?: PresenceData[];
  userColor?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ stagePos, stageScale, otherUsers = [], userColor }) => {
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
      <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {stagePos && stageScale && (
          <>
            Position: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)}) | 
            Scale: {stageScale.toFixed(2)}x
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
