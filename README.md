# CollabCanvas - Real-time Collaborative Canvas

A real-time collaborative canvas application built with React, TypeScript, Konva, and Firebase. Multiple users can draw rectangles, see each other's cursors, and manipulate shapes in real-time.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Live Cursor Tracking**: See other users' cursors in real-time with unique colors
- **Shape Drawing**: Draw rectangles with click-drag-release interaction
- **Shape Manipulation**: Drag and reposition shapes with real-time sync
- **Object Locking**: Prevents conflicts when multiple users try to manipulate the same shape
- **Pan & Zoom**: Navigate the canvas with smooth panning and zooming
- **Persistent Storage**: Shapes are saved to Firestore and persist across sessions
- **Anonymous Authentication**: Users are automatically signed in anonymously
- **Responsive Design**: Works on different screen sizes

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Canvas**: Konva, React-Konva
- **Backend**: Firebase (Firestore + Realtime Database)
- **Authentication**: Firebase Anonymous Auth
- **Real-time Sync**: Firebase Realtime Database
- **Persistence**: Firebase Firestore
- **Deployment**: Vercel (recommended) or Firebase Hosting

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Realtime Database enabled
- Anonymous authentication enabled in Firebase

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd collab-canvas-2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (test mode is fine for MVP)
3. Enable Realtime Database (test mode is fine for MVP)
4. Enable Anonymous Authentication
5. Copy the Firebase configuration values

### 4. Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Firebase configuration values in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
   ```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all the environment variables from your `.env` file

### Option 2: Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize hosting:
   ```bash
   firebase init hosting
   ```

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## 🎮 Usage

### Basic Controls

- **Pan**: Scroll with mouse wheel or trackpad
- **Zoom**: Hold Cmd/Ctrl + Scroll
- **Draw Mode**: Click "Draw Rect" button or press 'R' key
- **Draw Rectangle**: Click and drag in draw mode
- **Move Shape**: Click and drag any existing rectangle
- **Multiplayer**: Open multiple browser windows/tabs to test collaboration

### Features Overview

1. **Canvas Navigation**: 
   - Pan by scrolling
   - Zoom with Cmd/Ctrl + scroll
   - Canvas boundaries prevent overscroll

2. **Drawing**:
   - Toggle draw mode with button or 'R' key
   - Click and drag to create rectangles
   - Rectangles are filled with your user color
   - Minimum size: 10×10 pixels

3. **Collaboration**:
   - See other users' cursors in real-time
   - Watch shapes being drawn by others
   - Locked shapes show red border
   - Cannot manipulate shapes locked by others

4. **Persistence**:
   - All shapes are saved to Firestore
   - Shapes persist across browser sessions
   - Real-time sync across all users

## 🏗 Architecture

### Frontend Architecture

- **Components**: React functional components with hooks
- **State Management**: React hooks (useState, useEffect, custom hooks)
- **Canvas Rendering**: Konva for high-performance 2D graphics
- **Real-time Updates**: Firebase Realtime Database for live data
- **Persistence**: Firebase Firestore for permanent storage

### Data Flow

1. **Authentication**: Anonymous auth on app load
2. **Presence**: User presence tracked in Realtime DB
3. **Cursor Sync**: Mouse position synced to Realtime DB
4. **Shape Drawing**: Temporary shapes in Realtime DB, permanent in Firestore
5. **Shape Manipulation**: Position updates in Realtime DB, final position in Firestore
6. **Locking**: Shape locks managed in Realtime DB

### Firebase Structure

```
canvases/
  {canvasId}/
    shapes/           # Firestore - persistent shapes
      {shapeId}
    presence/         # Realtime DB - user presence
      {userId}
    temp-shapes/      # Realtime DB - in-progress drawings
      {userId}
    drag-positions/   # Realtime DB - shape dragging
      {userId}
    locks/            # Realtime DB - shape locks
      {shapeId}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Canvas renders and loads properly
- [ ] Pan and zoom work smoothly
- [ ] Draw mode toggles correctly
- [ ] Can draw rectangles
- [ ] Can drag and reposition shapes
- [ ] Multiple users see each other's cursors
- [ ] Shapes sync in real-time
- [ ] Locking system prevents conflicts
- [ ] Shapes persist after page refresh
- [ ] Performance remains smooth with multiple users

### Multi-User Testing

1. Open multiple browser windows/tabs
2. Verify each user gets unique ID and color
3. Test concurrent drawing and manipulation
4. Verify locking system works correctly
5. Test disconnect/reconnect scenarios

## 🐛 Known Limitations

- Only supports rectangle shapes (circles, lines, text not implemented)
- No undo/redo functionality
- No shape deletion
- No shape resizing or rotation
- No layer management
- No export functionality
- No mobile/touch support
- Single canvas only (no multiple rooms)

## 🔮 Future Enhancements

- Multiple shape types (circles, lines, text)
- Shape transformation (resize, rotate)
- Delete and duplicate operations
- Undo/redo functionality
- Layer management
- Color picker
- Keyboard shortcuts
- Export canvas as image
- Multiple canvas rooms
- Named user accounts
- Touch/mobile support
- AI agent integration

## 📝 Development Notes

### Performance Considerations

- Konva provides excellent performance for 2D graphics
- Firebase Realtime Database handles real-time sync efficiently
- Throttling applied to cursor updates (30fps)
- Optimistic updates for better UX
- Error boundaries prevent crashes

### Security

- Currently uses test mode security rules
- Anonymous authentication only
- No user data collection beyond presence
- All data is public (suitable for MVP demo)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Konva
- Powered by Firebase
- Inspired by collaborative design tools like Figma