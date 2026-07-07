/**
 * LinkedIn profile photo resolver.
 *
 * Configure via config/social.json → linkedin.vanity (slug from linkedin.com/in/<vanity>)
 * or env LINKEDIN_VANITY. Full profile URL also works — the slug is extracted automatically.
 *
 * Resolution order:
 * 1. LinkedIn public profile og:image (when LinkedIn allows the fetch)
 * 2. unavatar.io/linkedin/<vanity> (reliable fallback; refreshes from LinkedIn periodically)
 *
 * Results are cached in-memory for CACHE_TTL_MS (default 24h) so photo updates propagate
 * within one TTL window after you change your LinkedIn picture.
 */
const https = require('https');
const http = require('http');
const { getSocialConfig } = require('./social-config');

const CACHE_TTL_MS = Number(process.env.LINKEDIN_PHOTO_CACHE_MS) || 24 * 60 * 60 * 1000;

/** @type {{ url: string | null, source: string, vanity: string, fetchedAt: number }} */
let cache = { url: null, source: '', vanity: '', fetchedAt: 0 };

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function normalizeVanity(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let v = raw.trim();
  if (!v) return '';
  const match = v.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (match) v = match[1];
  return v.replace(/^\/+|\/+$/g, '');
}

function getVanity() {
  const fromEnv = normalizeVanity(process.env.LINKEDIN_VANITY || '');
  if (fromEnv) return fromEnv;
  try {
    const config = getSocialConfig();
    return normalizeVanity(config.linkedin?.vanity || config.linkedin?.profileUrl || '');
  } catch {
    return '';
  }
}

function fetchUrl(url, options = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: options.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options.headers,
        },
        timeout: 15000,
      },
      (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          resolve(fetchUrl(next, options, redirects + 1));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        );
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

function extractOgImage(html) {
  const patterns = [
    /property="og:image"[^>]*content="([^"]+)"/i,
    /content="([^"]+)"[^>]*property="og:image"/i,
    /property="og:image:secure_url"[^>]*content="([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&');
  }
  return null;
}

async function resolveFromLinkedIn(vanity) {
  try {
    const res = await fetchUrl(`https://www.linkedin.com/in/${encodeURIComponent(vanity)}`);
    if (res.status !== 200) return null;
    const og = extractOgImage(res.body.toString('utf8'));
    if (og && /licdn\.com|linkedin\.com/i.test(og)) {
      return { url: og, source: 'linkedin-og' };
    }
  } catch (err) {
    console.warn('[linkedin-photo] OG fetch failed:', err.message);
  }
  return null;
}

async function resolveFromUnavatar(vanity) {
  const slug = encodeURIComponent(vanity);
  try {
    const res = await fetchUrl(`https://unavatar.io/linkedin/${slug}?json`, {
      accept: 'application/json',
    });
    if (res.status === 200) {
      const data = JSON.parse(res.body.toString('utf8'));
      if (data?.url) {
        return { url: data.url, source: 'unavatar-licdn' };
      }
    }
  } catch (err) {
    console.warn('[linkedin-photo] unavatar json failed:', err.message);
  }
  return {
    url: `https://unavatar.io/linkedin/${slug}`,
    source: 'unavatar',
  };
}

async function getLinkedInPhotoMeta(forceRefresh = false) {
  const vanity = getVanity();
  if (!vanity) {
    throw new Error(
      'LinkedIn vanity not configured — set linkedin.vanity in config/social.json or LINKEDIN_VANITY in .env'
    );
  }

  const now = Date.now();
  if (!forceRefresh && cache.url && cache.vanity === vanity && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache, ttlSeconds: Math.round(CACHE_TTL_MS / 1000), fromCache: true };
  }

  let resolved = await resolveFromLinkedIn(vanity);
  if (!resolved) resolved = await resolveFromUnavatar(vanity);

  cache = {
    url: resolved.url,
    source: resolved.source,
    vanity,
    fetchedAt: now,
  };

  return { ...cache, ttlSeconds: Math.round(CACHE_TTL_MS / 1000), fromCache: false };
}

async function fetchImageBuffer(imageUrl) {
  const res = await fetchUrl(imageUrl, { accept: 'image/avif,image/webp,image/*,*/*;q=0.8' });
  if (res.status !== 200) {
    throw new Error(`Upstream image fetch failed (${res.status})`);
  }
  return res;
}

module.exports = {
  getLinkedInPhotoMeta,
  fetchImageBuffer,
  getVanity,
  CACHE_TTL_MS,
};
