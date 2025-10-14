# Architecture Diagram - CollabCanvas MVP

**Project:** CollabCanvas  
**Version:** 1.0

---

## System Architecture Overview

CollabCanvas uses a hybrid Firebase architecture with React/Konva frontend to achieve real-time collaborative canvas functionality with optimal performance.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser1[Browser Client 1]
        Browser2[Browser Client 2]
        Browser3[Browser Client N]
    end
    
    subgraph "Firebase Services"
        Auth[Firebase Auth<br/>Anonymous Authentication]
        RTDB[Realtime Database<br/>Ephemeral Data<br/>&lt;50ms latency]
        Firestore[Firestore<br/>Persistent Data<br/>&lt;150ms latency]
    end
    
    subgraph "Deployment"
        Vercel[Vercel/Firebase Hosting<br/>Static Asset Delivery]
    end
    
    Browser1 <-->|Auth| Auth
    Browser2 <-->|Auth| Auth
    Browser3 <-->|Auth| Auth
    
    Browser1 <-->|Cursors, Locks,<br/>In-Progress Draws| RTDB
    Browser2 <-->|Cursors, Locks,<br/>In-Progress Draws| RTDB
    Browser3 <-->|Cursors, Locks,<br/>In-Progress Draws| RTDB
    
    Browser1 <-->|Completed Shapes,<br/>Canvas State| Firestore
    Browser2 <-->|Completed Shapes,<br/>Canvas State| Firestore
    Browser3 <-->|Completed Shapes,<br/>Canvas State| Firestore
    
    Vercel -->|Serve App| Browser1
    Vercel -->|Serve App| Browser2
    Vercel -->|Serve App| Browser3
```

---

## Data Flow Architecture

```mermaid
graph LR
    subgraph "User Actions"
        MouseMove[Mouse Move]
        StartDraw[Start Drawing]
        DuringDraw[During Draw]
        CompleteDraw[Complete Draw]
        StartDrag[Start Drag Shape]
        DuringDrag[During Drag]
        CompleteDrag[Complete Drag]
    end
    
    subgraph "Local State"
        ReactState[React State<br/>useState/useRef]
        KonvaStage[Konva Stage<br/>Canvas Rendering]
    end
    
    subgraph "Firebase Realtime DB"
        Cursors[/presence/{userId}/cursor]
        TempShapes[/temp-shapes/{shapeId}]
        Locks[/locks/{shapeId}]
    end
    
    subgraph "Firebase Firestore"
        Shapes[canvases/{id}/shapes]
        Metadata[canvases/{id}/metadata]
    end
    
    MouseMove -->|Throttled 30fps| Cursors
    Cursors -->|Real-time Sync| ReactState
    
    StartDraw -->|Create temp| TempShapes
    DuringDraw -->|Update position/size| TempShapes
    CompleteDraw -->|Save final| Shapes
    CompleteDraw -->|Delete temp| TempShapes
    
    StartDrag -->|Acquire| Locks
    StartDrag -->|Create temp position| TempShapes
    DuringDrag -->|Update position| TempShapes
    CompleteDrag -->|Save final| Shapes
    CompleteDrag -->|Release| Locks
    CompleteDrag -->|Delete temp| TempShapes
    
    ReactState -->|Render| KonvaStage
    Shapes -->|Subscribe| ReactState
    TempShapes -->|Subscribe| ReactState
    Locks -->|Subscribe| ReactState
