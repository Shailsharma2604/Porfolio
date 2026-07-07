const GITHUB_USER = process.env.GITHUB_USERNAME || 'Shailsharma2604';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const CACHE_TTL_MS = Number(process.env.GITHUB_CACHE_MS) || 5 * 60 * 1000;

const STATIC_FALLBACK = {
  public_repos: 51,
  followers: 10,
  following: 0,
  totalStars: 0,
  created_at: '2023-02-20T08:46:58Z',
};

/** Approximate primary-language counts from public repos (used when API is rate-limited). */
const STATIC_FALLBACK_LANGUAGES = [
  { name: 'Python', count: 22 },
  { name: 'Jupyter Notebook', count: 9 },
  { name: 'JavaScript', count: 6 },
  { name: 'HTML', count: 5 },
  { name: 'CSS', count: 3 },
  { name: 'Java', count: 2 },
  { name: 'C++', count: 2 },
  { name: 'TypeScript', count: 1 },
];

let cache = { data: null, expiresAt: 0 };

function ghHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'shail-portfolio',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function ghFetch(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`);
    err.status = res.status;
    err.rateRemaining = res.headers.get('x-ratelimit-remaining');
    throw err;
  }
  return res.json();
}

async function fetchRecentCommitsFromRepos(repos, limit = 8) {
  const recentRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 4);

  if (!recentRepos.length) return [];

  const results = await Promise.allSettled(
    recentRepos.map((r) =>
      ghFetch(`https://api.github.com/repos/${GITHUB_USER}/${r.name}/commits?per_page=3`)
    )
  );

  const commits = [];
  results.forEach((result, i) => {
    if (result.status !== 'fulfilled') return;
    const repoName = recentRepos[i].name;
    for (const c of result.value) {
      commits.push({
        message: (c.commit?.message || 'Commit').split('\n')[0].slice(0, 72),
        repo: repoName,
        sha: c.sha?.slice(0, 7) || '',
        created_at: c.commit?.author?.date || c.commit?.committer?.date,
        url: c.html_url,
      });
    }
  });

  return commits
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

function buildTopicsCloud(repos) {
  const topicMap = {};
  repos
    .filter((r) => !r.fork)
    .forEach((r) => {
      (r.topics || []).forEach((t) => {
        topicMap[t] = (topicMap[t] || 0) + 1;
      });
    });
  return Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
}

function buildPulse(repos, topRepos) {
  const nonFork = repos.filter((r) => !r.fork);
  const sortedByPush = [...nonFork].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  const mostRecent = sortedByPush[0];
  const mostStarred = topRepos[0] || null;
  const monthAgo = Date.now() - 30 * 86400000;
  const reposUpdatedThisMonth = nonFork.filter((r) => new Date(r.pushed_at) > monthAgo).length;

  return {
    lastPushedRepo: mostRecent
      ? { name: mostRecent.name, url: mostRecent.html_url, pushed_at: mostRecent.pushed_at }
      : null,
    mostStarredRepo: mostStarred
      ? { name: mostStarred.name, url: mostStarred.url, stars: mostStarred.stars }
      : null,
    reposUpdatedThisMonth,
    totalNonFork: nonFork.length,
    topics: buildTopicsCloud(repos),
  };
}

function buildStaticFallback() {
  const user = {
    login: GITHUB_USER,
    name: 'Shail Sharma',
    bio: null,
    company: 'R Systems International',
    location: 'Delhi NCR',
    avatar_url: `https://github.com/${GITHUB_USER}.png`,
    html_url: `https://github.com/${GITHUB_USER}`,
    public_repos: STATIC_FALLBACK.public_repos,
    followers: STATIC_FALLBACK.followers,
    following: STATIC_FALLBACK.following,
    created_at: STATIC_FALLBACK.created_at,
  };
  const payload = buildGitHubPayload(user, [], [], []);
  payload.totalStars = STATIC_FALLBACK.totalStars;
  payload.languages = STATIC_FALLBACK_LANGUAGES;
  payload.fallback = true;
  return payload;
}

