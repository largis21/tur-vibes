# Tur Vibes — Offline Hiking Map

A modern, offline-capable hiking map application built with Vite, React, and TypeScript.

## Features

### 🗺️ Core Map Features

- **Interactive Map** - Explore hiking areas with MapLibre GL JS based map
- **Location Search** - Search for places, peaks, and regions using Geonorge API
- **Coordinates Display** - View and interact with current coordinates (latitude, longitude, elevation)
- **User Location** - Display your current location on the map with GPS tracking

### 🏔️ Hiking Information

- **Peak Information** - View details about mountain peaks (elevation, name, location)
- **Terrain Visualization** - Display terrain steepness and elevation overlays
- **Peak Layers** - Custom GeoJSON layers for peak points of interest
- **Elevation Data** - Real-time elevation lookup for map coordinates

### 📍 Points of Interest (POI)

- **Custom POI Management** - Create, edit, and delete custom points of interest
- **POI Sorting** - Sort by name, type, date added, or distance from current location
- **POI Card Display** - View detailed information for each point of interest
- **Customizable POI Layer** - Display custom points on the map with styling

### 🧭 Navigation Tools

- **Bearing Compass** - Advanced bearing and navigation compass
- **Navigation Context** - Navigation state management and guidance
- **Go To Location Modal** - Jump directly to specific coordinates

### 📏 Measurement Tool

- **Distance & Area Measurement** - Measure distances and calculate areas on the map
- **Interactive Polygon Drawing** - Draw custom shapes to measure
- **Real-time Calculations** - Live calculation display while drawing

### 📋 Lists & Organization

- **Custom Lists** - Create and manage lists of locations and waypoints
- **Draggable List Items** - Reorganize list items with drag-and-drop
- **List Overlay Management** - Interactive list management interface

### 💾 Offline Capabilities

- **Offline Map Mode** - Download map tiles for offline use
- **Region Saving** - Save map regions for offline access
- **Offline Tile Caching** - Custom IndexedDB protocol handler for tile storage
- **Service Worker Integration** - PWA support with offline app shell
- **Offline Toggle** - Easy switching between online and offline modes
- **Offline Preview** - Preview regions before downloading

### 🔧 Settings & Customization

- **Permission Management** - Request and manage device permissions (location, orientation)
- **Data Management** - View storage usage and clear app data
- **Developer Information** - Build info and app metadata
- **App Preferences** - Customize app behavior and appearance
- **Sidebar Controls** - Toggle sidebar visibility and content

### 🎨 User Interface

- **Responsive Design** - Optimized for mobile and desktop
- **Floating Action Buttons** - Quick access to key features
- **Modal Dialogs** - Clean interfaces for complex interactions
- **OnBoarding Guide** - First-time user introduction
- **Dark Theme** - Dark mode optimized for outdoor use
- **Tailwind CSS** - Modern styling with Tailwind CSS v4

### 📱 App Features

- **Progressive Web App (PWA)** - Installable as standalone app
- **Service Worker** - Background sync and offline support
- **Local Storage** - Persist app state and preferences
- **Haptic Feedback** - Tactile feedback for interactions
- **Touch Gestures** - Touch-optimized interactions

## Technology Stack

- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 5.4
- **Map Library**: MapLibre GL JS 4.7 via react-map-gl 7.1
- **Styling**: Tailwind CSS 4.3 with @tailwindcss/vite
- **PWA**: vite-plugin-pwa with Workbox
- **Storage**: IndexedDB for offline tiles, localStorage for state
- **State Management**: React Context API
- **UI Components**: React Icons for iconography

## Commands

```bash
# Development server with HMR
npm run dev

# Production build with typecheck
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Browser Support

Works on all modern browsers that support:

- Service Workers
- IndexedDB
- ES2021
- WebGL (for MapLibre)

## Offline Usage

1. Open the app in a supported browser
2. Grant location and orientation permissions
3. Use the Offline tool to select a region
4. Choose map layers (topography, steepness)
5. Download the region for offline access
6. Toggle offline mode to use cached tiles

## Data Sources

- **Map Tiles**: OpenStreetMap, terrain data providers
- **Places**: Geonorge API (Norwegian place names)
- **Elevation**: Hoydedata API (Norwegian elevation data)
- **Peaks**: Norwegian peak database GeoJSON
- **Terrain Data**: Norwegian steepness/slope analysis

## License

See LICENSE file for details.
