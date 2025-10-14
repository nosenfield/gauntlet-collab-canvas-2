# Product Requirements Document (PRD)
# CollabCanvas MVP

**Version:** 1.0  
**Status:** MVP Specification

---

## Executive Summary

CollabCanvas is a real-time collaborative canvas application that enables multiple users to simultaneously create and manipulate shapes on a shared workspace. This MVP focuses on establishing robust multiplayer infrastructure with basic shape manipulation capabilities.

---

## Product Vision

Build a Figma-like collaborative canvas that demonstrates real-time synchronization, multiplayer presence, and shared state management as the foundation for future AI-assisted design capabilities.

---

## Success Criteria

### MVP Gate Requirements
- Basic canvas with pan/zoom functionality
- Rectangle shape creation and manipulation
- Real-time synchronization between 2+ users
- Multiplayer cursors with user identification
- Presence awareness (who's online)
- Anonymous user authentication
- State persistence across sessions
- Publicly deployed and accessible

### Performance Targets
- Maintain 60 FPS during all interactions
- Sync object changes across users in <100ms
- Sync cursor positions in <50ms
- Support 500+ objects without performance degradation
- Support 5+ concurrent users

---

## Target Users

- **Primary:** Development team testing collaborative infrastructure
- **Secondary:** Future designers and teams using collaborative design tools

---

## Technical Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Canvas Library:** Konva.js with react-konva
- **State Management:** React hooks (useState, useEffect, useRef)

### Backend
- **Persistent Storage:** Firebase Firestore (completed shapes, canvas metadata)
- **Real-time Data:** Firebase Realtime Database (cursors, in-progress draws, presence)
- **Authentication:** Firebase Anonymous Auth
- **Sync Strategy:** Hybrid dual-database approach for optimal performance

### Deployment
- **Hosting:** Vercel or Firebase Hosting

---

## Functional Requirements

### 1. Canvas System

#### 1.1 Canvas Display
- **Fixed dimensions:** 10,000px × 10,000px virtual space
- **Full-screen rendering:** Canvas fills the entire browser viewport
- **Boundary enforcement:** Users never see outside the canvas boundaries

#### 1.2 Pan Controls
- **Mechanism:** Scroll-based panning (trackpad/mouse wheel)
- **Constraints:** 
  - Viewport must remain within canvas boundaries at all times
  - No overscroll beyond canvas edges
  - Smooth panning with momentum preservation

#### 1.3 Zoom Controls
- **Mechanism:** Cmd/Ctrl + Scroll for zoom in/out
- **Zoom focal point:** User's cursor position
- **Zoom limits:**
  - **Maximum zoom in:** 100px across the smallest window dimension (height or width)
  - **Maximum zoom out:** Full canvas visible across the larger window dimension
- **Viewport resize behavior:**
  - Maintain current zoom level when viewport grows
  - If maintaining zoom would expose area outside canvas, adjust view via translation first, scale only if necessary
  - Never show area outside canvas boundaries

#### 1.4 Performance
- Maintain 60 FPS during pan, zoom, and object manipulation
- Efficient rendering with Konva's layer system

---

### 2. User Authentication & Presence

#### 2.1 Anonymous Authentication
- **Login:** Automatic anonymous sign-in on app load
- **User Identity:** 
  - Randomly generated User ID (e.g., "User-a3f9b2")
  - Unique color assigned to each user (any random color, not guaranteed unique)
- **Session:** Persistent across page refreshes until browser data cleared

#### 2.2 Presence System
- **Cursor Display:**
  - Each user's cursor position visible to all other users
  - Cursor rendered in user's assigned color
  - Label showing user ID next to cursor
- **Real-time Updates:**
  - Cursor positions sync in <50ms
  - Cursors update smoothly without jitter
- **Connection Status:**
  - User presence appears when they join
  - User presence disappears when they disconnect/close window
  - Visual indicator of who's currently online

#### 2.3 Presence Data Structure
```typescript
{
  userId: string;
  color: string;
  cursorX: number;
  cursorY: number;
  timestamp: number;
  isActive: boolean;
}
```

---

### 3. Shape Management

#### 3.1 Rectangle Creation

##### 3.1.1 Drawing Mode Toggle
- **UI Element:** "Draw Rect" button in top toolbar
- **States:** Active (drawing enabled) / Inactive (drawing disabled)
- **Visual feedback:** Button state clearly indicates current mode

##### 3.1.2 Drawing Interaction
- **Trigger:** Click and drag on canvas while in draw mode
- **Process:**
  1. **Press:** Mouse down establishes first vertex (top-left corner)
  2. **Drag:** Rectangle dynamically sizes as mouse moves
  3. **Release:** Mouse up establishes second vertex (bottom-right corner) and completes shape
- **Properties:**
  - Fill color: User's assigned color
  - Stroke: None for MVP
  - Opacity: 100%

##### 3.1.3 Drawing Constraints
- **Boundary enforcement:** Rectangle must remain entirely within canvas bounds
- **Behavior at boundary:** 
  - Prevent drawing outside bounds entirely
  - If drag would exceed boundary, clamp rectangle size to canvas edge
- **Minimum size:** 10px × 10px to prevent accidental micro-rectangles

#### 3.2 Real-time Drawing Sync
- **In-progress drawings:** Visible to all users during drag operation
- **Update frequency:** Position and size updates stream in real-time
- **Completion sync:** Final rectangle broadcasts to all users on mouse release
- **Sync latency:** <100ms for completed shapes

#### 3.3 Rectangle Manipulation

##### 3.3.1 Repositioning (MVP)
- **Trigger:** Click and drag on existing rectangle (post-MVP: requires selection first)
- **Behavior:**
  - Rectangle follows cursor during drag
  - Position updates stream to all users in real-time
  - Rectangle must remain within canvas boundaries
- **Boundary enforcement:** Clamp position to keep entire rectangle inside canvas

##### 3.3.2 Object Locking
- **Lock state:** When user is drawing or repositioning a rectangle
- **Visual indicator:** Locked rectangle displays 10px red border
- **Lock scope:** Other users cannot interact with locked objects
- **Lock release:** Automatic on mouse release or user disconnect

##### 3.3.3 Selection (Post-MVP)
- Click to select rectangle
- Selection state not required for MVP drag interaction

#### 3.4 Shape Persistence
- **Storage:** All completed rectangles saved to Firestore
- **Structure:**
```typescript
{
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: timestamp;
  lockedBy: string | null;
  lastModified: timestamp;
}
```
- **Load behavior:** All shapes load on canvas initialization
- **Session persistence:** Shapes persist even if all users disconnect

---

### 4. Real-time Synchronization

#### 4.1 Architecture Overview
- **Hybrid dual-database strategy:**
  - **Firestore:** Persistent storage for completed shapes and canvas metadata
  - **Realtime Database:** Ephemeral data for cursors, in-progress draws, and presence
- **Rationale:** Realtime DB provides <50ms latency for high-frequency updates, while Firestore offers better querying and structure for persistent data
- **Update strategy:** Optimistic local updates with background sync
- **Conflict resolution:** Last write wins (acceptable for MVP)

#### 4.2 Data Routing

##### 4.2.1 Firestore (Persistent Data)
- Completed shapes
- Canvas metadata
- Final shape positions after drag completion
- Target latency: <150ms (acceptable for persistence operations)

##### 4.2.2 Realtime Database (Ephemeral Data)
- Live cursor positions
- In-progress drawing state (during drag)
- User presence heartbeats
- Shape lock states
- Target latency: <50ms (critical for smooth UX)

#### 4.3 Sync Operations

##### 4.3.1 Cursor Position
- **Storage:** Realtime Database at `/presence/{userId}/cursor`
- **Update frequency:** Throttled to ~30 updates/second (every 33ms)
- **Target latency:** <50ms
- **Cleanup:** Automatic removal on disconnect via Realtime DB's onDisconnect()

##### 4.3.2 Shape Creation
- **In-progress (during drag):** 
  - Realtime DB at `/temp-shapes/{userId}/current`
  - Updates stream in real-time to all users
  - Deleted on completion
- **Completion:** 
  - Final shape written to Firestore `shapes` collection
  - Temp shape removed from Realtime DB
- **Target latency:** <50ms for in-progress, <150ms for persistence

##### 4.3.3 Shape Updates (Repositioning)
- **During drag:**
  - Position updates sent to Realtime DB at `/temp-shapes/{shapeId}`
  - Lock state broadcast via Realtime DB
- **On release:**
  - Final position written to Firestore
  - Temp data cleaned up
- **Target latency:** <50ms during drag, <150ms for final save

##### 4.3.4 Object Locking
- **Lock acquisition:** Written to Realtime DB at `/locks/{shapeId}`
- **Lock state:** `{ userId, timestamp, shapeId }`
- **Lock release:** Automatic via onDisconnect() or explicit on mouse release
- **Target latency:** <50ms

#### 4.4 Connection Management
- **Presence detection:** Realtime Database with automatic onDisconnect() handlers
- **Heartbeat:** Not required (Realtime DB handles this natively)
- **Reconnection:** Automatic reconnect with state restoration from Firestore
- **Cleanup:** Realtime DB automatically removes user data on disconnect
- **Stale lock removal:** Locks automatically released via onDisconnect()

---

## Data Schema

### Firebase Architecture

**Firestore:** Persistent, structured data
**Realtime Database:** Ephemeral, high-frequency data

### Firestore Structure

```
canvases/{canvasId}
  ├── metadata
  │   ├── createdAt: timestamp
  │   └── lastModified: timestamp
  │
  └── shapes (subcollection)
      └── {shapeId}
          ├── id: string
          ├── type: 'rectangle'
          ├── x: number
          ├── y: number
          ├── width: number
          ├── height: number
          ├── fill: string
          ├── createdBy: string
          ├── createdAt: timestamp
          └── lastModified: timestamp
```

### Realtime Database Structure

```json
{
  "canvases": {
    "{canvasId}": {
      "presence": {
        "{userId}": {
          "userId": "string",
          "color": "string",
          "cursor": {
            "x": "number",
            "y": "number"
          },
          "timestamp": "number",
          "isActive": "boolean"
        }
      },
      "temp-shapes": {
        "{shapeId-or-userId}": {
          "id": "string",
          "type": "rectangle",
          "x": "number",
          "y": "number",
          "width": "number",
          "height": "number",
          "fill": "string",
          "isInProgress": "boolean",
          "userId": "string"
        }
      },
      "locks": {
        "{shapeId}": {
          "userId": "string",
          "timestamp": "number",
          "shapeId": "string"
        }
      }
    }
  }
}
```

### Data Flow Examples

**Cursor Movement:**
1. User moves mouse
2. Throttled update (every 33ms) writes to Realtime DB `/presence/{userId}/cursor`
3. All clients receive update via Realtime DB listener
4. Cursors render at new position

**Shape Creation:**
1. User starts drawing (mousedown)
2. In-progress shape created in Realtime DB `/temp-shapes/{userId}`
3. During drag, shape updates stream to Realtime DB
4. All users see shape growing in real-time
5. On mouseup, final shape written to Firestore `/shapes/{shapeId}`
6. Temp shape deleted from Realtime DB

**Shape Repositioning:**
1. User clicks shape to drag
2. Lock created in Realtime DB `/locks/{shapeId}`
3. All users see red border via lock listener
4. During drag, position updates stream to Realtime DB `/temp-shapes/{shapeId}`
5. On release, final position saved to Firestore
6. Lock and temp data removed from Realtime DB

---

## User Interface Requirements

### Layout
```
┌─────────────────────────────────────┐
│  [Draw Rect]  [Logout]              │  ← Toolbar (40px height)
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Canvas Viewport             │
│        (10,000 × 10,000px)          │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Components
1. **Toolbar**
   - Fixed position at top
   - Draw Rect toggle button
   - User info display (optional)

2. **Canvas Viewport**
   - Full screen below toolbar
   - Renders Konva stage
   - Contains all shapes and cursors

3. **Multiplayer Cursors**
   - SVG or Konva shape for cursor
   - Text label with user ID
   - Colored to match user

4. **Shapes**
   - Rectangles with fill color
   - Red border when locked

---

## Non-Functional Requirements

### Performance
- 60 FPS during all interactions
- <100ms sync latency for shapes
- <50ms sync latency for cursors
- Support 500+ shapes without degradation
- Support 5+ concurrent users

### Scalability
- Architecture should support future AI agent integration
- Modular design for adding shape types (circles, lines, text)
- Extensible for selection, transformation tools

### Reliability
- Graceful handling of disconnects
- State persistence across sessions
- No data loss on user disconnect

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Desktop-focused (mobile support not required for MVP)

---

## Out of Scope (Post-MVP)

The following features are explicitly excluded from MVP:
- Shape selection system (click to select)
- Multiple shape types (circles, lines, text)
- Shape transformation (resize, rotate)
- Layer management
- Delete/duplicate operations
- Undo/redo
- Color picker
- Shape styling options
- Export functionality
- Multiple canvas rooms
- User accounts (named users)
- AI agent integration
- Keyboard shortcuts
- Touch/mobile support

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Canvas renders full-screen
- [ ] Pan stays within canvas boundaries
- [ ] Zoom respects min/max limits
- [ ] Zoom focuses on cursor position
- [ ] Draw Rect button toggles correctly
- [ ] Rectangle drawing works (press/drag/release)
- [ ] Rectangles stay within canvas boundaries
- [ ] Rectangle repositioning works
- [ ] Repositioned rectangles stay within bounds
- [ ] Locked rectangles show red border
- [ ] Multiple users see each other's cursors
- [ ] Cursor positions update smoothly
- [ ] Shapes sync across users
- [ ] In-progress drawings visible to all users
- [ ] Shapes persist after page refresh
- [ ] User presence disappears on disconnect

### Multi-User Testing
- Test with 2-3 browser windows simultaneously
- Verify cursor sync
- Verify shape creation sync
- Verify shape manipulation sync
- Test concurrent shape manipulation (locking)
- Test disconnect/reconnect scenarios

### Performance Testing
- Create 500+ rectangles and verify 60 FPS
- Test with 5+ concurrent users
- Monitor sync latency with browser dev tools

---

## Deployment Requirements

### Environment Variables
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
```

### Deployment Checklist
- [ ] Environment variables configured (including DATABASE_URL)
- [ ] Firebase Firestore enabled and security rules configured
- [ ] Firebase Realtime Database enabled and security rules configured
- [ ] Build optimized for production
- [ ] Deployed to Vercel or Firebase Hosting
- [ ] Public URL accessible
- [ ] HTTPS enabled
- [ ] CORS configured correctly

---

## Success Metrics

### MVP Acceptance Criteria
- [x] Canvas displays and fills viewport
- [x] Pan and zoom work within constraints
- [x] Users can draw rectangles
- [x] Rectangles sync across users in real-time
- [x] Multiplayer cursors visible and synced
- [x] User presence system working
- [x] Shapes persist across sessions
- [x] Application deployed and publicly accessible
- [x] 60 FPS performance maintained
- [x] 5+ concurrent users supported

---



## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Realtime DB and Firestore sync complexity | Medium | Clear data routing rules; separate concerns cleanly |
| Cursor sync creates jitter | Low | Throttle updates to 30fps; Realtime DB provides <50ms latency |
| Canvas performance degrades with many shapes | Medium | Implement Konva layer optimization; test at scale |
| Firestore writes exceed free tier | Low | Batch writes where possible; use Realtime DB for ephemeral data |
| Boundary math edge cases | Low | Comprehensive testing with various zoom levels |
| Lock state desync if disconnect during drag | Low | Realtime DB onDisconnect() automatically releases locks |

---

## Appendix

### Key Technical Decisions

**Why Firestore + Realtime Database Hybrid?**
- Realtime DB provides <50ms latency for cursors and in-progress operations
- Firestore offers better structure and querying for persistent shapes
- Separating ephemeral from persistent data optimizes both performance and cost
- Realtime DB's onDisconnect() handles presence cleanup automatically
- Best of both worlds: speed where needed, structure where it matters

**Why Konva.js?**
- High performance canvas rendering
- Built-in shape primitives
- Event handling system
- Layer management for optimization

**Why Anonymous Auth?**
- Faster MVP development
- No user management overhead
- Sufficient for demonstrating multiplayer sync
- Easy to upgrade to full auth later

### References
- [Konva.js Documentation](https://konvajs.org/)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [React-Konva Documentation](https://konvajs.org/docs/react/)
- [Vite Documentation](https://vitejs.dev/)