function buildGitHubPayload(user, repos = [], events = [], recentCommits = []) {
  const filteredEvents = events
    .filter((e) => ['PushEvent', 'CreateEvent', 'WatchEvent', 'PullRequestEvent'].includes(e.type))
    .slice(0, 8)
    .map((e) => ({
      type: e.type,
      repo: e.repo?.name?.replace(`${GITHUB_USER}/`, '') || 'repo',
      created_at: e.created_at,
      payload: e.type === 'PushEvent' ? { commits: e.payload?.commits?.length || 0 } : {},
    }));

  const topRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      pushed_at: r.pushed_at,
      topics: r.topics || [],
    }));

  const totalStars = repos.filter((r) => !r.fork).reduce((sum, r) => sum + r.stargazers_count, 0);
  const accountYears = Math.max(1, Math.floor((Date.now() - new Date(user.created_at)) / (365.25 * 86400000)));

  const eventCommits = events
    .filter((e) => e.type === 'PushEvent' && e.payload?.commits?.length)
    .slice(0, 5)
    .flatMap((e) =>
      (e.payload.commits || []).slice(0, 2).map((c) => ({
        message: (c.message || 'Commit').split('\n')[0].slice(0, 72),
        repo: e.repo?.name?.replace(`${GITHUB_USER}/`, '') || 'repo',
        sha: c.sha?.slice(0, 7) || '',
        created_at: e.created_at,
        url: `https://github.com/${GITHUB_USER}/${e.repo?.name?.replace(`${GITHUB_USER}/`, '')}`,
      }))
    );

  const mergedCommits = (eventCommits.length ? eventCommits : recentCommits).slice(0, 8);

  const languageMap = {};
  repos
    .filter((r) => !r.fork && r.language)
    .forEach((r) => {
      languageMap[r.language] = (languageMap[r.language] || 0) + 1;
    });
  const languages = Object.entries(languageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const latestEvent = filteredEvents[0] || null;

  return {
    user: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      location: user.location,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      created_at: user.created_at,
    },
    repos: topRepos,
    events: filteredEvents,
    languages,
    latestEvent,
    totalStars,
    accountYears,
    recentCommits: mergedCommits,
    pulse: buildPulse(repos, topRepos),
    fetchedAt: new Date().toISOString(),
    authenticated: Boolean(GITHUB_TOKEN),
  };
}

async function getGitHubData({ skipCache = false } = {}) {
  if (!skipCache && cache.data && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const [userResult, reposResult, eventsResult] = await Promise.allSettled([
    ghFetch(`https://api.github.com/users/${GITHUB_USER}`),
    ghFetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`),
    ghFetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`),
  ]);

  if (userResult.status === 'rejected') {
    if (cache.data) {
      console.warn('GitHub user fetch failed, serving stale cache:', userResult.reason?.message);
      return { ...cache.data, stale: true };
    }

    const repos = reposResult.status === 'fulfilled' ? reposResult.value : [];
    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];

    if (repos.length) {
      console.warn('GitHub user fetch failed, building payload from repos:', userResult.reason?.message);
      const user = {
        login: GITHUB_USER,
        name: 'Shail Sharma',
        bio: null,
        company: 'R Systems International',
        location: 'Delhi NCR',
        avatar_url: `https://github.com/${GITHUB_USER}.png`,
        html_url: `https://github.com/${GITHUB_USER}`,
        public_repos: STATIC_FALLBACK.public_repos,
        followers: STATIC_FALLBACK.followers,
        following: STATIC_FALLBACK.following,
        created_at: STATIC_FALLBACK.created_at,
      };
      const payload = buildGitHubPayload(user, repos, events, []);
      payload.partial = true;
      cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
      return payload;
    }

    console.warn('GitHub user fetch failed, serving static fallback:', userResult.reason?.message);
    return buildStaticFallback();
  }

  const user = userResult.value;
  const repos = reposResult.status === 'fulfilled' ? reposResult.value : [];
  const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];

  const partial =
    reposResult.status === 'rejected' ||
    eventsResult.status === 'rejected';

  if (reposResult.status === 'rejected') {
    console.warn('GitHub repos fetch failed:', reposResult.reason?.message);
  }
  if (eventsResult.status === 'rejected') {
    console.warn('GitHub events fetch failed:', eventsResult.reason?.message);
  }

  let recentCommits = [];
  if (repos.length) {
    try {
      recentCommits = await fetchRecentCommitsFromRepos(repos);
    } catch (err) {
      console.warn('GitHub commits fetch failed:', err.message);
    }
  }

  const payload = buildGitHubPayload(user, repos, events, recentCommits);
  if (partial) payload.partial = true;
  if (!payload.languages.length && repos.length === 0 && partial) {
    payload.languages = STATIC_FALLBACK_LANGUAGES;
  }

  cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
  return payload;
}

module.exports = {
  getGitHubData,
  buildGitHubPayload,
  buildStaticFallback,
  GITHUB_USER,
  STATIC_FALLBACK_LANGUAGES,
};
