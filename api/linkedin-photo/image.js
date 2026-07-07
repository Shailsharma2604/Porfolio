const { getLinkedInPhotoMeta, fetchImageBuffer, CACHE_TTL_MS } = require('../../lib/linkedin-photo');

module.exports = async (req, res) => {
  try {
    const force = req.query?.refresh === '1';
    const meta = await getLinkedInPhotoMeta(force);
    const img = await fetchImageBuffer(meta.url);
    const maxAge = Math.round(CACHE_TTL_MS / 1000);

    res.setHeader('Content-Type', img.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=3600`);
    res.setHeader('X-Photo-Source', meta.source);
    res.setHeader('X-Photo-Vanity', meta.vanity);
    res.status(200).send(img.body);
  } catch (err) {
    console.error('[linkedin-photo/image]', err.message);
    res.status(502).json({
      error: 'Could not fetch LinkedIn profile photo',
      message: err.message,
    });
  }
};
