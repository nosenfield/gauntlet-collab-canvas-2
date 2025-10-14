import { useState } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import type { Point } from './types/canvas';

function App() {
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar stagePos={stagePos} stageScale={stageScale} />
      <div style={{ marginTop: '40px', width: '100%', height: 'calc(100vh - 40px)' }}>
        <Canvas onStageChange={(pos, scale) => {
          setStagePos(pos);
          setStageScale(scale);
        }} />
      </div>
    </div>
  );
}

export default App;