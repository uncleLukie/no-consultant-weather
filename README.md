# No-Consultant Weather

A minimal, fast, and user-friendly weather radar website for Australia. Built as a direct response to the poorly received redesign of the Australian Bureau of Meteorology (BoM) website.

<img width="492" height="737" alt="image" src="https://github.com/user-attachments/assets/eb1a9f64-ea15-4493-a68f-422f6b13cf42" />

## Features

- **Simple Interface**: Clean, minimal design that focuses on radar display
- **Smart Location Detection**: IP-based geolocation automatically selects nearest radar on first visit
- **Australian Coverage**: 64 radar locations across all states and territories
- **Auto-Playing Loops**: Smooth radar animation with playback controls
- **Auto-Refresh**: Automatically fetches latest radar data every 5 minutes
- **Intelligent Fallback**: When radar fails, shows both user-nearest and radar-nearest alternatives
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
5. IP-based geolocation for automatic radar selection
6. Intelligent fallback system when radars are unavailable

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

## Testing

This project includes a comprehensive test suite with unit and integration tests covering both frontend and backend code.

### Test Stack

- **Vitest** - Fast, modern test runner (Vite-native)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **Supertest** - Backend API testing
- **Happy-DOM** - Lightweight DOM implementation

### Running Tests

```bash
# Run all tests (frontend + backend)
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run backend tests only
cd server && npm test

# Run backend tests with coverage
cd server && npm run test:coverage
```

### Test Coverage

The project maintains **80%+ code coverage** across:
- ✅ Backend API endpoints (`/api/radar`, `/api/weather`)
- ✅ Backend utility functions (parsing, caching)
- ✅ Frontend API utilities (`radarApi.ts`, `weatherApi.ts`, `geolocation.ts`)
- ✅ React components (IOSInstallPrompt, etc.)

Coverage reports are generated in:
- Frontend: `./coverage/`
- Backend: `./server/coverage/`

### CI/CD Pipeline

GitHub Actions automatically runs on every push and pull request:

```yaml
✓ Type checking (TypeScript)
✓ Frontend tests with coverage
✓ Backend tests with coverage
✓ Build verification
✓ Coverage threshold enforcement (80%)
```

**CI Status:** Tests must pass before merging pull requests.

View workflow: `.github/workflows/test.yml`

### Writing Tests

#### Frontend Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent isDarkMode={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Backend API Test Example

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server';

describe('GET /api/radar/:id', () => {
  it('should return radar data', async () => {
    const response = await request(app).get('/api/radar/IDR663');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('images');
  });
});
```

### Test Configuration

- `vitest.config.ts` - Frontend test configuration
- `server/vitest.config.js` - Backend test configuration
- `vitest.setup.ts` - Global test setup, MSW handlers, browser API mocks

## Project Structure

```
├── .github/
│   └── workflows/
│       └── test.yml         # CI/CD pipeline
├── server/                  # Backend proxy API
│   ├── index.js            # Express server
│   ├── index.test.js       # Backend tests
│   ├── vitest.config.js    # Backend test config
│   ├── package.json
│   └── README.md           # Deployment instructions
├── src/                    # Frontend React app
│   ├── components/
│   │   ├── RadarViewer.tsx
│   │   └── *.test.tsx      # Component tests
│   ├── data/
│   │   └── radarLocations.ts
│   ├── types/
│   │   └── radar.ts
│   ├── utils/
│   │   ├── radarApi.ts     # Calls the proxy API
│   │   └── *.test.ts       # Utility tests
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vitest.config.ts        # Frontend test config
├── vitest.setup.ts         # Global test setup
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