```

---

## Component Architecture

```mermaid
graph TB
    subgraph "App Root"
        App[App.tsx<br/>Main Application Container]
    end
    
    subgraph "Layout Components"
        Toolbar[Toolbar.tsx<br/>Draw Mode Toggle<br/>Presence Indicator]
        Canvas[Canvas.tsx<br/>Main Canvas Container<br/>Konva Stage & Layer]
    end
    
    subgraph "Canvas Children"
        CanvasBoundary[Canvas Boundary<br/>Visual Rectangle]
        Shapes[Shape Components<br/>Rendered Rectangles]
        Cursors[Multiplayer Cursors<br/>Other Users' Positions]
        TempShapes[Temp Shapes<br/>In-Progress Draws/Drags]
    end
    
    subgraph "Reusable Components"
        Shape[Shape.tsx<br/>Individual Shape Renderer<br/>Handles Drag Events]
        Cursor[MultiplayerCursor.tsx<br/>Cursor + Label]
    end
    
    App --> Toolbar
    App --> Canvas
    Canvas --> CanvasBoundary
    Canvas --> Shapes
    Canvas --> Cursors
    Canvas --> TempShapes
    Shapes --> Shape
    TempShapes --> Shape
    Cursors --> Cursor
```

---

## State Management Architecture

```mermaid
graph TB
    subgraph "Custom Hooks"
        useAuth[useAuth<br/>Anonymous Auth<br/>User ID & Color]
        usePresence[usePresence<br/>Sync User Presence<br/>Get Other Users]
        useShapes[useShapes<br/>Subscribe to Firestore<br/>Persistent Shapes]
        useTempShapes[useTempShapes<br/>Subscribe to RTDB<br/>In-Progress Shapes]
        useLocks[useLocks<br/>Acquire/Release Locks<br/>Check Lock State]
        useThrottle[useThrottle<br/>Throttle High-Freq Updates]
    end
    
    subgraph "Local State (Canvas.tsx)"
        StageState[Stage Position & Scale<br/>Pan/Zoom State]
        WindowSize[Window Dimensions]
        DrawMode[Drawing Mode Active]
        CurrentShape[Current Drawing Shape]
    end
    
    subgraph "Services"
        FirebaseService[firebase.ts<br/>Firebase Initialization<br/>db, rtdb, auth exports]
        ShapeService[shapeService.ts<br/>CRUD Operations<br/>Firestore Helpers]
        CanvasService[canvasService.ts<br/>Canvas Init<br/>Canvas ID Management]
    end
    
    useAuth --> FirebaseService
    usePresence --> FirebaseService
    useShapes --> FirebaseService
    useShapes --> ShapeService
    useTempShapes --> FirebaseService
    useLocks --> FirebaseService
    
    StageState --> Canvas
    WindowSize --> Canvas
    DrawMode --> Canvas
    CurrentShape --> Canvas
```

---

## Firebase Data Structure

```mermaid
graph TB
    subgraph "Firestore (Persistent)"
        FS_Root[Firestore Root]
        FS_Canvases[canvases/]
        FS_Canvas[canvasId]
        FS_Metadata[metadata:<br/>createdAt, lastModified]
        FS_Shapes[shapes/ subcollection]
        FS_Shape[shapeId:<br/>id, type, x, y,<br/>width, height, fill,<br/>createdBy, timestamps]
        
        FS_Root --> FS_Canvases
        FS_Canvases --> FS_Canvas
        FS_Canvas --> FS_Metadata
        FS_Canvas --> FS_Shapes
        FS_Shapes --> FS_Shape
    end
    
    subgraph "Realtime Database (Ephemeral)"
        RT_Root[Realtime DB Root]
        RT_Canvases[canvases/]
        RT_Canvas[canvasId/]
        RT_Presence[presence/]
        RT_User[userId:<br/>userId, color,<br/>cursor: x y,<br/>timestamp, isActive]
        RT_TempShapes[temp-shapes/]
        RT_TempShape[shapeId:<br/>id, type, x, y,<br/>width, height, fill,<br/>isInProgress, userId]
        RT_Locks[locks/]
        RT_Lock[shapeId:<br/>userId, timestamp,<br/>shapeId]
        
        RT_Root --> RT_Canvases
        RT_Canvases --> RT_Canvas
        RT_Canvas --> RT_Presence
        RT_Canvas --> RT_TempShapes
        RT_Canvas --> RT_Locks
        RT_Presence --> RT_User
        RT_TempShapes --> RT_TempShape
        RT_Locks --> RT_Lock
    enddAt, lastModified]
        FS_Shapes[shapes/ subcollection]
        FS_Shape[{shapeId}:<br/>id, type, x, y,<br/>width, height, fill,<br/>createdBy, timestamps]
        
        FS_Root --> FS_Canvases
        FS_Canvases --> FS_Canvas
        FS_Canvas --> FS_Metadata
        FS_Canvas --> FS_Shapes
        FS_Shapes --> FS_Shape
    end
    
    subgraph "Realtime Database (Ephemeral)"
        RT_Root[⚡ Realtime DB Root]
        RT_Canvases[canvases/]
        RT_Canvas[{canvasId}/]
        RT_Presence[presence/]
        RT_User[{userId}:<br/>userId, color,<br/>cursor: {x, y},<br/>timestamp, isActive]
        RT_TempShapes[temp-shapes/]
        RT_TempShape[{shapeId}:<br/>id, type, x, y,<br/>width, height, fill,<br/>isInProgress, userId]
        RT_Locks[locks/]
        RT_Lock[{shapeId}:<br/>userId, timestamp,<br/>shapeId]
        
        RT_Root --> RT_Canvases
        RT_Canvases --> RT_Canvas
        RT_Canvas --> RT_Presence
        RT_Canvas --> RT_TempShapes
        RT_Canvas --> RT_Locks
        RT_Presence --> RT_User
        RT_TempShapes --> RT_TempShape
        RT_Locks --> RT_Lock
    end
