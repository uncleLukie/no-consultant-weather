# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

2. **(Optional) Configure environment:**
```bash
# Only needed if deploying or using custom API URL
cp .env.example .env
```

## Running in Development

You need **two terminal windows**:

### Terminal 1 - Backend API
```bash
cd server
npm run dev
```
Wait for: `No-Consultant Weather API running on port 3001`

### Terminal 2 - Frontend
```bash
npm run dev
```
Open browser to: `http://localhost:5173`

## Testing the API Directly

```bash
# Health check
curl http://localhost:3001/health

# Get Brisbane radar data
curl http://localhost:3001/api/radar/IDR663

# Get Sydney radar data
curl http://localhost:3001/api/radar/IDR713
```

## Building for Production

```bash
# Build frontend (set VITE_API_URL first if needed)
npm run build

# Output will be in /dist directory
```

## Deploying

### Backend
See `server/README.md` for detailed deployment options:
- PM2 on VPS
- Vercel serverless
- Docker
- Any Node.js hosting

### Frontend
1. Build with production API URL:
```bash
VITE_API_URL=https://your-domain.com/api npm run build
```

2. Deploy `dist/` folder to:
- Static hosting (Netlify, Vercel, GitHub Pages)
- Your own web server
- CDN

## Troubleshooting

### "Failed to load radar data"
- Check that the backend is running on port 3001
- Check console for CORS errors
- Verify `VITE_API_URL` is correct (if using .env)

### Images not loading
- The BoM images are served directly from their servers
- Our proxy only fetches the list of image URLs
- If BoM is down, images won't load

### Port 3001 already in use
```bash
# Change the port
PORT=3002 npm run dev
```

Then update `.env`:
```
VITE_API_URL=http://localhost:3002
```

## Project Structure

```
no-consultant-weather/
├── server/           # Backend Express API
│   ├── index.js     # Main server file
│   └── package.json
├── src/             # Frontend React app
│   ├── components/
│   ├── data/
│   ├── types/
│   └── utils/
├── dist/            # Production build output (gitignored)
└── package.json     # Frontend dependencies
```

## Need Help?

- **Backend issues:** See `server/README.md`
- **Frontend issues:** See `README.md`
- **Architecture details:** See `CLAUDE.md`
