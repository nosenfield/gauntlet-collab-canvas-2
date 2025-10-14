import { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import type { Point } from './types/canvas';

function App() {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDrawMode, setIsDrawMode] = useState(false);

  // Authentication and presence
  const { user, userColor, isLoading: authLoading, error: authError } = useAuth();
  const { otherUsers } = usePresence(
    user?.uid || null,
    userColor,
    'default'
  );

  // Keyboard shortcut for draw mode toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        setIsDrawMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
        isDrawMode={isDrawMode}
        onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
      />
      <div style={{ marginTop: '40px', width: '100%', height: 'calc(100vh - 40px)' }}>
        <Canvas 
          onStageChange={(pos, scale) => {
            setStagePos(pos);
            setStageScale(scale);
          }}
          user={user}
          otherUsers={otherUsers}
          isDrawMode={isDrawMode}
          userColor={userColor}
        />
      </div>
    </div>
  );
}

export default App;