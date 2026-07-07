const { getGitHubData, buildStaticFallback } = require('../lib/github-data');

module.exports = async (_req, res) => {
  try {
    const data = await getGitHubData();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (err) {
    console.error('GitHub API error:', err.message);
    const fallback = buildStaticFallback();
    fallback.error = 'Could not fetch GitHub data';
    fallback.stale = true;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(fallback);
  }
};
