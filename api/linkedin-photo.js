const { getLinkedInPhotoMeta, CACHE_TTL_MS } = require('../lib/linkedin-photo');

module.exports = async (req, res) => {
  try {
    const force = req.query?.refresh === '1';
    const meta = await getLinkedInPhotoMeta(force);
    const maxAge = Math.round(CACHE_TTL_MS / 1000);

    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.status(200).json({
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
      hint: 'Ensure linkedin.vanity is set in config/social.json and the profile is public.',
    });
  }
};
