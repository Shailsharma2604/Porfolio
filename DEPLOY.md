# Deploy on Vercel (recommended)

Vercel hosts your **static site** + **serverless API** (`/api/github`, `/api/config`) for live GitHub stats. Free tier, fast CDN, no cold-start sleep like Render.

## Option A — Deploy from GitHub (easiest)

### 1. Push to GitHub

Create repo at [github.com/new](https://github.com/new) named `portfolio`, then:

```powershell
cd c:\Users\Shail.Sharma\My_Project\porfolio
git remote add origin https://github.com/Shailsharma2604/portfolio.git
git push -u origin main
```

*(Skip `git remote add` if already added.)*

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New…** → **Project**
3. Import `Shailsharma2604/portfolio`
4. Settings — `vercel.json` in the repo sets these; confirm in the import UI if needed:

| Setting | Value |
|---------|--------|
| Framework Preset | **Other** (`framework: null` in `vercel.json`) |
| Build Command | `npm run build` *(JS syntax check only)* |
| Output Directory | `.` *(repo root — `index.html`, `css/`, `js/`, `assets/`)* |
| Install Command | `npm install` *(optional)* |

> **If deploy fails with “No Output Directory named public”:** the dashboard may still say `public`. `vercel.json` overrides that with `"outputDirectory": "."`. Push the latest `vercel.json` and redeploy.

5. **Environment variables** (Project → Settings → Environment Variables):

| Key | Value |
|-----|--------|
| `GITHUB_TOKEN` | GitHub PAT (no scopes) — [create token](https://github.com/settings/tokens) |
| `GITHUB_USERNAME` | `Shailsharma2604` |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key — **required for contact form email** |
| `CONTACT_TO_EMAIL` | Inbox for form messages (default: `shail020604@gmail.com`) |

6. Click **Deploy**

Your site will be live at:

**`https://portfolio-<your-username>.vercel.app`**

(or a custom name you pick in project settings)

### 3. Custom domain (optional)

Vercel project → **Settings** → **Domains** → add e.g. `shailsharma.dev`

---

## Option B — Deploy from CLI

```powershell
cd c:\Users\Shail.Sharma\My_Project\porfolio
npx vercel login
npx vercel
```

Follow prompts. Production deploy:

```powershell
npx vercel --prod
```

Local preview with API routes:

```powershell
npm run vercel:dev
```

---

## What works on Vercel

| Feature | Works? |
|---------|--------|
| Portfolio pages | Yes (CDN) |
| Live GitHub stats | Yes (`/api/github`) |
| Holopin / LinkedIn | Yes |
| Resume download | Yes (`assets/resume.pdf`) |
| Theme switcher | Yes |
| Contact form email | Yes (`/api/contact` → Gmail via Resend Send API; see [CONTACT_FORM.md](CONTACT_FORM.md)) |

---

## Project layout for Vercel

```
porfolio/
├── api/
│   ├── github.js      → /api/github
│   ├── config.js      → /api/config
│   ├── contact.js     → /api/contact
│   └── ...
├── vercel.json        → framework: null, outputDirectory: "."
├── .vercelignore      → excludes node_modules, server.js, etc.
├── index.html         → served as homepage (repo root = static output)
├── css/  js/  assets/
└── server.js          → local dev only (npm start); not deployed
```

### `vercel.json` essentials

Static files live at the repo root (no `public/` or `dist/`). Vercel’s “Other” preset defaults to a `public` output folder when a build runs; this project overrides that:

```json
{
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "."
}
```

The `api/` folder is auto-detected for serverless functions regardless of `outputDirectory`.

---

## Also: Render

See `render.yaml` if you prefer a always-on Node server on [Render](https://render.com).
