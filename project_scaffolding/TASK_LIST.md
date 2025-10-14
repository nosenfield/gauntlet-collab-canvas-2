# Task List - CollabCanvas MVP

**Project:** CollabCanvas - Real-time Collaborative Canvas  
**Version:** 1.0

---

## Task Organization

Tasks are organized by MVP stages and must be completed sequentially within each stage. Each task includes acceptance criteria, dependencies, and implementation notes.

**Status Key:**
- [ ] Not Started
- [~] In Progress
- [x] Complete
- [!] Blocked

---

## Stage 0: Project Setup

### Task 0.1: Initialize Project Boilerplate
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 30 minutes

**Description:**  
Set up React + TypeScript + Vite project with all required dependencies.

**Acceptance Criteria:**
- [ ] Vite project created with React-TS template
- [ ] All dependencies installed (konva, react-konva, firebase, uuid)
- [ ] Folder structure created (components, hooks, services, types, utils, store)
- [ ] `npm run dev` runs without errors
- [ ] Clean boilerplate (removed default CSS and App content)

**Dependencies:** None

**Implementation Notes:**
```bash
npm create vite@latest collab-canvas -- --template react-ts
npm install konva react-konva firebase uuid
npm install -D @types/uuid
```

---

### Task 0.2: Configure Firebase
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 30 minutes

**Description:**  
Set up Firebase project and configure both Firestore and Realtime Database.

**Acceptance Criteria:**
- [ ] Firebase project created in console
- [ ] Firestore Database enabled (test mode)
- [ ] Realtime Database enabled (test mode)
- [ ] Anonymous Authentication enabled
- [ ] `.env` file created with all 7 Firebase config values
- [ ] `src/services/firebase.ts` created and exports `db`, `rtdb`, `auth`
- [ ] Firebase connection verified (no console errors)

**Dependencies:** Task 0.1

**Implementation Notes:**
- Get database URL from Realtime Database section in Firebase console
- Test mode security rules are acceptable for MVP
- Verify `import.meta.env` variables load correctly

**Environment Variables Required:**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
```

---

## Stage 1: Canvas Display with Pan/Zoom

### Task 1.1: Create Basic Canvas Component
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Implement full-screen Konva Stage and Layer with fixed 10,000×10,000px canvas dimensions.

**Acceptance Criteria:**
- [ ] Canvas component renders full-screen below toolbar (40px from top)
- [ ] Konva Stage created with proper width/height from window dimensions
- [ ] Single Konva Layer created for rendering shapes
- [ ] Canvas virtual dimensions set to 10,000×10,000px
- [ ] Stage position and scale state managed with React hooks
- [ ] No console errors or warnings

**Dependencies:** Task 0.2

**Implementation Notes:**
```typescript
// Key state
const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
const [stageScale, setStageScale] = useState(1);
const [windowSize, setWindowSize] = useState({ 
  width: window.innerWidth, 
  height: window.innerHeight - 40 // Account for toolbar
});

