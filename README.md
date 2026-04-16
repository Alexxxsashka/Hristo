# Forge3D - Advanced Product Configurator

A high-performance 3D product configurator with real-time price updates and modular attachment system.

## Features
- **3D Configurator**: Real-time 3D visualization of product modifications.
- **Dynamic Pricing**: Instant price updates as parts are added or removed.
- **Modular System**: Attachment points for various categories (Optics, Foregrips, etc.).
- **Full-Stack**: Express backend with JSON storage and React frontend.

## Tech Stack
- **Frontend**: React, Three.js, React Three Fiber, Zustand, TailwindCSS, Motion.
- **Backend**: Node.js, Express.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application (starts both backend and frontend):
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure
- `backend/` (integrated in `server.ts` for this environment)
- `data/products.json`: Product and parts database.
- `src/store/`: Zustand state management.
- `src/components/`: 3D and UI components.
- `src/pages/`: Application views.
