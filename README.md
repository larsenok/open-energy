# Human Energy Exchange

A single-page, immersive world map that visualizes electricity generation and consumption without external build dependencies.
The map glows and breathes to show how regions shift between clean-energy surplus and deficit.

## Features

- **Breathing energy pulses** rendered with lightweight DOM elements—no third-party map or chart libraries required.
- **Interactive insight cards** that surface generation mix, CO₂ intensity, and a 24-hour sparkline built with vanilla SVG.
- **Deterministic data generation** at build time so the experience works fully offline.

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

No packages are required. Running `npm install` simply prepares the lock-free project:

```bash
npm install
```

### Building for production

Generate the static site and energy dataset:

```bash
npm run build
```

The build outputs to the `dist/` directory. To preview locally:

```bash
npm run start
```

Then open `http://localhost:3000` in your browser.

## Project structure

- `public/` – static assets, including the HTML entry point and client-side script.
- `src/data/energy.js` – deterministic data generator used during the build.
- `build.js` – copies static assets and emits `dist/data/energy.json`.
- `serve.js` – tiny static file server for previewing the generated site.

## License

MIT