const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 10000;
```

**Files to Create:**
- `src/components/Canvas.tsx`
- `src/types/canvas.ts`

---

### Task 1.2: Implement Window Resize Handling
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 1 hour

**Description:**  
Handle window resize events while maintaining canvas visibility and zoom level.

**Acceptance Criteria:**
- [ ] Window resize listener attached with cleanup
- [ ] Stage dimensions update on resize
- [ ] Zoom level maintained when window grows (if possible)
- [ ] Canvas remains visible (no outside area shown) when window grows
- [ ] Prioritize translation over scale to keep canvas in viewport
- [ ] No performance issues during resize
- [ ] Debounced resize handler (optional optimization)

**Dependencies:** Task 1.1

**Implementation Notes:**
- Use `useEffect` with window resize listener
- Calculate if current view would show outside canvas after resize
- Adjust `stagePos` if necessary to keep canvas fully visible
- Consider using lodash debounce or custom throttle

**Helper Function Needed:**
```typescript
const adjustViewportOnResize = (
  newWidth: number, 
  newHeight: number, 
  currentPos: Point, 
  currentScale: number
) => {
  // Return adjusted { x, y, scale }
}
```

---

### Task 1.3: Implement Pan Functionality
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Enable canvas panning via scroll with boundary constraints (never show outside canvas).

**Acceptance Criteria:**
- [ ] Scroll events (wheel without modifier keys) trigger panning
- [ ] Pan is smooth and responsive
- [ ] Panning stops at canvas boundaries (no overscroll)
- [ ] Horizontal and vertical panning both work
- [ ] Stage position updates correctly
- [ ] 60 FPS maintained during pan
- [ ] Works with both mouse wheel and trackpad

**Dependencies:** Task 1.2

**Implementation Notes:**
```typescript
const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
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
```

**Helper Function Needed:**
```typescript
const constrainPosition = (
  pos: Point, 
  scale: number, 
  viewport: Size
): Point => {
  // Ensure canvas fully covers viewport
  // Return clamped position
}
```

---

### Task 1.4: Implement Zoom Functionality
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 3 hours

**Description:**  
Enable canvas zooming via Cmd/Ctrl + Scroll with cursor as focal point and strict zoom limits.

**Acceptance Criteria:**
- [ ] Cmd/Ctrl + Scroll triggers zoom in/out
- [ ] Zoom focuses on cursor position (cursor stays on same canvas point)
- [ ] Maximum zoom in: 100px across smallest window dimension
- [ ] Maximum zoom out: full canvas visible across largest window dimension
- [ ] Zoom limits enforced (cannot zoom beyond limits)
- [ ] Smooth zoom animation (optional but nice)
- [ ] Position adjusted to maintain canvas visibility after zoom
- [ ] 60 FPS maintained during zoom
- [ ] Works with both mouse and trackpad

**Dependencies:** Task 1.3

**Implementation Notes:**
```typescript
const handleZoom = (e: KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();
  
  const scaleBy = 1.05;
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
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
```

**Helper Function Needed:**
```typescript
const calculateZoomLimits = (viewport: Size): { min: number; max: number } => {
  const minDimension = Math.min(viewport.width, viewport.height);
  const maxDimension = Math.max(viewport.width, viewport.height);
  
  // Max zoom in: 100px across smallest dimension
  const maxScale = minDimension / 100;
  
  // Max zoom out: full canvas across largest dimension
  const minScale = maxDimension / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
  
  return { min: minScale, max: maxScale };
};
```

---

### Task 1.5: Add Visual Canvas Boundary
**Status:** [ ]  
**Priority:** Medium  
**Estimated Effort:** 30 minutes

**Description:**  
Add visual rectangle showing canvas boundaries for development/testing purposes.

**Acceptance Criteria:**
- [ ] Rectangle drawn at canvas boundaries (0, 0, 10000, 10000)
- [ ] Stroke visible (light gray or similar)
- [ ] Does not interfere with interactions
- [ ] Optional: Add background fill to distinguish canvas from outside

**Dependencies:** Task 1.4

**Implementation Notes:**
```typescript
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
```

---

### Task 1.6: Stage 1 Testing & Validation
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Thoroughly test all canvas, pan, and zoom functionality.

**Test Cases:**
- [ ] Canvas renders full-screen
- [ ] Pan works in all directions with scroll
- [ ] Pan stops at boundaries (cannot see outside canvas)
- [ ] Zoom in works with Cmd/Ctrl + Scroll up
- [ ] Zoom out works with Cmd/Ctrl + Scroll down
- [ ] Zoom focuses on cursor position correctly
- [ ] Cannot zoom beyond max zoom in limit
- [ ] Cannot zoom beyond max zoom out limit
- [ ] Window resize maintains view correctly
- [ ] Window resize never shows outside canvas
- [ ] 60 FPS maintained during all operations
- [ ] No console errors or warnings

**Dependencies:** Task 1.5

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Performance meets 60 FPS target
- [ ] Ready to move to Stage 2

---

## Stage 2: Anonymous User Auth & Presence

### Task 2.1: Implement Anonymous Authentication
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Set up Firebase Anonymous Auth and auto-login users on app load.

**Acceptance Criteria:**
- [ ] User automatically signs in anonymously on app mount
- [ ] User ID generated and stored in state
- [ ] Random color assigned to user
- [ ] User state persists across component re-renders
- [ ] Auth state listener properly cleaned up
- [ ] Error handling for auth failures

**Dependencies:** Task 1.6

**Implementation Notes:**
```typescript
// src/hooks/useAuth.ts
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userColor, setUserColor] = useState<string>('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Generate or retrieve user color
        const color = generateRandomColor();
        setUserColor(color);
      } else {
        // Sign in anonymously
        const result = await signInAnonymously(auth);
        setUser(result.user);
        const color = generateRandomColor();
        setUserColor(color);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return { user, userColor };
};
```

**Helper Function Needed:**
```typescript
const generateRandomColor = (): string => {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
};
```

**Files to Create:**
- `src/hooks/useAuth.ts`
- `src/types/user.ts`

---

### Task 2.2: Implement Presence System (Realtime DB)
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Set up user presence in Firebase Realtime Database with automatic cleanup on disconnect.

**Acceptance Criteria:**
- [ ] User presence written to Realtime DB on mount
- [ ] Presence includes: userId, color, cursor position, timestamp, isActive
- [ ] onDisconnect handler removes presence automatically
- [ ] Presence updates when cursor moves (throttled)
- [ ] Listener attached for other users' presence
- [ ] Stale presence entries cleaned up
- [ ] Works correctly on page refresh

**Dependencies:** Task 2.1

**Implementation Notes:**
```typescript
// src/hooks/usePresence.ts
const usePresence = (userId: string, userColor: string, canvasId: string) => {
  const [otherUsers, setOtherUsers] = useState<PresenceData[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    
    const presenceRef = ref(rtdb, `canvases/${canvasId}/presence/${userId}`);
    
    // Set initial presence
    set(presenceRef, {
      userId,
      color: userColor,
      cursor: { x: 0, y: 0 },
      timestamp: serverTimestamp(),
      isActive: true,
    });
    
    // Set up onDisconnect
    onDisconnect(presenceRef).remove();
    
    // Listen to all presence updates
    const allPresenceRef = ref(rtdb, `canvases/${canvasId}/presence`);
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data).filter(
          (u: any) => u.userId !== userId
        );
        setOtherUsers(users as PresenceData[]);
      }
    });
    
    return () => {
      unsubscribe();
      remove(presenceRef);
    };
  }, [userId, userColor, canvasId]);
  
  return { otherUsers };
};
```

**Database Path:**
```
canvases/{canvasId}/presence/{userId}
```

**Files to Create:**
- `src/hooks/usePresence.ts`
- `src/types/presence.ts`

---

### Task 2.3: Implement Cursor Position Sync
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Sync local cursor position to Realtime DB and render other users' cursors on canvas.

**Acceptance Criteria:**
- [ ] Mouse move events tracked on Stage
- [ ] Cursor position converted to canvas coordinates
- [ ] Position updates throttled to ~30 updates/second
- [ ] Position written to Realtime DB presence entry
- [ ] Cursor updates sync with <50ms latency
- [ ] Local cursor not rendered (only other users)
- [ ] Performance: no jank or frame drops

**Dependencies:** Task 2.2

**Implementation Notes:**
```typescript
// In Canvas component
const throttledCursorUpdate = useThrottle((x: number, y: number) => {
  if (!user) return;
  
  const presenceRef = ref(rtdb, `canvases/${canvasId}/presence/${user.uid}/cursor`);
  update(presenceRef, { x, y });
}, 33); // ~30fps

