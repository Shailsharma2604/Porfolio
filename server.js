const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const express = require('express');
const { getGitHubData, buildStaticFallback } = require('./lib/github-data');
const { getSocialConfig } = require('./lib/social-config');
const { getPatentsData } = require('./lib/patents-data');
const { getLinkedInPhotoMeta, fetchImageBuffer, CACHE_TTL_MS } = require('./lib/linkedin-photo');
const {
  sendContactEmail,
  buildContactMailto,
  isLocalDev,
  PUBLIC_CONTACT_EMAIL,
} = require('./lib/contact-mail');
const { getLinkedInProfileMeta, enrichSocialConfig, CACHE_TTL_MS: PROFILE_CACHE_MS } = require('./lib/linkedin-profile');

const app = express();
const PORT = process.env.PORT || 3005;
const ROOT = __dirname;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(ROOT, { index: false }));

app.get('/api/github', async (_req, res) => {
  try {
    res.json(await getGitHubData());
  } catch (err) {
    console.error('GitHub API error:', err.message);
    const fallback = buildStaticFallback();
    fallback.error = 'Could not fetch GitHub data';
    fallback.stale = true;
    res.json(fallback);
  }
});

app.get('/api/config', async (_req, res) => {
  try {
    const config = await enrichSocialConfig(getSocialConfig());
    res.set('Cache-Control', `public, s-maxage=${Math.round(PROFILE_CACHE_MS / 1000)}, stale-while-revalidate=3600`);
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Config not found' });
  }
});

app.get('/api/linkedin-profile', async (req, res) => {
  try {
    const meta = await getLinkedInProfileMeta(req.query.refresh === '1');
    const fallback = getSocialConfig().linkedin || {};
    const maxAge = Math.round(PROFILE_CACHE_MS / 1000);
    res.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.json({
      name: meta.name || fallback.name,
      headline: meta.headline || fallback.headline,
      location: meta.location || fallback.location,
      profileUrl: fallback.profileUrl,
      vanity: meta.vanity,
      openToWork: fallback.openToWork,
      source: meta.source,
      cachedAt: new Date(meta.fetchedAt).toISOString(),
      ttlSeconds: meta.ttlSeconds,
      fromCache: meta.fromCache,
    });
  } catch (err) {
    console.error('[linkedin-profile]', err.message);
    res.status(502).json({
      error: 'Could not resolve LinkedIn profile',
      message: err.message,
      hint: 'Update linkedin.headline in config/social.json when LinkedIn blocks automated fetches.',
    });
  }
});

app.get('/api/patents', (_req, res) => {
  try {
    res.json(getPatentsData());
  } catch {
    res.status(500).json({ error: 'Patents not found' });
  }
});

app.get('/api/linkedin-photo', async (req, res) => {
  try {
    const meta = await getLinkedInPhotoMeta(req.query.refresh === '1');
    const maxAge = Math.round(CACHE_TTL_MS / 1000);
    res.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.json({
      imageUrl: meta.url,
      proxyUrl: '/api/linkedin-photo/image',
      source: meta.source,
      vanity: meta.vanity,
      cachedAt: new Date(meta.fetchedAt).toISOString(),
      ttlSeconds: meta.ttlSeconds,
      fromCache: meta.fromCache,
    });
  } catch (err) {
    console.error('[linkedin-photo]', err.message);
    res.status(502).json({
      error: 'Could not resolve LinkedIn profile photo',
      message: err.message,
    });
  }
});

app.get('/api/linkedin-photo/image', async (req, res) => {
  try {
    const meta = await getLinkedInPhotoMeta(req.query.refresh === '1');
    const img = await fetchImageBuffer(meta.url);
    const maxAge = Math.round(CACHE_TTL_MS / 1000);
    res.set('Content-Type', img.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.set('X-Photo-Source', meta.source);
    res.status(200).send(img.body);
  } catch (err) {
    console.error('[linkedin-photo/image]', err.message);
    res.status(502).json({ error: 'Could not fetch LinkedIn profile photo', message: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  try {
    const result = await sendContactEmail({ name, email, message });
    if (!result.delivered) {
      if (result.reason === 'not_configured') {
        if (isLocalDev()) {
          return res.json({
            ok: true,
            message: 'Message logged locally (RESEND_API_KEY not set — not emailed)',
            dev: true,
          });
        }
        return res.status(503).json({
          error: 'Email delivery is not configured on this deployment.',
          code: 'not_configured',
          mailto: buildContactMailto({ name, email, message }),
          contactEmail: PUBLIC_CONTACT_EMAIL,
        });
      }
      return res.status(502).json({
        error:
          result.userMessage ||
          result.error ||
          'Could not send message. Please try again or email directly.',
        code: result.code || result.reason || 'send_failed',
        mailto: buildContactMailto({ name, email, message }),
        contactEmail: PUBLIC_CONTACT_EMAIL,
        detail: result.detail,
      });
    }
    res.json({ ok: true, message: 'Message sent', id: result.emailId || undefined });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(502).json({
      error: err.message || 'Could not send message. Please try again or email directly.',
      code: 'send_failed',
      mailto: buildContactMailto({ name, email, message }),
      contactEmail: PUBLIC_CONTACT_EMAIL,
    });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio running on port ${PORT}`);
});
