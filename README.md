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
| **Contact form** | `POST /api/contact` → email via [Resend](https://resend.com) (see below) |
| **Performance widget** | Page load timing + live GitHub stats (Insights tab) |
| **Writing section** | Placeholder structure for blog/notes |
| **GitHub Pulse bars** | 7-day animated push activity chart |
| **Parallax & code snippets** | Floating background layers (desktop) |
| **Konami code** | ↑↑↓↓←→←→BA unlocks acid theme |

## Contact form — where messages go

Submissions are sent to **your Gmail inbox** when `RESEND_API_KEY` is set. There is **no admin panel** on the site and **no Resend Receiving inbox** — Resend only *delivers* the email; you read it in Gmail.

See **[CONTACT_FORM.md](CONTACT_FORM.md)** for the full flow (Send API vs Receiving API, env vars, testing).

| Setup | Where you see messages |
|-------|-------------------------|
| **Not configured** | Nowhere useful — server logs only; visitor may get a mailto: fallback |
| **`RESEND_API_KEY` set** | `CONTACT_TO_EMAIL` inbox (default: `shail020604@gmail.com`) — check **Gmail**, not Resend dashboard |
| **API fails** | Visitor's email client opens with a pre-filled message to you |

**Resend Receiving** (Python `Emails.Receiving.list()` etc.) is for inbound mail to a **custom domain** in Resend — a different use case. You do **not** need it for this contact form.

### Enable email delivery

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Copy `.env.example` → `.env` and set:
   - `RESEND_API_KEY` — your Resend API key
   - `CONTACT_TO_EMAIL` — inbox that receives form messages (optional; defaults to Gmail above)
3. Restart locally (`npm start`) or add the same vars in **Vercel → Project → Settings → Environment Variables**, then redeploy.
4. Test the contact form — you should receive an email with the visitor's name, reply-to address, and message.

On **Vercel**, you can also inspect failed sends under **Deployments → Functions → `/api/contact` → Logs** (messages are not stored there once email works).

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
| LinkedIn | https://www.linkedin.com/in/shail2604 |
| Databricks | https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1 |
