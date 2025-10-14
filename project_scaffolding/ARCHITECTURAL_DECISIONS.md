# Architectural Decisions Log

**Project:** CollabCanvas MVP  
**Purpose:** Track key architectural decisions made during development

---

## Decision 1: Drag Position Storage (Task 3.7)

**Date:** January 2025  
**Status:** Implemented  
**Decision:** Store drag positions keyed by userId instead of shapeId

**Context:**
- Original architecture planned `/temp-shapes/{shapeId}` for drag operations
- During implementation of Task 3.7, reconsidered data structure
- Needed simpler conflict resolution and cleanup mechanism

**Decision:**
Use `/canvases/{canvasId}/drag-positions/{userId}` structure with format:
```json
{
  "userId": "abc123",
  "shapeId": "shape-xyz",
  "x": 100,
  "y": 200,
  "timestamp": 1234567890
}
```

**Rationale:**
1. Each user drags one shape at a time (UI pattern)
2. userId-keyed data provides implicit ownership
3. Automatic cleanup via onDisconnect() on user path
4. Simpler than managing multiple shapeId entries per user
5. Aligns with single-user-single-drag interaction model

**Consequences:**
- ✅ Simpler implementation
- ✅ Cleaner data structure
- ✅ Automatic disconnect cleanup
- ❌ User can't drag multiple shapes simultaneously (acceptable)
- ⚠️ Must include shapeId in position data for reverse lookup

**Alternatives Considered:**
- `/temp-shapes/{shapeId}` - More complex, multiple entries per user
- `/drag-positions/{shapeId}` - Doesn't automatically clean up on disconnect

---

## Decision 2: Temp Shapes for Drawing (Task 3.4)

**Date:** January 2025  
**Status:** Implemented  
**Decision:** Store in-progress drawings keyed by userId

**Context:**
- Real-time synchronization of drawing in progress
- Need to show other users what someone is currently drawing
- Original docs showed ambiguous `{shapeId-or-userId}` path

**Decision:**
Use `/canvases/{canvasId}/temp-shapes/{userId}` structure

**Rationale:**
1. User draws one shape at a time (UI limitation)
2. Clear ownership - userId owns the temp shape slot
3. Automatic cleanup when drawing completes
4. Simple subscription - filter out own userId

**Consequences:**
- ✅ Clear data ownership
- ✅ Simple cleanup logic
- ✅ Natural UI limitation (one draw at a time)
- ❌ Can't show multiple simultaneous draws by same user (not needed)

---

## Decision 3: Deferred Object Locking (Task 3.8)

**Date:** January 2025  
**Status:** Deferred  
**Decision:** Complete drag functionality (Task 3.7) before implementing locks

**Context:**
- Tasks 3.7 and 3.8 are closely related
- Some Task 3.8 code leaked into early implementation
- User requested focus on constraints before locks

**Decision:**
Remove all Task 3.8 code and implement clean Task 3.7 first

**Rationale:**
1. Cleaner task separation
2. Easier to test drag without lock complexity
3. Constraints are more critical for data integrity
4. Can implement proper lock system in dedicated Task 3.8

**Consequences:**
- ✅ Clean implementation boundaries
- ✅ Better testing isolation
- ⚠️ Multiple users can drag same shape (race condition possible)
- ⚠️ Task 3.8 will add lock acquisition/release/visual feedback

**Note:** This decision was made after finding Task 3.8 code (isLocked props, 
red borders) already in codebase. Refactoring removes these for clean separation.

---

## Decision 4: Hybrid Firebase Architecture

**Date:** January 2025  
**Status:** Implemented  
**Decision:** Use Realtime Database for ephemeral data + Firestore for persistent data

**Context:**
- Need <50ms latency for real-time interactions (cursors, drag positions)
- Need structured persistence for completed shapes
- Cost optimization for ephemeral data

