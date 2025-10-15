import { useState, useEffect, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import ToolbarModal from './components/ToolbarModal';
import Canvas, { type CanvasRef } from './components/Canvas';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { initializeCanvas } from './services/canvasService';
import type { Point, Size } from './types/canvas';
import { TOOLBAR_HEIGHT } from './types/canvas';

function App() {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [windowSize, setWindowSize] = useState<Size>({ 
    width: window.innerWidth, 
    height: window.innerHeight - TOOLBAR_HEIGHT 
  });
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [canvasLoading, setCanvasLoading] = useState(true);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  const canvasRef = useRef<CanvasRef>(null);

  // Authentication and presence
  const { user, userColor, isLoading: authLoading, error: authError } = useAuth();
  const { otherUsers } = usePresence(
    user?.uid || null,
    userColor,
    canvasId || 'default'
  );

  // Initialize canvas on first load
  useEffect(() => {
    const initCanvas = async () => {
      try {
        setCanvasLoading(true);
        setCanvasError(null);
        const id = await initializeCanvas();
        setCanvasId(id);
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
        setCanvasError(error instanceof Error ? error.message : 'Failed to initialize canvas');
      } finally {
        setCanvasLoading(false);
      }
    };

    initCanvas();
  }, []);

  // Keyboard shortcuts for draw mode toggle and grid toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        setIsDrawMode(prev => !prev);
      } else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        setShowGrid(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClearCanvas = useCallback(async () => {
    try {
      await canvasRef.current?.clearCanvas();
    } catch (error) {
      console.error('Failed to clear canvas:', error);
    }
  }, []);

  // Show loading state
  if (authLoading || canvasLoading) {
    const loadingMessage = authLoading ? 'Authenticating...' : 'Initializing canvas...';
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0'
      }}>
        <LoadingSpinner size="large" message={loadingMessage} />
      </div>
    );
  }

  // Show error state
  if (authError || canvasError) {
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
        <div>Error: {authError || canvasError}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar 
        stagePos={stagePos} 
        stageScale={stageScale}
        windowSize={windowSize}
        otherUsers={otherUsers}
        userColor={userColor}
        canvasId={canvasId || undefined}
      />
      <div style={{ marginTop: '40px', width: '100%', height: 'calc(100vh - 40px)', position: 'relative' }}>
        <ToolbarModal
          isDrawMode={isDrawMode}
          onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
          onClearCanvas={handleClearCanvas}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
        />
        <Canvas 
          ref={canvasRef}
          canvasId={canvasId || 'default'}
          onStageChange={(pos, scale) => {
            setStagePos(pos);
            setStageScale(scale);
          }}
          user={user}
          otherUsers={otherUsers}
          isDrawMode={isDrawMode}
          userColor={userColor}
          showGrid={showGrid}
        />
      </div>
    </div>
  );
}

export default App;