```

---

## User Interaction Flow Diagrams

### Flow 1: Canvas Pan & Zoom

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Canvas Component
    participant Konva Stage
    
    User->>Browser: Scroll (Pan)
    Browser->>Canvas Component: onWheel event
    Canvas Component->>Canvas Component: Calculate new position
    Canvas Component->>Canvas Component: Constrain to boundaries
    Canvas Component->>Canvas Component: Update stagePos state
    Canvas Component->>Konva Stage: Re-render with new position
    Konva Stage->>Browser: Display updated view
    
    User->>Browser: Cmd+Scroll (Zoom)
    Browser->>Canvas Component: onWheel event (with metaKey)
    Canvas Component->>Canvas Component: Calculate zoom limits
    Canvas Component->>Canvas Component: Calculate new scale & position
    Canvas Component->>Canvas Component: Constrain to boundaries
    Canvas Component->>Canvas Component: Update scale & position state
    Canvas Component->>Konva Stage: Re-render with new scale/position
    Konva Stage->>Browser: Display zoomed view
```

### Flow 2: Drawing a Rectangle

```mermaid
sequenceDiagram
    participant User A
    participant Browser A
    participant Canvas A
    participant Realtime DB
    participant Firestore
    participant Canvas B
    participant Browser B
    participant User B
    
    User A->>Browser A: Click "Draw Rect"
    Browser A->>Canvas A: Toggle draw mode ON
    
    User A->>Browser A: Mouse Down on canvas
    Browser A->>Canvas A: Start drawing
    Canvas A->>Canvas A: Create temp rectangle
    Canvas A->>Realtime DB: Write to /temp-shapes/{userId}
    Canvas A->>Browser A: Render in-progress rect
    
    Realtime DB-->>Canvas B: Push update
    Canvas B->>Browser B: Render User A's in-progress rect
    Browser B->>User B: See rectangle being drawn
    
    User A->>Browser A: Drag mouse
    Browser A->>Canvas A: Update rectangle size
    Canvas A->>Realtime DB: Update /temp-shapes/{userId}
    Canvas A->>Browser A: Render growing rect
    
    Realtime DB-->>Canvas B: Push update
    Canvas B->>Browser B: Update rect size
    
    User A->>Browser A: Mouse Up
    Browser A->>Canvas A: Complete drawing
    Canvas A->>Canvas A: Normalize rectangle
    Canvas A->>Firestore: Save to /shapes/{shapeId}
    Canvas A->>Realtime DB: Delete /temp-shapes/{userId}
    Canvas A->>Browser A: Render completed rect
    
    Firestore-->>Canvas B: Push new shape
    Realtime DB-->>Canvas B: Remove temp shape
    Canvas B->>Browser B: Render completed rect
    Browser B->>User B: See final rectangle
```

### Flow 3: Repositioning a Shape (with Locking)

```mermaid
sequenceDiagram
    participant User A
    participant Canvas A
    participant Realtime DB
    participant Firestore
    participant Canvas B
    participant User B
    
    User A->>Canvas A: Click and drag shape
    Canvas A->>Canvas A: onDragStart event
    Canvas A->>Realtime DB: Acquire lock /locks/{shapeId}
    Canvas A->>Realtime DB: Create temp position /temp-shapes/{shapeId}
    
    Realtime DB-->>Canvas B: Push lock update
    Canvas B->>Canvas B: Mark shape as locked
    Canvas B->>User B: Display red border on shape
    
    User A->>Canvas A: Drag shape
    Canvas A->>Canvas A: Constrain to boundaries
    Canvas A->>Realtime DB: Update /temp-shapes/{shapeId} position
    
    Realtime DB-->>Canvas B: Push position update
    Canvas B->>User B: Show shape moving in real-time
    
    User B->>Canvas B: Try to drag same shape
    Canvas B->>Canvas B: Check lock status
    Canvas B->>User B: Prevent interaction (shape locked)
    
    User A->>Canvas A: Release mouse (onDragEnd)
    Canvas A->>Canvas A: Constrain final position
    Canvas A->>Firestore: Update shape position /shapes/{shapeId}
    Canvas A->>Realtime DB: Release lock /locks/{shapeId}
    Canvas A->>Realtime DB: Delete temp position /temp-shapes/{shapeId}
    
    Firestore-->>Canvas B: Push final position
    Realtime DB-->>Canvas B: Remove lock & temp position
    Canvas B->>Canvas B: Remove red border
    Canvas B->>User B: Shape unlocked, final position updated
```