**Decision:**
- **Realtime Database:** Cursors, drag positions, temp shapes
- **Firestore:** Completed shapes, canvas metadata

**Rationale:**
1. Realtime DB provides <50ms latency for cursors (critical UX)
2. Firestore offers better structure for persistent shapes
3. Separates concerns: temporary vs. permanent data
4. Optimizes costs: ephemeral data auto-deleted

**Consequences:**
- ✅ Optimal latency for real-time features
- ✅ Structured persistence for shapes
- ✅ Cost optimization
- ⚠️ Two Firebase services to manage
- ⚠️ More complex data routing logic

---

## Decision 5: Single Canvas for MVP

**Date:** January 2025  
**Status:** Implemented  
**Decision:** All users share one canvas ("default-canvas")

**Context:**
- MVP scope requires focus on core functionality
- Multi-room support adds complexity
- Easier testing and demonstration

**Decision:**
Use single canvas ID "default" for all users

**Rationale:**
1. Simpler MVP implementation
2. Easier testing and demonstration
3. Reduces complexity in state management
4. Easy to extend to multi-room later

**Consequences:**
- ✅ Simpler implementation
- ✅ Easier testing
- ✅ Clear MVP scope
- ❌ No room isolation
- ⚠️ All users see all shapes

---

## Decision 6: Konva.js for Canvas Rendering

**Date:** January 2025  
**Status:** Implemented  
**Decision:** Use Konva.js instead of raw Canvas API or SVG

**Context:**
- Need high-performance canvas rendering (60 FPS)
- Need shape primitives and event handling
- Need React integration

**Decision:**
Use Konva.js with react-konva integration

**Rationale:**
1. High-performance canvas rendering (60 FPS)
2. Built-in shape primitives and event handling
3. Layer system for optimization
4. React integration via react-konva
5. Easier than raw Canvas, faster than SVG

**Consequences:**
- ✅ High performance
- ✅ Rich feature set
- ✅ React integration
- ⚠️ Additional dependency
- ⚠️ Learning curve for team

---

## Decision 7: Optimistic Updates Strategy

**Date:** January 2025  
**Status:** Implemented  
**Decision:** Update local state immediately, sync to Firebase in background

**Context:**
- Need responsive UI regardless of network latency
- Collaborative editing requires immediate feedback
- Rollback rarely needed due to low conflict rate

**Decision:**
Implement optimistic updates for all user interactions

**Rationale:**
1. Maintains 60 FPS regardless of network latency
2. Better user experience (instant feedback)
3. Rollback rarely needed (low conflict rate)
4. Industry standard for collaborative apps

**Consequences:**
- ✅ Responsive UI
- ✅ Better perceived performance
- ⚠️ Potential for temporary inconsistencies
- ⚠️ Need rollback logic for conflicts

---

## Future Decisions to Track

### Decision 8: Object Locking Implementation (Task 3.8)
**Status:** Pending  
**Context:** Need to prevent race conditions when multiple users drag same shape  
**Options:** Realtime DB locks, Firestore transactions, client-side locks  
**Impact:** Critical for production use

### Decision 9: Multi-Room Support (Post-MVP)
**Status:** Pending  
**Context:** Scale beyond single canvas  
**Options:** Room codes, user-created rooms, organization-based rooms  
**Impact:** Major architectural change

### Decision 10: Authentication Strategy (Post-MVP)
**Status:** Pending  
**Context:** Move beyond anonymous auth  
**Options:** Google Auth, custom auth, SSO integration  
**Impact:** Security and user management

---

## Decision Review Process

**Review Frequency:** After each major architectural change  
**Reviewers:** Development team  
**Criteria:**
- Does decision align with MVP goals?
- Are consequences acceptable?
- Is decision reversible?
- Does it support future enhancements?

**Documentation Requirements:**
- Context and rationale clearly stated
- Consequences documented
- Alternatives considered
- Implementation details included

---

**End of Architectural Decisions Log**
