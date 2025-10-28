# Human Energy Exchange

A single-page, immersive world map that visualizes real-time electricity generation and consumption. The map glows and breathes, highlighting how regions shift between clean-energy surplus and deficit.

## Features

- **Living globe** rendered with Mapbox GL JS that pulses to reflect net energy balance.
- **Minimalist overlay** that blends data visualization and digital art.
- **Interactive insight cards** that surface generation mix, CO₂ intensity, and 24h history.
- **Modular data pipeline** with an API layer that normalizes ENTSO-E, U.S. EIA/OpenEI, and ElectricityMap/Open-Meteo sources and caches results hourly.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn

### Installation

```bash
npm install
```

### Environment variables

Create a `.env.local` file with tokens for the data providers and Mapbox. Each key is optional during development; if omitted, the API falls back to illustrative placeholder data that matches the response schema.

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.____________________
ENTSOE_API_TOKEN=
EIA_API_KEY=
ELECTRICITYMAP_TOKEN=
```

> The API layer is written to make it easy to swap providers. Each fetcher includes comments pointing to the official documentation.

### Development

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Hover over or tap a region to explore the live metrics. Click to freeze the tooltip and reveal the 24-hour sparkline.

### Building for production

```bash
npm run build
npm run start
```

### Deployment

Deploy to [Vercel](https://vercel.com/) or any platform that supports Next.js 14 serverless functions:

1. Create a new Vercel project from this repository.
2. Configure the environment variables listed above in the Vercel dashboard.
3. Deploy. Vercel will run `npm install`, `npm run build`, and host the app with an edge-friendly Node runtime.

## API response

`GET /api/energy`

```json
{
  "updatedAt": "2024-06-08T20:00:00.000Z",
  "regions": [
    {
      "regionId": "eu-central",
      "regionName": "Central Europe",
      "timestamp": "2024-06-08T19:45:00.000Z",
      "consumptionMw": 98000,
      "generationMw": 102500,
      "renewableShare": 0.58,
      "carbonIntensity": 220,
      "mix": {
        "solar": 18000,
        "wind": 24000,
        "hydro": 12000,
        "fossil": 38000,
        "other": 10500
      },
      "history": [
        {
          "timestamp": "2024-06-07T20:00:00.000Z",
          "netBalanceMw": 1800,
          "renewableShare": 0.61
        }
      ]
    }
  ]
}
```

## Extending data sources

All provider fetchers live in `src/app/api/energy/route.ts`.

1. Add a new asynchronous function that fetches and normalizes data into the `EnergySnapshot` shape (see `src/types/energy.ts`).
2. Merge the result into the `regions` array by returning it from the function and appending it to the `mergeSnapshots` call. The helper will combine results when region IDs overlap.
3. Use the `setCached` helper to store expensive results. The default TTL is one hour; override it per-source if needed.
4. Update the `REGION_COORDINATES` map in `MapScene.tsx` with the centroid of the new region for visualization.

Comprehensive inline comments explain where to plug in ENTSO-E, EIA/OpenEI, or ElectricityMap/Open-Meteo queries.

## License

MIT
