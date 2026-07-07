/**
 * LinkedIn profile metadata resolver (headline, name, location).
 *
 * Resolution order:
 * 1. LinkedIn public profile Open Graph tags (og:title / og:description)
 * 2. config/social.json → linkedin.headline (source of truth when fetch is blocked)
 *
 * LinkedIn often returns 999/429 to automated fetches; social.json keeps the UI accurate.
 * Refresh social.json when you change your headline, or call /api/linkedin-profile?refresh=1
 * after a successful OG fetch.
 */
const https = require('https');
const http = require('http');
const { getVanity } = require('./linkedin-photo');
const { getSocialConfig } = require('./social-config');

const CACHE_TTL_MS = Number(process.env.LINKEDIN_PROFILE_CACHE_MS) || 60 * 60 * 1000;

/** @type {{ headline: string, name: string, location: string, source: string, vanity: string, fetchedAt: number }} */
let cache = { headline: '', name: '', location: '', source: '', vanity: '', fetchedAt: 0 };

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const OG_BOTS = [
  BROWSER_UA,
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',
];

function fetchUrl(url, options = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': options.ua || BROWSER_UA,
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
            body: Buffer.concat(chunks).toString('utf8'),
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

function extractMeta(html, property) {
  const patterns = [
    new RegExp(`property="${property}"[^>]*content="([^"]+)"`, 'i'),
    new RegExp(`content="([^"]+)"[^>]*property="${property}"`, 'i'),
    new RegExp(`name="${property}"[^>]*content="([^"]+)"`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  }
  return null;
}

function stripLinkedInSuffix(value) {
  return String(value || '')
    .replace(/\s*[|\-–—]\s*LinkedIn\s*$/i, '')
    .trim();
}

function isPlausibleHeadline(headline, name) {
  if (!headline || typeof headline !== 'string') return false;
  const h = headline.trim();
  if (h.length < 15) return false;
  if (name && h === name) return false;
  if (h.split(/\s+/).length < 2) return false;
  return true;
}

function parseHeadlineFromOg(ogTitle, ogDescription, expectedName) {
  if (ogTitle) {
    const title = stripLinkedInSuffix(ogTitle);
    const dashIdx = title.indexOf(' - ');
    if (dashIdx !== -1) {
      const left = title.slice(0, dashIdx).trim();
      const right = title.slice(dashIdx + 3).trim();
      if (right && (!expectedName || left === expectedName)) return right;
    }
  }

  if (ogDescription) {
    const desc = stripLinkedInSuffix(ogDescription);
    if (!desc || desc.length < 15) return null;
    if (expectedName && desc.startsWith(expectedName)) {
      const rest = desc.slice(expectedName.length).replace(/^[\s|\-–—]+/, '').trim();
      if (rest) return rest;
    }
    if (!expectedName || desc !== expectedName) return desc;
  }

  return null;
}

function getFallbackFromConfig() {
  const config = getSocialConfig();
  const li = config.linkedin || {};
  return {
    headline: li.headline || '',
    name: li.name || '',
    location: li.location || '',
    profileUrl: li.profileUrl || '',
    openToWork: li.openToWork,
    source: 'social.json',
  };
}

async function resolveFromLinkedIn(vanity, fallbackName) {
  const urls = [
    `https://www.linkedin.com/in/${encodeURIComponent(vanity)}`,
    `https://in.linkedin.com/in/${encodeURIComponent(vanity)}`,
  ];

  for (const url of urls) {
    for (const ua of OG_BOTS) {
      try {
        const res = await fetchUrl(url, { ua });
        if (res.status !== 200) continue;

        const ogTitle = extractMeta(res.body, 'og:title');
        const ogDescription = extractMeta(res.body, 'og:description');
        const headline = parseHeadlineFromOg(ogTitle, ogDescription, fallbackName);
        if (!headline || !isPlausibleHeadline(headline, fallbackName)) continue;

        const ogName = ogTitle?.match(/^(.+?)\s[-–—]\s/)?.[1]?.trim() || fallbackName;
        return {
          headline,
          name: stripLinkedInSuffix(ogName) || fallbackName,
          location: extractMeta(res.body, 'profile:location') || extractMeta(res.body, 'og:locality') || null,
          source: 'linkedin-og',
        };
      } catch (err) {
        console.warn('[linkedin-profile] OG fetch failed:', err.message);
      }
    }
  }

  return null;
}

async function getLinkedInProfileMeta(forceRefresh = false) {
  const vanity = getVanity();
  const fallback = getFallbackFromConfig();

  if (!vanity) {
    return {
      ...fallback,
      vanity: '',
      fetchedAt: Date.now(),
      ttlSeconds: 0,
      fromCache: false,
    };
  }

  const now = Date.now();
  if (
    !forceRefresh &&
    cache.headline &&
    cache.vanity === vanity &&
    now - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return { ...cache, ttlSeconds: Math.round(CACHE_TTL_MS / 1000), fromCache: true };
  }

  const resolved = await resolveFromLinkedIn(vanity, fallback.name);
  const headline =
    resolved?.headline && isPlausibleHeadline(resolved.headline, fallback.name)
      ? resolved.headline
      : fallback.headline;

  cache = {
    headline,
    name: resolved?.name || fallback.name,
    location: resolved?.location || fallback.location,
    source: resolved?.headline && isPlausibleHeadline(resolved.headline, fallback.name) ? resolved.source : 'social.json',
    vanity,
    fetchedAt: now,
  };

  return { ...cache, ttlSeconds: Math.round(CACHE_TTL_MS / 1000), fromCache: false };
}

async function enrichSocialConfig(config) {
  const profile = await getLinkedInProfileMeta();
  if (!config?.linkedin) return config;

  return {
    ...config,
    linkedin: {
      ...config.linkedin,
      headline: profile.headline || config.linkedin.headline,
      name: profile.name || config.linkedin.name,
      location: profile.location || config.linkedin.location,
    },
  };
}

module.exports = {
  getLinkedInProfileMeta,
  enrichSocialConfig,
  CACHE_TTL_MS,
};
