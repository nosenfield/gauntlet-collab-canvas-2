import { useState } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import type { Point } from './types/canvas';

function App() {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  // Authentication and presence
  const { user, userColor, isLoading: authLoading, error: authError } = useAuth();
  const { otherUsers } = usePresence(
    user?.uid || null,
    userColor,
    'default'
  );

  // Show loading state
  if (authLoading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        color: 'red'
      }}>
        <div>Error: {authError}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar 
        stagePos={stagePos} 
        stageScale={stageScale}
        otherUsers={otherUsers}
        userColor={userColor}
      />
      <div style={{ marginTop: '40px', width: '100%', height: 'calc(100vh - 40px)' }}>
        <Canvas 
          onStageChange={(pos, scale) => {
            setStagePos(pos);
            setStageScale(scale);
          }}
          user={user}
          otherUsers={otherUsers}
        />
      </div>
    </div>
  );
}

export default App;