# No-Consultant Weather

A minimal, fast, and user-friendly weather radar website for Australia. Built as a direct response to the poorly received redesign of the Australian Bureau of Meteorology (BoM) website.

## Features

- **Simple Interface**: Clean, minimal design that focuses on the radar display
- **Australian Coverage**: Major radar locations across all states and territories
- **Auto-Playing Loops**: Smooth radar animation with playback controls
- **Auto-Refresh**: Automatically fetches latest radar data every 5 minutes
- **No Clutter**: Just the radar loop and simple controls - no unnecessary features

## Tech Stack

- **Vite** - Lightning-fast build tool
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend API dependencies
cd server
npm install
cd ..
```

### Development

You need to run both the frontend and backend:

**Terminal 1 - Backend API:**
```bash
cd server
npm run dev
```
The API will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

### Environment Variables

Copy `.env.example` to `.env` and adjust if needed:
```bash
cp .env.example .env
```

For development, the default `http://localhost:3001` should work fine.

### Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## How It Works

The Australian Bureau of Meteorology doesn't provide a public JSON API for radar images, and their website doesn't include CORS headers. This application uses a two-part architecture:

### Backend (Proxy API)
1. Runs a simple Express server (`/server` directory)
2. Fetches BoM radar HTML pages on behalf of the frontend
3. Parses the embedded JavaScript arrays containing image URLs
4. Returns the image URLs as JSON with proper CORS headers

### Frontend (React App)
1. Calls the proxy API to get radar image URLs
2. Displays the radar images in an animated loop
3. Provides playback controls and location selection
4. Automatically refreshes data every 5 minutes

### Radar Image URLs

Images follow this predictable pattern:
```
https://reg.bom.gov.au/radar/IDR663.T.202510290319.png
                                 ^^^^^^ ^^^^^^^^^^^^
                              Product ID  Timestamp (YYYYMMDDHHmm)
```

## Adding More Radar Locations

To add a new radar location:

1. Visit https://reg.bom.gov.au/australia/radar/
2. Find your desired location and click through to its loop page
3. Note the product ID from the URL (e.g., `IDR713.loop.shtml` → use `IDR713`)
4. Add the location to `src/data/radarLocations.ts`

## Project Structure

```
├── server/                  # Backend proxy API
│   ├── index.js            # Express server
│   ├── package.json
│   └── README.md           # Deployment instructions
├── src/                    # Frontend React app
│   ├── components/
│   │   └── RadarViewer.tsx
│   ├── data/
│   │   └── radarLocations.ts
│   ├── types/
│   │   └── radar.ts
│   ├── utils/
│   │   └── radarApi.ts     # Calls the proxy API
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example            # Environment variable template
└── README.md
```

## Deployment

See `server/README.md` for detailed backend deployment instructions.

**Quick deployment options:**
- Traditional Node.js server with PM2
- Vercel serverless functions
- Docker container
- Any Node.js hosting platform

For production, set the `VITE_API_URL` environment variable to your API URL:
```bash
VITE_API_URL=https://unclelukie.com/ncw/api npm run build
```

## Data Attribution

All radar data is provided by the [Australian Bureau of Meteorology](http://www.bom.gov.au/). Radar images update approximately every 5-10 minutes.

## License

ISC

