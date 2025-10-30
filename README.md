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

### Cloudflare Pages + Workers (Recommended)

This is the recommended deployment method, offering global edge performance, automatic HTTPS, and generous free tier limits.

#### Prerequisites
- Cloudflare account (free tier is sufficient)
- Domain added to Cloudflare (DNS managed by Cloudflare)
- GitHub repository connected to Cloudflare Pages

#### Step 1: Deploy the Worker (API Backend)

```bash
# Install dependencies (includes wrangler)
npm install

# Login to Cloudflare (opens browser)
npx wrangler login

# Deploy the Worker
npm run worker:deploy
```

Your API will be deployed to: `https://ncw-api.<your-subdomain>.workers.dev`

#### Step 2: Deploy Frontend to Cloudflare Pages

1. **Connect GitHub to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub repository
   - Click "Begin setup"

2. **Configure Build Settings:**
   - **Project name:** `no-consultant-weather` (or your choice)
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

3. **Add Environment Variable:**
   - Click "Environment variables (advanced)"
   - Add variable:
     - **Variable name:** `VITE_API_URL`
     - **Value:** `https://ncw-api.<your-subdomain>.workers.dev` (from Step 1)
   - Click "Save and Deploy"

4. **Configure Custom Domain (ncw.unclelukie.com):**
   - After deployment completes, go to your project
   - Click "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter: `ncw.unclelukie.com`
   - Cloudflare will automatically configure DNS (domain must already be on Cloudflare)
   - Wait for DNS propagation (~1-5 minutes)

Your site will be live at `https://ncw.unclelukie.com`!

#### Step 3: (Optional) Map Worker to Custom Domain

To avoid CORS issues and have API on same domain:

1. Edit `wrangler.toml` and uncomment the routes section:
   ```toml
   [[routes]]
   pattern = "ncw.unclelukie.com/api/*"
   zone_name = "unclelukie.com"
   ```

2. Redeploy Worker:
   ```bash
   npm run worker:deploy
   ```

3. Update Cloudflare Pages environment variable:
   - Change `VITE_API_URL` to: `https://ncw.unclelukie.com`
   - Redeploy Pages (automatic on next git push)

Now your API will be accessible at `https://ncw.unclelukie.com/api/*`

#### Local Development with Cloudflare Worker

```bash
# Terminal 1 - Run Worker locally
npm run worker:dev
# Worker runs on http://localhost:8787

# Terminal 2 - Run frontend (update .env first)
# Update VITE_API_URL=http://localhost:8787 in .env
npm run dev
```

#### Monitoring and Logs

```bash
# Stream real-time logs from production Worker
npm run worker:tail

# View metrics in Cloudflare Dashboard
# Dashboard → Workers & Pages → ncw-api → Metrics
```

#### Automatic Deployments

Once configured, every push to `main` branch automatically:
- ✅ Builds and deploys frontend to Cloudflare Pages
- ⚠️ Worker requires manual deployment: `npm run worker:deploy`

---

### Alternative Deployment Options

See `server/README.md` for alternative backend deployment instructions:
- Traditional Node.js server with PM2
- Vercel serverless functions
- Docker container
- Any Node.js hosting platform

For production with custom API URL:
```bash
VITE_API_URL=https://your-api-url.com npm run build
```

## Data Attribution

All radar data is provided by the [Australian Bureau of Meteorology](http://www.bom.gov.au/). Radar images update approximately every 5-10 minutes.

## License

ISC