const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  const pointerPos = stage.getPointerPosition();
  
  if (pointerPos) {
    // Convert to canvas coordinates
    const x = (pointerPos.x - stagePos.x) / stageScale;
    const y = (pointerPos.y - stagePos.y) / stageScale;
    
    throttledCursorUpdate(x, y);
  }
};
```

**Helper Hook Needed:**
```typescript
// src/hooks/useThrottle.ts
const useThrottle = (callback: Function, delay: number) => {
  // Throttle implementation
};
```

---

### Task 2.4: Create Multiplayer Cursor Component
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 1.5 hours

**Description:**  
Create visual cursor component showing other users' positions with name labels.

**Acceptance Criteria:**
- [ ] Cursor component renders for each user in `otherUsers`
- [ ] Cursor position matches user's canvas coordinates
- [ ] Cursor colored with user's color
- [ ] User ID label displayed next to cursor
- [ ] Label has background for readability
- [ ] Cursor and label scale with stage zoom
- [ ] Smooth cursor movement (no jitter)
- [ ] Cursors update in real-time

**Dependencies:** Task 2.3

**Implementation Notes:**
```typescript
// src/components/MultiplayerCursor.tsx
interface Props {
  userId: string;
  color: string;
  x: number;
  y: number;
}

const MultiplayerCursor: React.FC<Props> = ({ userId, color, x, y }) => {
  return (
    <Group x={x} y={y}>
      {/* SVG-style cursor shape */}
      <Line
        points={[0, 0, 0, 20, 5, 15, 10, 25, 15, 20, 10, 15, 15, 15]}
        fill={color}
        closed
        listening={false}
      />
      
      {/* User label */}
      <Label x={20} y={5}>
        <Tag fill="white" stroke={color} strokeWidth={1} />
        <Text text={userId} fill="black" fontSize={12} padding={4} />
      </Label>
    </Group>
  );
};
```

**Files to Create:**
- `src/components/MultiplayerCursor.tsx`

---

### Task 2.5: Add User Presence Indicator UI
**Status:** [ ]  
**Priority:** Low  
**Estimated Effort:** 30 minutes

**Description:**  
Display list of active users in the toolbar or corner of screen.

**Acceptance Criteria:**
- [ ] Shows count of active users
- [ ] Lists user IDs with their colors
- [ ] Updates in real-time as users join/leave
- [ ] Non-intrusive UI placement
- [ ] Optional: Avatar circles with user colors

**Dependencies:** Task 2.4

**Implementation Notes:**
```typescript
// In Toolbar component
<div className="presence-list">
  <span>{otherUsers.length + 1} users online</span>
  {otherUsers.map(user => (
    <div key={user.userId} style={{ color: user.color }}>
      {user.userId}
    </div>
  ))}
</div>
```

**Files to Create:**
- `src/components/Toolbar.tsx` (if not exists)
- Update App.tsx to include Toolbar

---

### Task 2.6: Stage 2 Testing & Validation
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Test authentication and presence system with multiple users.

**Test Cases:**
- [ ] User auto-signs in anonymously on load
- [ ] User assigned random color
- [ ] Open 2-3 browser windows/tabs
- [ ] Each user gets different ID and color
- [ ] Cursors visible across all windows
- [ ] Cursor positions sync smoothly (<50ms latency)
- [ ] Cursor movement has no jitter
- [ ] User count updates correctly
- [ ] Closing window removes user from presence list
- [ ] Page refresh maintains user ID (or creates new one gracefully)
- [ ] No console errors
- [ ] Performance still 60 FPS with multiple cursors

**Dependencies:** Task 2.5

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Multi-user presence working smoothly
- [ ] Ready to move to Stage 3

---

## Stage 3: Shape Creation & Manipulation

### Task 3.1: Create Rectangle Shape Type
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Define TypeScript types and Firestore schema for rectangle shapes.

**Acceptance Criteria:**
- [ ] Shape type interface defined
- [ ] Rectangle-specific properties defined
- [ ] Firestore document structure documented
- [ ] Helper functions for creating shape objects

**Dependencies:** Task 2.6

**Implementation Notes:**
```typescript
// src/types/shape.ts
interface BaseShape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
}

