const { getLinkedInProfileMeta, CACHE_TTL_MS } = require('../lib/linkedin-profile');
const { getSocialConfig } = require('../lib/social-config');

module.exports = async (req, res) => {
  try {
    const force = req.query?.refresh === '1';
    const meta = await getLinkedInProfileMeta(force);
    const fallback = getSocialConfig().linkedin || {};
    const maxAge = Math.round(CACHE_TTL_MS / 1000);

    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.status(200).json({
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
};
