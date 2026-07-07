const { getSocialConfig } = require('../lib/social-config');
const { enrichSocialConfig, CACHE_TTL_MS } = require('../lib/linkedin-profile');

module.exports = async (_req, res) => {
  try {
    const config = await enrichSocialConfig(getSocialConfig());
    const maxAge = Math.round(CACHE_TTL_MS / 1000);
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.status(200).json(config);
  } catch {
    res.status(500).json({ error: 'Config not found' });
  }
};