interface Rectangle extends BaseShape {
  type: 'rectangle';
}

type Shape = Rectangle;

// Helper
const createRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  userId: string
): Rectangle => {
  return {
    id: uuidv4(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill,
    createdBy: userId,
    createdAt: Date.now(),
    lastModified: Date.now(),
  };
};
```

**Files to Create:**
- `src/types/shape.ts`
- `src/utils/shapeHelpers.ts`

---

### Task 3.2: Implement Draw Rectangle Mode Toggle
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 1 hour

**Description:**  
Add "Draw Rect" button to toolbar that toggles drawing mode.

**Acceptance Criteria:**
- [ ] Button added to toolbar
- [ ] Click toggles between active/inactive state
- [ ] Visual feedback shows current state (different colors/styles)
- [ ] Drawing mode state managed in Canvas component
- [ ] Keyboard shortcut (optional): 'R' key toggles mode

**Dependencies:** Task 3.1

**Implementation Notes:**
```typescript
// In App or Canvas component
const [isDrawMode, setIsDrawMode] = useState(false);

// In Toolbar
<button 
  onClick={() => setIsDrawMode(!isDrawMode)}
  className={isDrawMode ? 'active' : ''}
>
  Draw Rect {isDrawMode ? '(ON)' : '(OFF)'}
</button>
```

---

### Task 3.3: Implement Rectangle Drawing Interaction
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 3 hours

**Description:**  
Enable click-drag-release rectangle drawing on canvas when in draw mode.

**Acceptance Criteria:**
- [ ] Mouse down in draw mode starts rectangle
- [ ] Rectangle grows as mouse drags
- [ ] Mouse up completes rectangle
- [ ] Rectangle filled with user's color
- [ ] Minimum size enforced (10×10px)
- [ ] Rectangle constrained to canvas boundaries during draw
- [ ] Cannot draw outside canvas bounds
- [ ] Visual feedback during draw (semi-transparent or outline)
- [ ] Draw mode automatically deactivates after completion (optional)

**Dependencies:** Task 3.2

**Implementation Notes:**
```typescript
const [isDrawing, setIsDrawing] = useState(false);
const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);

const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  if (!isDrawMode || !user) return;
  
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  
  if (point) {
    const x = (point.x - stagePos.x) / stageScale;
    const y = (point.y - stagePos.y) / stageScale;
    
    // Constrain to canvas
    const constrainedX = Math.max(0, Math.min(CANVAS_WIDTH, x));
    const constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
    
    setIsDrawing(true);
    setCurrentRect({
      id: 'temp-' + uuidv4(),
      type: 'rectangle',
      x: constrainedX,
      y: constrainedY,
      width: 0,
      height: 0,
      fill: userColor,
      createdBy: user.uid,
      createdAt: Date.now(),
      lastModified: Date.now(),
    });
  }
};

const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
  if (!isDrawing || !currentRect) return;
  
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  
  if (point) {
    const x = (point.x - stagePos.x) / stageScale;
    const y = (point.y - stagePos.y) / stageScale;
    
    // Constrain to canvas
    const constrainedX = Math.max(0, Math.min(CANVAS_WIDTH, x));
    const constrainedY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
    
    const width = constrainedX - currentRect.x;
    const height = constrainedY - currentRect.y;
    
    setCurrentRect({
      ...currentRect,
      width,
      height,
    });
  }
};

const handleMouseUp = () => {
  if (!isDrawing || !currentRect) return;
  
  setIsDrawing(false);
  
  // Check minimum size
  if (Math.abs(currentRect.width) >= 10 && Math.abs(currentRect.height) >= 10) {
    // Normalize negative dimensions
    const normalizedRect = normalizeRect(currentRect);
    
    // Save to state or Firestore (next task)
    saveShape(normalizedRect);
  }
  
  setCurrentRect(null);
};
```

**Helper Function Needed:**
```typescript
const normalizeRect = (rect: Rectangle): Rectangle => {
  // Handle negative width/height (dragging left or up)
  const x = rect.width < 0 ? rect.x + rect.width : rect.x;
  const y = rect.height < 0 ? rect.y + rect.height : rect.y;
  const width = Math.abs(rect.width);
  const height = Math.abs(rect.height);
  
  return { ...rect, x, y, width, height };
};
```

---

### Task 3.4: Sync In-Progress Drawing to Realtime DB
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 2 hours

**Description:**  
Stream in-progress rectangle to Realtime DB so other users see it being drawn.

**Acceptance Criteria:**
- [ ] In-progress rect written to Realtime DB on mouse down
- [ ] Position/size updates stream during drag
- [ ] Other users see rectangle growing in real-time
- [ ] Temp shape deleted from Realtime DB on mouse up
- [ ] Updates throttled to reasonable rate (30-60fps)
- [ ] No performance degradation

**Dependencies:** Task 3.3

**Implementation Notes:**
```typescript
// When mouse down
const tempShapeRef = ref(rtdb, `canvases/${canvasId}/temp-shapes/${user.uid}`);
set(tempShapeRef, {
  ...currentRect,
  isInProgress: true,
  userId: user.uid,
});

