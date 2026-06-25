const { getGitHubData } = require('../lib/github-data');

module.exports = async (_req, res) => {
  try {
    const data = await getGitHubData();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (err) {
    console.error('GitHub API error:', err.message);
    const status = err.status === 403 ? 503 : 502;
    res.status(status).json({
      error: 'Could not fetch GitHub data',
      hint: err.status === 403 ? 'rate_limited' : 'upstream_error',
      message:
        err.status === 403
          ? 'Set GITHUB_TOKEN in environment variables for authenticated API access.'
          : 'GitHub API request failed. Try again shortly.',
    });
  }
};
