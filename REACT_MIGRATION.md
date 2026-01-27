# EPAM Quiz Buzzer - React Migration

## Overview
This project has been successfully converted from vanilla JavaScript to a modern React application using Vite as the build tool.

## Project Structure

```
frontend/
├── index.html              # Main HTML entry point
├── package.json            # Updated with React dependencies
├── vite.config.js         # Vite configuration
├── server.js              # Legacy server (can be removed)
├── public/                # Legacy files (can be archived)
└── src/                   # New React application
    ├── main.jsx           # React app entry point
    ├── components/        # Reusable React components
    │   ├── HostView.jsx
    │   ├── ParticipantView.jsx
    │   ├── RoleSelection.jsx
    │   ├── NameTeamModal.jsx
    │   └── ThemeToggle.jsx
    ├── pages/             # Page components
    │   ├── Landing.jsx
    │   └── AppPage.jsx
    ├── hooks/             # Custom React hooks
    │   ├── useHost.js
    │   └── useParticipant.js
    ├── services/          # Service layer
    │   └── signalingClient.js
    └── styles/            # CSS modules
        ├── reset.css
        ├── variables.css
        ├── typography.css
        ├── components.css
        ├── animations.css
        ├── app-layout.css
        ├── landing.css
        └── theme-toggle.css
```

## Key Changes

### 1. **Build System**
- **Before**: Simple HTTP server with no build step
- **After**: Vite-powered development and build system
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Modern ES modules

### 2. **Architecture**
- **Controllers → React Hooks**
  - `hostController.js` → `useHost()` hook
  - `participantController.js` → `useParticipant()` hook
  
- **Vanilla JS → React Components**
  - Screen logic now in React components
  - State management with React hooks
  - Event handling with React patterns

### 3. **Routing**
- Implemented React Router for client-side routing
- Routes:
  - `/` - Landing page
  - `/app` - Main quiz application

### 4. **State Management**
- React hooks (`useState`, `useEffect`, `useCallback`)
- Custom hooks for business logic
- Props-based data flow

### 5. **Styling**
- All CSS files migrated to `src/styles/`
- Maintained modular CSS structure
- Added error banner and loading overlay styles

## Running the Application

### Development Mode
```bash
cd frontend
npm run dev
```
Application runs on http://localhost:8080

### Production Build
```bash
cd frontend
npm run build
```
Build output in `frontend/dist/`

### Preview Production Build
```bash
cd frontend
npm run preview
```

## Dependencies

### Core
- **React** ^19.2.4 - UI framework
- **React DOM** ^19.2.4 - React DOM renderer
- **React Router DOM** ^7.13.0 - Client-side routing

### Communication
- **Socket.IO Client** ^4.8.3 - WebSocket communication

### Build Tools
- **Vite** ^7.3.1 - Build tool and dev server
- **@vitejs/plugin-react** ^5.1.2 - React plugin for Vite

## Features Preserved

All original features have been maintained:

✅ **Host Mode**
- Create quiz rooms
- Start rounds
- View participants
- See buzz rankings in real-time

✅ **Participant Mode**
- Join quiz rooms
- Buzz functionality
- See rankings
- Winner notifications

✅ **UI/UX**
- Theme toggle (light/dark)
- Responsive design
- Animations
- Modal dialogs

✅ **Backend Integration**
- Socket.IO connection
- Real-time event handling
- Error handling
- Connection management

## Backend Compatibility

The backend remains unchanged and fully compatible. The React frontend communicates with the existing Node.js/Socket.IO backend using the same protocol.

### Backend Setup
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:3000

## Migration Benefits

1. **Modern Development**
   - Component-based architecture
   - Hot module replacement
   - Better debugging with React DevTools

2. **Maintainability**
   - Clearer separation of concerns
   - Reusable components
   - Type-safe with potential for TypeScript migration

3. **Performance**
   - Optimized builds
   - Code splitting
   - Tree shaking

4. **Developer Experience**
   - Fast refresh
   - Better error messages
   - Modern tooling

## Next Steps (Optional Enhancements)

1. **TypeScript Migration**
   - Add type safety
   - Better IDE support

2. **State Management**
   - Consider Context API or Zustand for global state
   - Centralize server connection management

3. **Testing**
   - Add Jest for unit tests
   - React Testing Library for component tests
   - E2E tests with Playwright

4. **Code Splitting**
   - Lazy load routes
   - Dynamic imports for better performance

5. **PWA Features**
   - Service workers
   - Offline support
   - Install prompts

## Troubleshooting

### Port Already in Use
If port 8080 is in use, update `vite.config.js`:
```js
server: {
  port: 3001, // Change to available port
}
```

### Backend Connection Issues
Update the server URL in `src/pages/AppPage.jsx`:
```js
const initialUrl = "http://localhost:3000"; // Your backend URL
```

### Build Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## License
MIT - EPAM Quizzer
