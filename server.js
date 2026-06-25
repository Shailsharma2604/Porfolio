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
const { getGitHubData } = require('./lib/github-data');
const { getSocialConfig } = require('./lib/social-config');
const { getPatentsData } = require('./lib/patents-data');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(ROOT, { index: false }));

app.get('/api/github', async (_req, res) => {
  try {
    res.json(await getGitHubData());
  } catch (err) {
    console.error('GitHub API error:', err.message);
    const status = err.status === 403 ? 503 : 502;
    res.status(status).json({
      error: 'Could not fetch GitHub data',
      hint: err.status === 403 ? 'rate_limited' : 'upstream_error',
      message:
        err.status === 403
          ? 'Set GITHUB_TOKEN in .env (see .env.example) for authenticated API access.'
          : 'GitHub API request failed. Try again shortly.',
    });
  }
});

app.get('/api/config', (_req, res) => {
  try {
    res.json(getSocialConfig());
  } catch {
    res.status(500).json({ error: 'Config not found' });
  }
});

app.get('/api/patents', (_req, res) => {
  try {
    res.json(getPatentsData());
  } catch {
    res.status(500).json({ error: 'Patents not found' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  console.log('[contact]', { name: name.trim(), email: email.trim(), message: message.trim().slice(0, 500) });
  res.json({ ok: true, message: 'Message received' });
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
