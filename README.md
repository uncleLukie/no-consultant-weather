# No-Consultant Weather

built this because the new Australian Bureau of Meteorology (BoM) website redesign was a nightmare. this is just a fast, minimal, alternative that i personally prefer.

no clutter. no consultants. just you and the radar.

<img width="492" height="737" alt="image" src="https://github.com/user-attachments/assets/eb1a9f64-ea15-4493-a68f-422f6b13cf42" />

## features
- **smart location**: auto-detects your nearest radar via IP on first visit
- **always fresh**: loops auto-play and refresh every 5 minutes
- **resilient**: intelligent fallback if your local radar goes offline
- **coverage**: all 64 australian radar locations included

## the stack
- **ui**: Vite, React 19, TypeScript, Tailwind CSS v4
- **api proxy**: Express (BoM lacks a public json API and blocks CORS, so this tiny backend fetches their html, parses the image arrays, and serves them up nicely)

## run it locally
you'll need node.js 18+. install dependencies for both folders first:

`npm install`
`cd server && npm install && cd ..`


then, fire up both environments:

#### terminal 1 (backend proxy):
`cd server`
`npm run dev`
# runs on localhost:3001

#### terminal 2 (frontend:
npm run dev
# runs on localhost:5173
(need environment variables? just copy .env.example to .env. defaults work fine for local dev.)

## deployment
live site is pushing to Cloudflare Pages + Workers. but you could use whatever you like.

## tests
we've got 80%+ coverage across the board using Vitest, React Testing Library, and MSW.
`npm test`