// During mouse move (throttled)
update(tempShapeRef, {
  width: currentRect.width,
  height: currentRect.height,
});

// On mouse up
remove(tempShapeRef);
```

**Hook Needed:**
```typescript
// src/hooks/useTempShapes.ts
const useTempShapes = (canvasId: string, currentUserId: string) => {
  const [tempShapes, setTempShapes] = useState<Shape[]>([]);
  
  useEffect(() => {
    const tempShapesRef = ref(rtdb, `canvases/${canvasId}/temp-shapes`);
    
    const unsubscribe = onValue(tempShapesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const shapes = Object.values(data).filter(
          (s: any) => s.userId !== currentUserId
        );
        setTempShapes(shapes as Shape[]);
      } else {
        setTempShapes([]);
      }
    });
    
    return () => unsubscribe();
  }, [canvasId, currentUserId]);
  
  return { tempShapes };
};
```

**Files to Create:**
- `src/hooks/useTempShapes.ts`

---

### Task 3.5: Save Completed Rectangles to Firestore
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Persist completed rectangles to Firestore for permanent storage.

**Acceptance Criteria:**
- [ ] Completed rectangle saved to Firestore on mouse up
- [ ] Rectangle appears in local state immediately (optimistic update)
- [ ] Rectangle syncs to other users via Firestore listener
- [ ] Error handling for failed writes
- [ ] Rollback on write failure (optional for MVP)

**Dependencies:** Task 3.4

**Implementation Notes:**
```typescript
// src/services/shapeService.ts
const saveShape = async (shape: Shape, canvasId: string) => {
  try {
    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
    await setDoc(shapeRef, shape);
  } catch (error) {
    console.error('Error saving shape:', error);
    throw error;
  }
};

const deleteShape = async (shapeId: string, canvasId: string) => {
  try {
    const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
};
```

**Hook Needed:**
```typescript
// src/hooks/useShapes.ts
const useShapes = (canvasId: string) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  
  useEffect(() => {
    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    
    const unsubscribe = onSnapshot(shapesRef, (snapshot) => {
      const shapeData = snapshot.docs.map(doc => doc.data() as Shape);
      setShapes(shapeData);
    });
    
    return () => unsubscribe();
  }, [canvasId]);
  
  return { shapes };
};
```

**Files to Create:**
- `src/services/shapeService.ts`
- `src/hooks/useShapes.ts`

---

### Task 3.6: Render Shapes on Canvas
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Create Shape component to render all shapes (persistent and in-progress) on canvas.

**Acceptance Criteria:**
- [ ] Shape component renders based on shape type
- [ ] Shapes from Firestore rendered correctly
- [ ] In-progress shapes from Realtime DB rendered
- [ ] Shapes display correct position, size, and color
- [ ] Performance maintained with 100+ shapes
- [ ] Current user's in-progress shape rendered locally

**Dependencies:** Task 3.5

**Implementation Notes:**
```typescript
// src/components/Shape.tsx
interface ShapeProps {
  shape: Shape;
  isLocked?: boolean;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

const Shape: React.FC<ShapeProps> = ({ 
  shape, 
  isLocked = false,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  if (shape.type === 'rectangle') {
    return (
      <Rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isLocked ? '#ff0000' : undefined}
        strokeWidth={isLocked ? 10 : 0}
        draggable={!isLocked}
        onDragStart={onDragStart}
        onDragMove={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          onDragMove?.(x, y);
        }}
        onDragEnd={onDragEnd}
      />
    );
  }
  
  return null;
};
```

**Files to Create:**
- `src/components/Shape.tsx`

---

### Task 3.7: Implement Shape Repositioning (Drag)
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 3 hours

**Description:**  
Enable dragging completed shapes to reposition them with real-time sync.

**Acceptance Criteria:**
- [ ] Click and drag moves shape
- [ ] Shape position constrained to canvas boundaries
- [ ] Position updates stream to Realtime DB during drag
- [ ] Other users see shape moving in real-time
- [ ] Final position saved to Firestore on drag end
- [ ] Smooth dragging with no lag
- [ ] Cannot drag outside canvas bounds

**Dependencies:** Task 3.6

**Implementation Notes:**
```typescript
// In Canvas component
const handleShapeDragStart = (shapeId: string) => {
  // Acquire lock (next task)
  // Update local state
};

const handleShapeDragMove = (shapeId: string, x: number, y: number) => {
  // Constrain to boundaries
  const constrainedX = Math.max(
    0, 
    Math.min(CANVAS_WIDTH - shape.width, x)
  );
  const constrainedY = Math.max(
    0, 
    Math.min(CANVAS_HEIGHT - shape.height, y)
  );
  
  // Update Realtime DB
  const tempShapeRef = ref(rtdb, `canvases/${canvasId}/temp-shapes/${shapeId}`);
  update(tempShapeRef, {
    x: constrainedX,
    y: constrainedY,
  });
};