### Flow 4: User Presence & Cursor Sync

```mermaid
sequenceDiagram
    participant User A
    participant Canvas A
    participant Auth
    participant Realtime DB
    participant Canvas B
    participant User B
    
    User A->>Canvas A: Load application
    Canvas A->>Auth: signInAnonymously()
    Auth-->>Canvas A: Return user ID
    Canvas A->>Canvas A: Generate random color
    Canvas A->>Realtime DB: Write /presence/{userId}
    Canvas A->>Realtime DB: Set onDisconnect() handler
    
    Realtime DB-->>Canvas B: Push new user presence
    Canvas B->>User B: Show User A's cursor appears
    
    User A->>Canvas A: Move mouse
    Canvas A->>Canvas A: Throttle (30fps)
    Canvas A->>Realtime DB: Update /presence/{userId}/cursor
    
    Realtime DB-->>Canvas B: Push cursor position
    Canvas B->>User B: User A's cursor moves smoothly
    
    User A->>Canvas A: Close browser/tab
    Auth->>Realtime DB: Trigger onDisconnect()
    Realtime DB->>Realtime DB: Remove /presence/{userId}
    
    Realtime DB-->>Canvas B: Push presence removal
    Canvas B->>User B: User A's cursor disappears
```

---

## Performance Optimization Strategy

```mermaid
graph TB
    subgraph "Frontend Optimizations"
        Throttle[Throttle Cursor Updates<br/>30fps instead of 60fps]
        Memo[React.memo on Shape Component<br/>Prevent unnecessary re-renders]
        UseMemo[useMemo for Calculations<br/>Zoom limits, constraints]
        Layers[Konva Layers<br/>Separate static/dynamic content]
        PerfDraw[perfectDrawEnabled: false<br/>Faster rendering]
    end
    
    subgraph "Firebase Optimizations"
        BatchWrites[Batch Firestore Writes<br/>Reduce network calls]
        IndexedData[Indexed Queries<br/>Fast shape retrieval]
        RTDB_Speed[Realtime DB for High-Freq<br/>Sub-50ms latency]
        Offline[Offline Persistence<br/>Reduce network dependency]
    end
    
    subgraph "State Management"
        LocalFirst[Optimistic Updates<br/>Update local immediately]
        Cleanup[Proper Cleanup<br/>useEffect return functions]
        Batching[React Batching<br/>Group state updates]
    end
    
    subgraph "Performance Targets"
        FPS[60 FPS maintained]
        CursorLatency[Cursor sync &lt;50ms]
        ShapeLatency[Shape sync &lt;100ms]
        Scale[500+ shapes, 5+ users]
    end
    
    Throttle --> CursorLatency
    Memo --> FPS
    UseMemo --> FPS
    Layers --> FPS
    PerfDraw --> FPS
    
    RTDB_Speed --> CursorLatency
    BatchWrites --> ShapeLatency
    IndexedData --> ShapeLatency
    
    LocalFirst --> FPS
    LocalFirst --> CursorLatency
    Cleanup --> FPS
    Batching --> FPS
    
    CursorLatency --> Scale
    ShapeLatency --> Scale
    FPS --> Scale
```

---

## Technology Stack Detail

```mermaid
graph LR
    subgraph "Frontend"
        React[React 18+<br/>UI Framework]
        TS[TypeScript<br/>Type Safety]
        Vite[Vite<br/>Build Tool]
        Konva[Konva.js<br/>Canvas Rendering]
        ReactKonva[react-konva<br/>React Integration]
    end
    
    subgraph "Backend Services"
        FBAuth[Firebase Auth<br/>Anonymous Users]
        FBRTDB[Firebase Realtime DB<br/>Ephemeral Data]
        FBFS[Firebase Firestore<br/>Persistent Data]
    end
    
    subgraph "Utilities"
        UUID[uuid<br/>Unique IDs]
    end
    
    subgraph "Deployment"
        VercelHost[Vercel or<br/>Firebase Hosting]
    end
    
    React --> Konva
    React --> ReactKonva
    React --> TS
    Vite --> React
    
    React --> FBAuth
    React --> FBRTDB
    React --> FBFS
    React --> UUID
    
    Vite --> VercelHost
```

