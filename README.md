# Shail Sharma — Portfolio

Personal portfolio site served with **Node.js + Express**.

## Quick start

```powershell
cd porfolio
npm install
npm start
```

Open **http://localhost:3000**

## Development

| Command | Description |
|---------|-------------|
| `npm install` | Install Express |
| `npm start` | Run server on port 3000 |
| `PORT=8080 npm start` | Custom port (PowerShell: `$env:PORT=8080; npm start`) |

## Project structure

```
porfolio/
├── server.js          # Express static server
├── package.json
├── index.html         # Main page
├── css/style.css
├── js/main.js         # Theme, particles, scroll, counters
├── js/live.js         # GitHub / patents / social live data
├── js/interactive.js  # Command palette, filters, modals
├── js/extras.js       # Terminal, achievements, Konami
├── js/nextlevel.js    # Carousel, radar, parallax, contact form
└── assets/
    └── resume.pdf     # Your RSI resume
```

## Live sections (GitHub · LinkedIn · Holopin)

Requires **`npm start`** (Node server proxies GitHub API).

### GitHub token (required for live commits & activity)

Unauthenticated GitHub API calls are limited to **60 requests/hour per IP**. Without a token, commits, activity, and repos show as unavailable.

1. Copy `.env.example` to `.env`
2. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) — **no scopes** needed for public data
3. Set `GITHUB_TOKEN` in `.env`
4. Restart the server

```powershell
copy .env.example .env
# Edit .env and add your GITHUB_TOKEN
npm start
```

| Variable | Description |
|----------|-------------|
| `GITHUB_USERNAME` | GitHub username (default: `Shailsharma2604`) |
| `GITHUB_TOKEN` | Personal access token — **required** for reliable live data |
| `GITHUB_CACHE_MS` | Cache TTL in ms (default: 300000) |
| `PORT` | Local server port (default: 3000) |

On **Vercel**, add `GITHUB_TOKEN` and `GITHUB_USERNAME` under Project → Settings → Environment Variables.

| Section | Source |
|---------|--------|
| GitHub stats & activity | Live `/api/github` — refreshes every 5 min |
| GitHub Pulse | Topics, last push, repos active in 30 days |
| Contribution graph | GitHub Readme Activity Graph |
| Holopin trophies | `https://holopin.me/shail_sharma_2604` |
| LinkedIn | Profile badge + optional latest post embed |

### Embed your latest LinkedIn post

Edit `config/social.json` and set:

```json
"latestPostUrl": "https://www.linkedin.com/posts/your-post-url"
```

## Features (next-level)

| Feature | Description |
|---------|-------------|
| **Dev Shell** | Auto-typing terminal showcase + interactive shell (`\` key) |
| **Project carousel** | Featured spotlight with filter sync & auto-advance |
| **Skill radar** | Canvas constellation chart + animated proficiency bars |
| **Contact form** | Animated success state · `POST /api/contact` |
| **Performance widget** | Page load timing + live GitHub stats (Insights tab) |
| **Writing section** | Placeholder structure for blog/notes |
| **GitHub Pulse bars** | 7-day animated push activity chart |
| **Parallax & code snippets** | Floating background layers (desktop) |
| **Konami code** | ↑↑↓↓←→←→BA unlocks acid theme |

## Theme & cursor

- Click the **floating gradient button** (bottom-right) or **sun icon** in the nav to change colors and mode.
- **Custom cursor** works on desktop after you move the mouse once. If hidden, open the theme panel and ensure **Cursor glow** is ON.
- Settings save in `localStorage`.

## Resume

Place or replace: `assets/resume.pdf`

## Deploy

**Vercel (recommended):** see [DEPLOY.md](DEPLOY.md)

```powershell
npx vercel login
npx vercel --prod
```

Or connect GitHub repo at [vercel.com/new](https://vercel.com/new).

**Local dev:** `npm start` · **Vercel local:** `npm run vercel:dev`

## Profile links

| Platform | URL |
|----------|-----|
| GitHub | https://github.com/Shailsharma2604 |
| LinkedIn | https://in.linkedin.com/in/shail-sharma-607175250 |
| Databricks | https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1 |