const handleShapeDragEnd = async (shapeId: string, x: number, y: number) => {
  // Constrain final position
  const constrainedX = Math.max(
    0, 
    Math.min(CANVAS_WIDTH - shape.width, x)
  );
  const constrainedY = Math.max(
    0, 
    Math.min(CANVAS_HEIGHT - shape.height, y)
  );
  
  // Save to Firestore
  const shapeRef = doc(db, `canvases/${canvasId}/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    x: constrainedX,
    y: constrainedY,
    lastModified: Date.now(),
  });
  
  // Clean up Realtime DB
  const tempShapeRef = ref(rtdb, `canvases/${canvasId}/temp-shapes/${shapeId}`);
  remove(tempShapeRef);
  
  // Release lock (next task)
};
```

**Boundary Constraint Helper:**
```typescript
const constrainShapePosition = (
  x: number, 
  y: number, 
  shape: Shape
): Point => {
  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH - shape.width, x)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT - shape.height, y)),
  };
};
```

---

### Task 3.8: Implement Object Locking System
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 2 hours

**Description:**  
Prevent multiple users from manipulating the same shape simultaneously.

**Acceptance Criteria:**
- [ ] Lock acquired when user starts dragging or drawing
- [ ] Lock stored in Realtime DB
- [ ] Other users cannot drag locked shapes
- [ ] Locked shapes display 10px red border
- [ ] Lock released on drag end
- [ ] Lock automatically released on disconnect
- [ ] User can only lock one shape at a time

**Dependencies:** Task 3.7

**Implementation Notes:**
```typescript
// src/hooks/useLocks.ts
const useLocks = (canvasId: string) => {
  const [locks, setLocks] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const locksRef = ref(rtdb, `canvases/${canvasId}/locks`);
    
    const unsubscribe = onValue(locksRef, (snapshot) => {
      const data = snapshot.val();
      setLocks(data || {});
    });
    
    return () => unsubscribe();
  }, [canvasId]);
  
  const acquireLock = async (shapeId: string, userId: string) => {
    const lockRef = ref(rtdb, `canvases/${canvasId}/locks/${shapeId}`);
    
    await set(lockRef, {
      userId,
      timestamp: Date.now(),
      shapeId,
    });
    
    // Set up auto-release on disconnect
    onDisconnect(lockRef).remove();
  };
  
  const releaseLock = async (shapeId: string) => {
    const lockRef = ref(rtdb, `canvases/${canvasId}/locks/${shapeId}`);
    await remove(lockRef);
  };
  
  const isLocked = (shapeId: string, userId: string): boolean => {
    const lock = locks[shapeId];
    return lock && lock.userId !== userId;
  };
  
  return { locks, acquireLock, releaseLock, isLocked };
};
```

**Integration in Shape Component:**
```typescript
// In Canvas or Shape rendering
const isShapeLocked = isLocked(shape.id, user.uid);

<Shape
  shape={shape}
  isLocked={isShapeLocked}
  onDragStart={() => !isShapeLocked && acquireLock(shape.id, user.uid)}
  onDragMove={handleShapeDragMove}
  onDragEnd={() => releaseLock(shape.id)}
/>
```

**Files to Create:**
- `src/hooks/useLocks.ts`

---

### Task 3.9: Initialize Canvas on First Load
**Status:** [ ]  
**Priority:** Medium  
**Estimated Effort:** 1 hour

**Description:**  
Create canvas document in Firestore if it doesn't exist on first user visit.

**Acceptance Criteria:**
- [ ] Check if canvas document exists
- [ ] Create canvas document with metadata if missing
- [ ] Single canvas ID used for MVP (e.g., "default-canvas")
- [ ] Canvas metadata includes createdAt, lastModified
- [ ] Works correctly when multiple users visit simultaneously

**Dependencies:** Task 3.8

**Implementation Notes:**
```typescript
// src/services/canvasService.ts
const CANVAS_ID = 'default-canvas';

const initializeCanvas = async () => {
  const canvasRef = doc(db, 'canvases', CANVAS_ID);
  const canvasSnap = await getDoc(canvasRef);
  
  if (!canvasSnap.exists()) {
    await setDoc(canvasRef, {
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
  }
  
  return CANVAS_ID;
};
```

**Usage in App:**
```typescript
useEffect(() => {
  initializeCanvas().then(canvasId => {
    setCanvasId(canvasId);
  });
}, []);
```

**Files to Create:**
- `src/services/canvasService.ts`

---

### Task 3.10: Test Shape Persistence Across Sessions
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 30 minutes

**Description:**  
Verify shapes persist when all users disconnect and reconnect.

**Test Cases:**
- [ ] Create several rectangles
- [ ] Close all browser windows
- [ ] Open new browser window
- [ ] All shapes still visible
- [ ] Shapes at correct positions
- [ ] Shapes have correct colors

**Dependencies:** Task 3.9

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Shapes persist indefinitely

---

### Task 3.11: Stage 3 Complete Testing & Validation
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Comprehensive testing of all shape creation and manipulation features.

**Test Cases:**
- [ ] Draw mode toggles correctly
- [ ] Can draw rectangles in draw mode
- [ ] Rectangles filled with user's color
- [ ] Cannot draw outside canvas boundaries
- [ ] Minimum size (10×10px) enforced
- [ ] In-progress rectangles visible to other users
- [ ] Completed rectangles sync across users
- [ ] Can drag rectangles to reposition
- [ ] Cannot drag outside canvas boundaries
- [ ] Dragging shows real-time position updates to other users
- [ ] Locked shapes display red border
- [ ] Cannot drag shapes locked by other users
- [ ] Lock released on drag end
- [ ] Lock released on disconnect
- [ ] Shapes persist after page refresh
- [ ] Shapes persist after all users disconnect
- [ ] Performance maintained with 100+ shapes
- [ ] Performance maintained with 5+ users
- [ ] 60 FPS during all operations
- [ ] No console errors or warnings

**Multi-User Test Scenarios:**
1. **Concurrent Drawing:**
   - User A and User B both draw rectangles simultaneously
   - Both see each other's in-progress drawings
   - Both rectangles saved correctly

2. **Concurrent Dragging:**
   - User A drags Shape 1
   - User B tries to drag Shape 1 (should be locked)
   - User B can drag Shape 2
   - User A releases Shape 1
   - User B can now drag Shape 1

3. **Disconnect During Drag:**
   - User A starts dragging a shape
   - User A closes browser
   - Lock automatically released
   - User B can now drag the shape

**Dependencies:** Task 3.10

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] All multi-user scenarios work correctly
- [ ] Performance meets all targets
- [ ] MVP feature-complete

---

## Stage 4: Polish & Deployment

### Task 4.1: Add Loading States
**Status:** [ ]  
**Priority:** Medium  
**Estimated Effort:** 1 hour

**Description:**  
Add loading indicators for auth, canvas initialization, and data loading.

**Acceptance Criteria:**
- [ ] Loading spinner during auth
- [ ] Loading state while canvas initializes
- [ ] Graceful handling of slow network
- [ ] Error states for failed operations

**Dependencies:** Task 3.11

---

### Task 4.2: Error Handling & Validation
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 2 hours

**Description:**  
Add comprehensive error handling throughout the app.

**Acceptance Criteria:**
- [ ] Try-catch blocks around all Firebase operations
- [ ] User-friendly error messages
- [ ] Validation for shape dimensions
- [ ] Validation for canvas boundaries
- [ ] Network error handling
- [ ] Graceful degradation on errors

**Dependencies:** Task 4.1

---

### Task 4.3: Performance Optimization
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 2 hours

**Description:**  
Optimize canvas performance for 500+ shapes and 5+ users.

**Acceptance Criteria:**
- [ ] Konva layers optimized
- [ ] Unnecessary re-renders eliminated
- [ ] Event listeners properly cleaned up
- [ ] Throttling/debouncing applied where appropriate
- [ ] Memory leaks checked and fixed
- [ ] 60 FPS maintained under load

**Dependencies:** Task 4.2

**Optimization Techniques:**
- Use `React.memo` for Shape components
- Use `useMemo` for expensive calculations
- Implement virtual scrolling for large shape lists (if needed)
- Batch Firestore writes where possible
- Use Konva's `perfectDrawEnabled={false}` for better performance

---

### Task 4.4: Browser Compatibility Testing
**Status:** [ ]  
**Priority:** Medium  
**Estimated Effort:** 1 hour

**Description:**  
Test application across different browsers.

**Test Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Cases:**
- [ ] All features work in each browser
- [ ] Performance acceptable in each browser
- [ ] No browser-specific bugs
- [ ] Cursor events work correctly

**Dependencies:** Task 4.3

---

### Task 4.5: Security Rules Configuration
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 1 hour

**Description:**  
Configure Firebase security rules for production (can keep test mode for MVP demo).

**Acceptance Criteria:**
- [ ] Firestore rules defined
- [ ] Realtime Database rules defined
- [ ] Rules documented
- [ ] Decision made: test mode vs. production rules for MVP

**Dependencies:** Task 4.4

**Example Rules (Test Mode - Acceptable for MVP):**
```javascript
// Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// Realtime Database
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### Task 4.6: Environment Configuration for Deployment
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 30 minutes

**Description:**  
Set up environment variables and build configuration for deployment.

**Acceptance Criteria:**
- [ ] All Firebase config in environment variables
- [ ] `.env.example` file created and documented
- [ ] `.env` added to `.gitignore`
- [ ] Build process verified
- [ ] Production build tested locally

**Dependencies:** Task 4.5

**Commands to Test:**
```bash
npm run build
npm run preview
```

---

### Task 4.7: Deploy to Vercel or Firebase Hosting
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Deploy application to production hosting.

**Acceptance Criteria:**
- [ ] Deployment platform chosen (Vercel or Firebase Hosting)
- [ ] Environment variables configured in platform
- [ ] Application deployed successfully
- [ ] Public URL accessible
- [ ] HTTPS enabled
- [ ] All features work in production
- [ ] Performance acceptable in production

**Dependencies:** Task 4.6

**Vercel Deployment:**
```bash
npm install -g vercel
vercel
# Follow prompts, add environment variables
```

**Firebase Hosting Deployment:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

### Task 4.8: Final End-to-End Testing
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 2 hours

**Description:**  
Complete end-to-end testing of deployed application.

**Test Checklist:**
- [ ] Access public URL from different devices
- [ ] Create account (anonymous auth)
- [ ] Test canvas pan and zoom
- [ ] Draw rectangles
- [ ] Reposition rectangles
- [ ] Open multiple browser windows
- [ ] Verify multiplayer cursors
- [ ] Verify shape sync across users
- [ ] Test locking system
- [ ] Test disconnect handling
- [ ] Verify persistence across sessions
- [ ] Test with 5+ concurrent users
- [ ] Create 500+ shapes and verify performance
- [ ] Check browser console for errors
- [ ] Verify all features from MVP checklist

**Dependencies:** Task 4.7

**Acceptance Criteria:**
- [ ] All MVP requirements met
- [ ] All performance targets met
- [ ] Application ready for submission

---

### Task 4.9: Documentation & README
**Status:** [ ]  
**Priority:** High  
**Estimated Effort:** 1 hour

**Description:**  
Create comprehensive README and documentation.

**README Sections:**
- [ ] Project title and description
- [ ] Features list
- [ ] Tech stack
- [ ] Setup instructions
- [ ] Environment variables
- [ ] Running locally
- [ ] Deployment instructions
- [ ] Architecture overview
- [ ] Known limitations
- [ ] Future enhancements

**Dependencies:** Task 4.8

---

### Task 4.10: Create Demo Video
**Status:** [ ]  
**Priority:** Critical  
**Estimated Effort:** 1 hour

**Description:**  
Record 3-5 minute demo video showing all MVP features.

**Video Sections:**
- [ ] Introduction (15 seconds)
- [ ] Canvas pan and zoom demo (30 seconds)
- [ ] Multiplayer presence demo (45 seconds)
- [ ] Shape drawing and sync demo (60 seconds)
- [ ] Shape manipulation and locking demo (60 seconds)
- [ ] Architecture explanation (45 seconds)
- [ ] Conclusion (15 seconds)

**Requirements:**
- [ ] Clear screen recording
- [ ] Audio narration (optional but recommended)
- [ ] Multiple browser windows shown
- [ ] Real-time sync demonstrated
- [ ] 3-5 minutes total length

**Dependencies:** Task 4.9

---

## MVP Completion Checklist

Before considering MVP complete, verify ALL items:

### Core Features
- [ ] Canvas renders full-screen with pan/zoom
- [ ] Pan constrained to canvas boundaries
- [ ] Zoom respects min/max limits with cursor focus
- [ ] Anonymous authentication working
- [ ] User assigned unique ID and color
- [ ] Multiplayer cursors visible and synced
- [ ] Presence system shows who's online
- [ ] Can draw rectangles with press/drag/release
- [ ] Rectangles filled with user's color
- [ ] Rectangles constrained to canvas bounds
- [ ] In-progress drawings visible to all users
- [ ] Completed rectangles sync across users
- [ ] Can reposition rectangles via drag
- [ ] Repositioned rectangles stay in bounds
- [ ] Locked shapes show red border
- [ ] Cannot interact with shapes locked by others
- [ ] Shapes persist across sessions
- [ ] Lock released on disconnect

### Performance
- [ ] 60 FPS maintained during pan/zoom
- [ ] 60 FPS maintained during shape manipulation
- [ ] Cursor sync <50ms latency
- [ ] Shape sync <100ms latency
- [ ] Supports 500+ shapes without degradation
- [ ] Supports 5+ concurrent users

### Deployment
- [ ] Application deployed to public URL
- [ ] HTTPS enabled
- [ ] All features work in production
- [ ] Tested with multiple users remotely

### Documentation
- [ ] README with setup instructions
- [ ] Architecture documented
- [ ] Demo video created
- [ ] GitHub repository organized

---

## Post-MVP Enhancements (Out of Scope)

These features are NOT required for MVP but documented for future reference:

- [ ] Shape selection system (click to select)
- [ ] Multiple shape types (circles, lines, text)
- [ ] Shape transformation (resize, rotate)
- [ ] Delete and duplicate operations
- [ ] Undo/redo functionality
- [ ] Layer management
- [ ] Color picker
- [ ] Keyboard shortcuts
- [ ] Export canvas as image
- [ ] Multiple canvas rooms
- [ ] Named user accounts
- [ ] AI agent integration
- [ ] Touch/mobile support
- [ ] Collaborative text editing
- [ ] Comments and annotations

---

## Notes

**Task Estimation Guidelines:**
- Small: 30 minutes - 1 hour
- Medium: 1-2 hours
- Large: 2-4 hours
- Critical path items marked with "Critical" priority

**Testing Strategy:**
- Test each task individually before moving to next
- Run multi-user tests at end of each stage
- Continuous performance monitoring throughout

**Risk Mitigation:**
- If any task takes significantly longer than estimated, reassess approach
- If performance issues arise, optimize immediately before proceeding
- If sync latency issues occur, verify Realtime DB setup and throttling

**Development Tips:**
- Commit frequently to git
- Test with multiple browsers throughout development
- Use browser dev tools Network tab to monitor Firebase traffic
- Use React DevTools to identify unnecessary re-renders
- Keep console clear of warnings and errors

---

## Appendix: Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Firebase
firebase deploy

# Check bundle size
npm run build && ls -lh dist/assets

# Type checking
npx tsc --noEmit
```

---

**End of Task List**