---

## Folder Structure

```
collab-canvas/
├── project_scaffolding/         # Project planning documents
│   ├── PRD.md                   # Product Requirements Document
│   ├── TASK_LIST.md             # Development task list
│   └── ARCHITECTURE.md          # This file - system architecture
│
├── public/                      # Static assets
├── src/
│   ├── components/              # React components
│   │   ├── Canvas.tsx          # Main canvas container
│   │   ├── Shape.tsx           # Individual shape renderer
│   │   ├── MultiplayerCursor.tsx  # Cursor component
│   │   └── Toolbar.tsx         # Top toolbar
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts          # Anonymous authentication
│   │   ├── usePresence.ts      # User presence system
│   │   ├── useShapes.ts        # Firestore shapes subscription
│   │   ├── useTempShapes.ts    # Realtime DB temp shapes
│   │   ├── useLocks.ts         # Shape locking system
│   │   └── useThrottle.ts      # Throttle utility
│   │
│   ├── services/                # Firebase and API services
│   │   ├── firebase.ts         # Firebase initialization
│   │   ├── shapeService.ts     # Shape CRUD operations
│   │   └── canvasService.ts    # Canvas initialization
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── canvas.ts           # Canvas types
│   │   ├── shape.ts            # Shape types
│   │   ├── user.ts             # User types
│   │   └── presence.ts         # Presence types
│   │
│   ├── utils/                   # Utility functions
│   │   ├── shapeHelpers.ts     # Shape creation/manipulation
│   │   ├── constraints.ts      # Boundary constraint logic
│   │   └── colors.ts           # Color generation
│   │
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts           # Vite types
│
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Security Considerations

### Firebase Security Rules

**Firestore (Test Mode - Acceptable for MVP):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Realtime Database (Test Mode - Acceptable for MVP):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Production Security (Future Enhancement)

For production deployment beyond MVP, implement:
- Authenticated users only
- User can only write their own presence
- Shape writes require authentication
- Lock validation (user owns the lock)
- Rate limiting to prevent abuse

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Local Development<br/>npm run dev<br/>localhost:5173]
    end
    
    subgraph "Build Process"
        Build[npm run build<br/>Vite Production Build]
        Assets[Static Assets<br/>dist/ folder<br/>HTML, CSS, JS, Images]
    end
    
    subgraph "Hosting Platform"
        Vercel[Vercel or Firebase Hosting<br/>CDN Distribution<br/>HTTPS Enabled]
    end
    
    subgraph "Firebase Backend"
        FBServices[Firebase Services<br/>Auth, Firestore, RTDB<br/>Always Available]
    end
    
    subgraph "Users"
        Users[Global Users<br/>Access via HTTPS]
    end
    
    Dev --> Build
    Build --> Assets
    Assets --> Vercel
    Vercel --> Users
    Users <--> FBServices
```

---

## Scalability Considerations

### Current Architecture Supports:
- **Users:** 5-10 concurrent users comfortably
- **Shapes:** 500+ shapes without performance degradation
- **Latency:** <50ms for cursors, <100ms for shapes
- **Data Size:** Limited by Firebase free tier quotas

### Future Scaling Strategies:
1. **Horizontal Scaling:**
   - Multiple canvas rooms (multi-tenancy)
   - Partition by canvas ID
   - Independent Firestore documents per canvas

2. **Performance Optimization:**
   - Implement virtual scrolling for large shape counts
   - Use Konva's caching for static shapes
   - Lazy load shapes outside viewport

3. **Backend Optimization:**
   - Implement Firebase indexes for complex queries
   - Use Cloud Functions for server-side validation
   - Upgrade to Firebase paid tier for higher quotas

4. **Network Optimization:**
   - Implement delta sync (only send changes)
   - Compress large payloads
   - Use Firebase's built-in offline persistence

---

## Error Handling Strategy

