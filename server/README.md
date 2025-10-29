# No-Consultant Weather API

Simple Express proxy server to bypass CORS restrictions when fetching Australian Bureau of Meteorology radar data.

## Why This Exists

The BoM website doesn't provide CORS headers on their HTML pages or images, preventing direct browser access. This lightweight proxy:

1. Fetches BoM radar loop pages
2. Parses the embedded image URLs
3. Returns them as JSON with proper CORS headers

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The server will start on `http://localhost:3001` by default.

## Endpoints

### GET /api/radar/:productId

Fetches radar image URLs for a given product ID.

**Example:**
```bash
curl http://localhost:3001/api/radar/IDR663
```

**Response:**
```json
{
  "images": [
    {
      "url": "https://reg.bom.gov.au/radar/IDR663.T.202510290319.png",
      "timestamp": "202510290319"
    },
    ...
  ]
}
```

### GET /health

Health check endpoint.

### GET /

API information and available endpoints.

## Environment Variables

- `PORT` - Server port (default: 3001)

## Deployment

### Option 1: Traditional Node.js Hosting

1. Copy the `server` directory to your server
2. Install dependencies: `npm install`
3. Set environment variable: `export PORT=3001`
4. Start the server: `npm start`
5. Use a process manager like PM2 for production:
   ```bash
   npm install -g pm2
   pm2 start index.js --name no-consultant-weather-api
   pm2 save
   ```

### Option 2: Vercel Serverless

1. Create `vercel.json` in the server directory (see example below)
2. Deploy: `vercel --prod`

**vercel.json example:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ncw-api .
docker run -p 3001:3001 ncw-api
```

## Reverse Proxy Setup (Nginx)

If deploying to unclelukie.com/ncw:

```nginx
location /ncw/api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Security Notes

- CORS is currently open to all origins (`*`)
- For production, consider restricting to your frontend domain:
  ```javascript
  app.use(cors({
    origin: 'https://unclelukie.com'
  }));
  ```
- Consider rate limiting to prevent abuse
- No authentication required as we're just fetching public data
