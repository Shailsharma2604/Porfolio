const { getSocialConfig } = require('../lib/social-config');

module.exports = (_req, res) => {
  try {
    const data = getSocialConfig();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'Config not found' });
  }
};
