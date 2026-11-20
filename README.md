# Orbital Mischief

Orbital Mischief is a silly arcade game about launching ridiculous payloads at locations around the world. Start on the interactive globe, search for a real place, zoom into a satellite-backed 3D city view, and click the map to send a payload toward the exact point you chose.

## Features

- Interactive 3D globe with location targeting
- Address and landmark search with autocomplete
- Satellite imagery with 3D building extrusions
- Close-up 45° city view for searched locations
- Multiple animated payloads, including missiles, bombs, meteors, a rubber chicken, a piano, and a cow
- Large impact explosions with shockwaves, smoke, sparks, and impact labels
- Rapid-fire Chaos Mode
- Payload origin controls, camera follow mode, mute toggle, reset, and clear-all controls

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
npm run preview
```

## How to play

1. Click the globe or search for a place such as `UC Davis Walker Hall`.
2. Choose an autocomplete result to lock onto the location.
3. In close-up mode, click the map where the payload should land.
4. Select a payload from the dock or press keys `1` through `8`.
5. Use Chaos Mode for a 10-second rapid-fire run.

The map view uses a 45° camera angle and keeps the target location in view while payloads fly in and explode at the clicked point.

## Data and map services

This project uses free public services in the browser:

- [MapLibre GL JS](https://maplibre.org/) for the interactive city map
- [OpenFreeMap](https://openfreemap.org/) for the base map style
- [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) for satellite tiles
- [OpenStreetMap Nominatim](https://nominatim.org/) for address and place search
- [Globe.gl](https://globe.gl/) and [Three.js](https://threejs.org/) for the globe and 3D payload effects

No API key is required for the current local setup. Public services have usage policies and availability limits, so replace them with production-ready providers before deploying at scale.

## Project structure

```text
src/main.js      Game logic, map setup, search, payloads, and effects
src/style.css    Interface, map overlays, payloads, and explosion styling
public/          Local globe and atmosphere image assets
```