```mermaid
graph TB
    subgraph "Error Types"
        AuthError[Authentication Errors]
        NetworkError[Network/Connection Errors]
        FirebaseError[Firebase Write Errors]
        ValidationError[Data Validation Errors]
        BoundaryError[Boundary Constraint Errors]
    end
    
    subgraph "Handling Mechanisms"
        TryCatch[Try-Catch Blocks<br/>Around Firebase calls]
        Fallback[Fallback UI<br/>Graceful degradation]
        Retry[Retry Logic<br/>Exponential backoff]
        Logging[Console Logging<br/>Debug information]
        UserFeedback[User Notifications<br/>Error messages]
    end
    
    subgraph "Recovery Actions"
        Reconnect[Auto-reconnect]
        LocalState[Maintain local state]
        Rollback[Rollback failed changes]
        Refresh[Suggest refresh]
    end
    
    AuthError --> TryCatch
    NetworkError --> TryCatch
    FirebaseError --> TryCatch
    ValidationError --> TryCatch
    BoundaryError --> TryCatch
    
    TryCatch --> Logging
    TryCatch --> UserFeedback
    TryCatch --> Fallback
    TryCatch --> Retry
    
    Retry --> Reconnect
    Fallback --> LocalState
    FirebaseError --> Rollback
    NetworkError --> Refresh
```

---

## Testing Strategy

### Unit Testing (Future Enhancement)
- Utility functions (constraints, helpers)
- Shape creation/normalization
- Throttle/debounce logic

### Integration Testing
- Canvas pan/zoom behavior
- Shape drawing and persistence
- Multi-user synchronization
- Lock acquisition and release

### Manual Testing Checklist
- ✅ Single user interaction
- ✅ Multi-user real-time sync
- ✅ Performance under load (500+ shapes)
- ✅ Network disconnection handling
- ✅ Browser compatibility
- ✅ Different screen sizes

---

## Key Design Decisions

### Why Hybrid Firebase Architecture?

**Decision:** Use Realtime Database for ephemeral data + Firestore for persistent data

**Rationale:**
- Realtime DB provides <50ms latency for cursors (critical UX)
- Firestore offers better structure for persistent shapes
- Separates concerns: temporary vs. permanent data
- Optimizes costs: ephemeral data auto-deleted

### Why Konva.js?

**Decision:** Use Konva.js instead of raw Canvas API or SVG

**Rationale:**
- High-performance canvas rendering (60 FPS)
- Built-in shape primitives and event handling
- Layer system for optimization
- React integration via react-konva
- Easier than raw Canvas, faster than SVG

### Why Optimistic Updates?

**Decision:** Update local state immediately, sync to Firebase in background

**Rationale:**
- Maintains 60 FPS regardless of network latency
- Better user experience (instant feedback)
- Rollback rarely needed (low conflict rate)
- Industry standard for collaborative apps

### Why Single Canvas for MVP?

**Decision:** All users share one canvas ("default-canvas")

**Rationale:**
- Simpler MVP implementation
- Easier testing and demonstration
- Reduces complexity in state management
- Easy to extend to multi-room later

---

## Future Architecture Enhancements

### Phase 2: AI Agent Integration (Post-MVP)

```mermaid
graph TB
    User[User] -->|Natural Language| AIInterface[AI Interface]
    AIInterface -->|Parse Command| LLM[OpenAI/Claude API]
    LLM -->|Function Calls| AIAgent[AI Agent Service]
    AIAgent -->|Create Shapes| ShapeService[Shape Service]
    AIAgent -->|Query Canvas| CanvasState[Canvas State]
    ShapeService -->|Write| Firestore[Firestore]
    Firestore -->|Sync| AllClients[All Clients]
```

### Phase 3: Advanced Features

- Multi-room support with room codes
- Named user accounts with profiles
- Advanced shape types (circles, lines, text, images)
- Shape transformation tools (resize, rotate)
- Layer management and z-index
- Undo/redo with command pattern
- Export canvas to image/PDF
- Comments and annotations

---

## Monitoring & Observability

### Metrics to Track (Future)
- Real-time user count
- Average cursor sync latency
- Average shape sync latency
- Firebase read/write operations per second
- Canvas frame rate
- Error rates by type
- User session duration

### Tools
- Firebase Console for usage metrics
- Browser Performance API for FPS tracking
- Custom logging for debugging
- Sentry or similar for error tracking (future)

---

## Conclusion

This architecture provides a solid foundation for real-time collaborative canvas functionality while maintaining excellent performance and user experience. The hybrid Firebase approach optimally balances latency requirements with data persistence needs, and the modular component structure allows for future enhancements including AI agent integration.

---

**End of Architecture Document**