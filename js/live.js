(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function scheduleIdle(fn, timeout = 2000) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
    else setTimeout(fn, 1);
  }

  const STATIC_CONFIG = {
    phone: '+918288851361',
    phoneDisplay: '+91 82888 51361',
    education: 'B.E. CSE (AI) — Final Year, Chitkara University',
    github: 'Shailsharma2604',
    holopin: {
      username: 'shail_sharma_2604',
      profileUrl: 'https://holopin.io/@shail_sharma_2604',
      boardImage: 'https://holopin.me/shail_sharma_2604',
    },
    linkedin: {
      vanity: 'shail-sharma-607175250',
      profileUrl: 'https://in.linkedin.com/in/shail-sharma-607175250',
      latestPostUrl: '',
    },
  };

  const STATIC_GITHUB_STATS = {
    public_repos: 51,
    followers: 8,
    following: 0,
    totalStars: 0,
    accountYears: 3,
  };

  const REFRESH_SEC = 300;
  const CACHE_TTL = REFRESH_SEC * 1000;
  let countdown = REFRESH_SEC;
  let countdownTimer = null;
  let patentFilter = 'all';
  let patentsCache = null;
  let githubCache = null;

  const els = {
    stats: $('#githubStatsGrid'),
    activity: $('#githubActivityFeed'),
    repos: $('#githubReposLive'),
    commits: $('#githubCommitsLive'),
    heroRepos: $('#heroRepoCount'),
    heroFollowers: $('#heroFollowerCount'),
    heroPatents: $('#heroPatentCount'),
    heroGranted: $('#heroGrantedCount'),
    heroGrantedText: $('#heroGrantedText'),
    patentGrantedBadge: $('#patentGrantedBadge'),
    patentBadge: $('#patentCountBadge'),
    patentSubGranted: $('#patentSubGranted'),
    patentSubFiled: $('#patentSubFiled'),
    patentsGrid: $('#patentsGrid'),
    patentSpotlight: $('#patentSpotlight'),
    linkedin: $('#linkedinContent'),
    holopin: $('#holopinBoard'),
    lastUpdated: $('#statsUpdated'),
    countdown: $('#refreshCountdown'),
    refreshBtn: $('#refreshLiveBtn'),
    liveStatus: $('#liveStatusText'),
    liveClock: $('#liveClock'),
    languageBars: $('#languageBars'),
    profileLinks: $('#profileLinksLive'),
    impactStats: $('#impactStats'),
    ribbonTrack: $('#liveRibbonTrack'),
    commitTicker: $('#commitTicker'),
    commitTickerWrap: $('#commitTickerWrap'),
    githubPulse: $('#githubPulse'),
  };

  function getCached(key) {
    try {
      const raw = sessionStorage.getItem(`portfolio-${key}`);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return data;
    } catch {
      return null;
    }
  }

  function setCache(key, data) {
    try {
      sessionStorage.setItem(`portfolio-${key}`, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function initMarqueePause() {
    const observe = (el, rootSel) => {
      if (!el) return;
      const root = el.closest(rootSel) || el;
      new IntersectionObserver(
        ([entry]) => {
          el.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        },
        { threshold: 0 }
      ).observe(root);
    };
    observe(els.commitTicker, '.commit-ticker-wrap');
    observe(els.ribbonTrack, '.live-ribbon');
  }

  function renderFromCache() {
    const patents = getCached('patents');
    const config = getCached('config');
    const gh = getCached('github');
    if (!patents && !config && !gh) return false;

    if (patents) renderPatents(patents);
    if (config) {
      renderHolopin(config);
      renderLinkedIn(config);
      renderProfileLinks(config, patents || getCached('patents'));
    }
    if (gh) {
      renderGitHub(gh);
      renderGitHubNotice('');
    }
    if (gh) {
      renderImpactStats(gh, patents);
      renderLiveRibbon(gh, patents);
      renderLiveStatus(gh, patents);
    }
    if (els.lastUpdated) els.lastUpdated.textContent = 'Showing cached data…';
    return true;
  }

  function timeAgo(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function eventLabel(ev) {
    const map = {
      PushEvent: `Pushed to ${ev.repo}`,
      CreateEvent: `Created ${ev.repo}`,
      WatchEvent: `Starred ${ev.repo}`,
      PullRequestEvent: `Pull request on ${ev.repo}`,
    };
    return map[ev.type] || `Activity on ${ev.repo}`;
  }

  function eventIcon(type) {
    return { PushEvent: '↑', CreateEvent: '+', WatchEvent: '★', PullRequestEvent: '⑂' }[type] || '•';
  }

  function skeleton(html, n = 1) {
    return Array(n).fill(html).join('');
  }

  function showGitHubSkeletons() {
    if (els.stats) {
      els.stats.classList.add('reveal-stagger');
      els.stats.classList.remove('visible');
      els.stats.innerHTML = skeleton('<div class="stat-skeleton"></div>', 4);
    }
    if (els.commits) els.commits.innerHTML = skeleton('<div class="commit-skeleton feed-skeleton"></div>', 3);
    if (els.activity) els.activity.innerHTML = skeleton('<div class="feed-skeleton"></div>', 4);
    if (els.repos) els.repos.innerHTML = skeleton('<div class="repo-skeleton"></div>', 4);
    if (els.githubPulse) {
      els.githubPulse.hidden = false;
      els.githubPulse.innerHTML = skeleton('<div class="pulse-skeleton"></div>', 1);
    }
    if (els.languageBars) els.languageBars.innerHTML = skeleton('<div class="feed-skeleton"></div>', 5);
    if (els.impactStats) els.impactStats.innerHTML = skeleton('<div class="stat-skeleton"></div>', 3);
  }

  function animateDynamicContent(root) {
    if (!root) return;
    root.classList.add('content-swap');
    if (root.classList.contains('reveal-stagger')) {
      root.classList.remove('visible');
      requestAnimationFrame(() => root.classList.add('visible'));
    }
    window.portfolioReveal?.(root);
    root.querySelectorAll('.live-stat-num, .impact-num, .pulse-metric-val').forEach((el) => {
      el.classList.add('count-pop');
    });
  }

  function animateValue(el, end, suffix = '') {
    if (!el) return;
    const target = parseInt(end, 10);
    if (isNaN(target)) {
      el.textContent = end + suffix;
      return;
    }
    if (el.dataset.animated === '1') {
      el.textContent = target + suffix;
      return;
    }
    el.dataset.animated = '1';
    const start = performance.now();
    const duration = 1200;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * ease) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function updateClock() {
    if (!els.liveClock) return;
    els.liveClock.textContent =
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date()) + ' IST';
  }

  function startCountdown() {
    countdown = REFRESH_SEC;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdown -= 1;
      if (els.countdown) {
        const m = Math.floor(countdown / 60);
        const s = countdown % 60;
        els.countdown.textContent = `Next refresh ${m}:${String(s).padStart(2, '0')}`;
      }
      if (countdown <= 0) loadAll();
    }, 1000);
  }

  function initTabs() {
    $$('.live-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.live-tab').forEach((t) => t.classList.remove('active'));
        $$('.live-tab-panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        $(`.live-tab-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add('active');
      });
    });
  }

  function initPatentFilters() {
    $$('.patent-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.patent-filter').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        patentFilter = btn.dataset.filter;
        if (patentsCache) renderPatentsGrid(patentsCache);
      });
    });
  }

  function patentCardHtml(p, i, variant = 'grid') {
    const isGranted = p.status === 'Granted';
    const cls = variant === 'spotlight' ? 'patent-spot-card' : 'patent-card';
    return `
      <article class="glass-card ${cls} pop-in ${isGranted ? 'patent-granted' : ''}" style="--d:${0.05 * i}s" data-status="${p.status || 'Filed'}">
        <div class="patent-top">
          <span class="patent-status ${isGranted ? 'patent-status-granted' : ''}">${isGranted ? '🏅 Granted' : p.status || 'Filed'}</span>
          <span class="patent-category">${p.category || 'Innovation'}</span>
        </div>
        <h3 class="patent-title">${p.title}</h3>
        <div class="patent-meta">
          <span><strong>App. No.</strong> ${p.applicationNumber}</span>
          <span><strong>Filed</strong> ${formatDate(p.filedDate)}</span>
          ${p.grantedDate ? `<span><strong>Granted</strong> ${formatDate(p.grantedDate)}</span>` : ''}
        </div>
        ${p.coInventors?.length ? `<p class="patent-inventors">Co-inventors: ${p.coInventors.join(', ')}</p>` : ''}
        ${
          p.patentUrl
            ? `<a href="${p.patentUrl}" target="_blank" rel="noopener" class="patent-link btn btn-glass btn-sm">View patent ↗</a>`
            : ''
        }
      </article>`;
  }

  function renderPatentsGrid(data) {
    if (!els.patentsGrid) return;
    let items = data.items || [];
    if (patentFilter !== 'all') items = items.filter((p) => p.status === patentFilter);
    if (!items.length) {
      els.patentsGrid.innerHTML = `<p class="feed-empty">No ${patentFilter === 'all' ? '' : patentFilter.toLowerCase()} patents to show</p>`;
      return;
    }
    els.patentsGrid.innerHTML = items.map((p, i) => patentCardHtml(p, i)).join('');
    animateDynamicContent(els.patentsGrid);
  }

  function renderPatentSpotlight(data) {
    if (!els.patentSpotlight) return;
    const granted = data.featured || data.items?.filter((p) => p.status === 'Granted') || [];
    if (!granted.length) {
      els.patentSpotlight.innerHTML = '';
      return;
    }
    els.patentSpotlight.innerHTML = `
      <div class="spotlight-head">
        <h3>🏅 Granted patents</h3>
        <p>Verified on <a href="${data.linkedinProfileUrl || data.profileUrl}" target="_blank" rel="noopener">LinkedIn &amp; CURIN</a></p>
      </div>
      <div class="patent-spotlight-grid reveal-stagger">${granted.map((p, i) => patentCardHtml(p, i, 'spotlight')).join('')}</div>`;
    const grid = els.patentSpotlight.querySelector('.patent-spotlight-grid');
    if (grid) {
      grid.classList.add('reveal-stagger');
      window.portfolioReveal?.(els.patentSpotlight);
      requestAnimationFrame(() => grid.classList.add('visible'));
    }
  }

  function renderPatents(data) {
    patentsCache = data;
    const granted = data.grantedCount ?? data.items?.filter((p) => p.status === 'Granted').length ?? 0;
    const total = data.count || data.items?.length || 0;
    const filed = data.filedCount ?? total - granted;

    if (els.heroGranted) animateValue(els.heroGranted, granted, '');
    if (els.heroPatents) animateValue(els.heroPatents, total, '');
    if (els.patentGrantedBadge) animateValue(els.patentGrantedBadge, granted, '');
    if (els.patentBadge) animateValue(els.patentBadge, total, '');
    if (els.patentSubGranted) els.patentSubGranted.textContent = `${granted} granted`;
    if (els.patentSubFiled) els.patentSubFiled.textContent = `${filed} filed`;
    if (els.heroGrantedText) els.heroGrantedText.textContent = `${granted} Patent${granted !== 1 ? 's' : ''} Granted`;

    renderPatentSpotlight(data);
    renderPatentsGrid(data);
  }

  function renderLanguages(languages) {
    if (!els.languageBars) return;
    if (!languages?.length) {
      els.languageBars.innerHTML = '<p class="feed-empty">No language data yet</p>';
      return;
    }
    const max = Math.max(...languages.map((l) => l.count));
    els.languageBars.innerHTML = languages
      .map(
        (l) => `
      <div class="lang-row">
        <span class="lang-name">${l.name}</span>
        <div class="lang-bar-track"><div class="lang-bar-fill" style="width:${(l.count / max) * 100}%"></div></div>
        <span class="lang-count">${l.count}</span>
      </div>`
      )
      .join('');
    animateDynamicContent(els.languageBars);
  }

  function renderImpactStats(gh, patents) {
    if (!els.impactStats || !gh) return;
    const u = gh.user;
    els.impactStats.innerHTML = `
      <div class="impact-stat pop-in" style="--d:0.05s">
        <span class="impact-num" data-count="${gh.totalStars || 0}">0</span>
        <span class="impact-label">Total stars</span>
      </div>
      <div class="impact-stat pop-in" style="--d:0.1s">
        <span class="impact-num" data-count="${u.public_repos}">0</span>
        <span class="impact-label">Public repos</span>
      </div>
      <div class="impact-stat pop-in" style="--d:0.15s">
        <span class="impact-num" data-count="${u.followers}">0</span>
        <span class="impact-label">Followers</span>
      </div>
      <div class="impact-stat pop-in" style="--d:0.2s">
        <span class="impact-num impact-text">${gh.accountYears || 1}+ yrs</span>
        <span class="impact-label">On GitHub</span>
      </div>
      <div class="impact-stat pop-in impact-accent" style="--d:0.25s">
        <span class="impact-num" data-count="${patents?.grantedCount || 0}">0</span>
        <span class="impact-label">Patents granted</span>
      </div>
      <div class="impact-stat pop-in" style="--d:0.3s">
        <span class="impact-num" data-count="${patents?.filedCount || 0}">0</span>
        <span class="impact-label">Patents filed</span>
      </div>`;
    els.impactStats.querySelectorAll('[data-count]').forEach((el) => {
      el.dataset.animated = '';
      animateValue(el, el.dataset.count, '');
    });
    animateDynamicContent(els.impactStats);
  }

  function renderProfileLinks(config, patents) {
    if (!els.profileLinks) return;
    const links = [
      { label: 'GitHub', url: `https://github.com/${config.github || 'Shailsharma2604'}`, icon: 'GH' },
      { label: 'LinkedIn', url: config.linkedin?.profileUrl, icon: 'in' },
      { label: 'Kaggle', url: 'https://www.kaggle.com/shail2604', icon: 'K' },
      { label: 'ORCID', url: 'https://orcid.org/0009-0005-6101-1998', icon: 'ID' },
      { label: 'Databricks', url: 'https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1', icon: '◆' },
      { label: 'Patents', url: patents?.grantedUrl || patents?.profileUrl, icon: 'P' },
    ].filter((l) => l.url);

    els.profileLinks.innerHTML = links
      .map(
        (l) => `
      <a href="${l.url}" target="_blank" rel="noopener" class="profile-link-item">
        <span class="profile-link-icon">${l.icon}</span>
        <span>${l.label}</span>
      </a>`
      )
      .join('');
    animateDynamicContent(els.profileLinks);
  }

  function renderLiveRibbon(gh, patents) {
    if (!els.ribbonTrack) return;
    const u = gh?.user;
    const items = [];
    if (patents?.grantedCount) items.push(`🏅 ${patents.grantedCount} patents granted`);
    if (u) items.push(`📦 ${u.public_repos}+ GitHub repos`);
    if (gh?.totalStars) items.push(`⭐ ${gh.totalStars} total stars`);
    if (u) items.push(`👥 ${u.followers} followers`);
    if (gh?.latestEvent) items.push(`↑ ${eventLabel(gh.latestEvent)} · ${timeAgo(gh.latestEvent.created_at)}`);
    items.push('◆ Databricks Certified');
    items.push('🚀 Associate Data Engineer @ R Systems');

    const html = items.map((t) => `<span class="live-ribbon-item">${t}</span>`).join('');
    els.ribbonTrack.innerHTML = html + html;
  }

  function renderCommitTicker(commits) {
    if (!els.commitTicker || !els.commitTickerWrap) return;
    if (!commits?.length) {
      els.commitTickerWrap.hidden = true;
      return;
    }
    els.commitTickerWrap.hidden = false;
    const items = commits.map(
      (c) =>
        `<span class="commit-tick"><code>${c.sha}</code> ${c.message} · <em>${c.repo}</em> · ${timeAgo(c.created_at)}</span>`
    );
    const html = items.join('');
    els.commitTicker.innerHTML = html + html;
  }

  function renderLiveStatus(gh, patents) {
    if (!els.liveStatus) return;
    let text = `🏅 ${patents?.grantedCount || 0} granted · ${patents?.filedCount || 0} filed · R Systems`;
    if (gh?.latestEvent) {
      text = `Last GitHub: ${eventLabel(gh.latestEvent)} · ${timeAgo(gh.latestEvent.created_at)}`;
    }
    els.liveStatus.textContent = text;

    const nowFocus = $('#nowFocus');
    if (nowFocus) {
      nowFocus.textContent = gh?.latestEvent
        ? `Last active: ${eventLabel(gh.latestEvent)}`
        : 'Associate Data Engineer @ R Systems';
    }
  }

  function buildWeeklyActivity(events) {
    const days = Array(7).fill(0);
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2));
    }
    (events || []).forEach((ev) => {
      if (ev.type !== 'PushEvent') return;
      const age = (Date.now() - new Date(ev.created_at)) / 86400000;
      if (age <= 7) {
        const idx = 6 - Math.floor(age);
        if (idx >= 0 && idx < 7) days[idx] += ev.payload?.commits || 1;
      }
    });
    const max = Math.max(...days, 1);
    return { days, labels, max };
  }

  function renderGitHubPulse(pulse, login, isFallback = false, events = []) {
    if (!els.githubPulse) return;
    if (!pulse || isFallback) {
      els.githubPulse.innerHTML = '';
      els.githubPulse.hidden = true;
      return;
    }
    els.githubPulse.hidden = false;
    const topics = pulse.topics || [];
    const topicsHtml = topics.length
      ? topics
          .map(
            (t, i) =>
              `<span class="pulse-topic pop-in" style="--d:${0.03 * i}s" title="${t.count} repo${t.count !== 1 ? 's' : ''}">${t.name}</span>`
          )
          .join('')
      : '<span class="pulse-topic pulse-topic-muted">No topics yet</span>';

    const lastRepo = pulse.lastPushedRepo;
    const topRepo = pulse.mostStarredRepo;
    const weekly = buildWeeklyActivity(events);
    const barsHtml = weekly.days
      .map(
        (count, i) => `
        <div class="pulse-bar-col pop-in" style="--d:${0.04 * i}s">
          <div class="pulse-bar-track">
            <div class="pulse-bar-fill" style="--h:${Math.max(8, (count / weekly.max) * 100)}%"></div>
          </div>
          <span class="pulse-bar-label">${weekly.labels[i]}</span>
        </div>`
      )
      .join('');

    els.githubPulse.innerHTML = `
      <div class="pulse-head">
        <span class="pulse-icon pulse-icon-live"><span class="pulse-dot"></span></span>
        <div>
          <h4 class="pulse-title">GitHub Pulse <span class="pulse-live-tag">LIVE</span></h4>
          <p class="pulse-sub">Live snapshot of your open-source activity</p>
        </div>
      </div>
      <div class="pulse-activity-chart">
        <span class="pulse-topics-label">Push activity (7 days)</span>
        <div class="pulse-bars">${barsHtml}</div>
      </div>
      <div class="pulse-metrics">
        <div class="pulse-metric pop-in" style="--d:0.05s">
          <span class="pulse-metric-val">${pulse.reposUpdatedThisMonth}</span>
          <span class="pulse-metric-label">Repos active (30d)</span>
        </div>
        <div class="pulse-metric pop-in" style="--d:0.1s">
          <span class="pulse-metric-val">${pulse.totalNonFork}</span>
          <span class="pulse-metric-label">Original repos</span>
        </div>
        ${
          lastRepo
            ? `<a href="${lastRepo.url}" target="_blank" rel="noopener" class="pulse-highlight pop-in" style="--d:0.15s">
          <span class="pulse-highlight-label">Last push</span>
          <span class="pulse-highlight-name">${lastRepo.name}</span>
          <span class="pulse-highlight-meta">${timeAgo(lastRepo.pushed_at)}</span>
        </a>`
            : ''
        }
        ${
          topRepo
            ? `<a href="${topRepo.url}" target="_blank" rel="noopener" class="pulse-highlight pulse-highlight-star pop-in" style="--d:0.2s">
          <span class="pulse-highlight-label">Top starred</span>
          <span class="pulse-highlight-name">★ ${topRepo.stars} · ${topRepo.name}</span>
        </a>`
            : ''
        }
      </div>
      <div class="pulse-topics-wrap">
        <span class="pulse-topics-label">Repository topics</span>
        <div class="pulse-topics">${topicsHtml}</div>
      </div>`;
    animateDynamicContent(els.githubPulse);
  }

  function renderCommits(commits, login, isFallback = false) {
    if (!els.commits) return;
    if (!commits?.length) {
      const profileUrl = `https://github.com/${login}`;
      els.commits.innerHTML = isFallback
        ? `<p class="feed-empty">Commits unavailable — <a href="${profileUrl}" target="_blank" rel="noopener">view on GitHub ↗</a></p>`
        : '<p class="feed-empty">No recent commits in public activity</p>';
      return;
    }
    els.commits.innerHTML = commits
      .map(
        (c) => `
      <a href="${c.url || `https://github.com/${login}/${c.repo}`}" target="_blank" rel="noopener" class="commit-item">
        <div class="commit-top">
          <code class="commit-sha">${c.sha}</code>
          <span class="commit-msg" title="${escapeAttr(c.message)}">${c.message}</span>
        </div>
        <div class="commit-meta">
          <span class="commit-repo">${c.repo}</span>
          <span class="commit-time">${timeAgo(c.created_at)}</span>
        </div>
      </a>`
      )
      .join('');
    animateDynamicContent(els.commits);
  }

  function getApiBase() {
    if (window.location.protocol === 'file:') return null;
    return '/api';
  }

  function normalizePatents(data) {
    const items = data.items || [];
    const granted = items.filter((p) => p.status === 'Granted');
    const filed = items.filter((p) => p.status !== 'Granted');
    const sorted = [
      ...granted.sort((a, b) => new Date(b.grantedDate || b.filedDate) - new Date(a.grantedDate || a.filedDate)),
      ...filed.sort((a, b) => new Date(b.filedDate) - new Date(a.filedDate)),
    ];
    return {
      ...data,
      items: sorted,
      count: items.length,
      grantedCount: granted.length,
      filedCount: filed.length,
      featured: granted.filter((p) => p.featured),
      fetchedAt: new Date().toISOString(),
    };
  }

  async function fetchApi(path) {
    const base = getApiBase();
    if (!base) return { ok: false, reason: 'offline' };
    try {
      const res = await fetch(`${base}${path}`);
      if (!res.ok) return { ok: false, reason: `http-${res.status}` };
      return { ok: true, data: await res.json() };
    } catch (err) {
      return { ok: false, reason: err.message || 'network' };
    }
  }

  async function fetchStaticJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadConfig() {
    const api = await fetchApi('/config');
    if (api.ok) return api.data;
    const local = await fetchStaticJson('config/social.json');
    return local || STATIC_CONFIG;
  }

  async function loadPatents() {
    const api = await fetchApi('/patents');
    if (api.ok) return api.data;
    const local = await fetchStaticJson('config/patents.json');
    return local ? normalizePatents(local) : normalizePatents({ items: [] });
  }

  function buildGitHubFallback(config) {
    const login = config.github || STATIC_CONFIG.github;
    return {
      user: {
        login,
        public_repos: STATIC_GITHUB_STATS.public_repos,
        followers: STATIC_GITHUB_STATS.followers,
        following: STATIC_GITHUB_STATS.following,
      },
      repos: [],
      events: [],
      languages: [],
      latestEvent: null,
      totalStars: STATIC_GITHUB_STATS.totalStars,
      accountYears: STATIC_GITHUB_STATS.accountYears,
      recentCommits: [],
      fetchedAt: new Date().toISOString(),
      fallback: true,
    };
  }

  function renderGitHubNotice(message) {
    const panel = els.stats?.closest('.github-panel');
    if (!panel) return;
    let notice = panel.querySelector('.github-fallback-notice');
    if (!notice) {
      notice = document.createElement('p');
      notice.className = 'github-fallback-notice';
      els.stats?.insertAdjacentElement('afterend', notice);
    }
    if (message) {
      notice.textContent = message;
      notice.hidden = false;
    } else {
      notice.textContent = '';
      notice.hidden = true;
    }
  }

  function renderGitHub(data) {
    githubCache = data;
    const u = data.user;
    if (els.heroRepos) animateValue(els.heroRepos, u.public_repos, '+');
    if (els.heroFollowers) animateValue(els.heroFollowers, u.followers, '');

    if (els.stats) {
      els.stats.classList.add('reveal-stagger');
      els.stats.classList.remove('visible');
      els.stats.innerHTML = `
        <div class="live-stat-card pop-in" style="--d:0.05s">
          <span class="live-stat-icon">📦</span>
          <span class="live-stat-num" data-count="${u.public_repos}">0</span>
          <span class="live-stat-label">Public Repos</span>
        </div>
        <div class="live-stat-card pop-in" style="--d:0.1s">
          <span class="live-stat-icon">⭐</span>
          <span class="live-stat-num" data-count="${data.totalStars || 0}">0</span>
          <span class="live-stat-label">Total Stars</span>
        </div>
        <div class="live-stat-card pop-in" style="--d:0.15s">
          <span class="live-stat-icon">👥</span>
          <span class="live-stat-num" data-count="${u.followers}">0</span>
          <span class="live-stat-label">Followers</span>
        </div>
        <div class="live-stat-card pop-in" style="--d:0.2s">
          <span class="live-stat-icon">🔗</span>
          <span class="live-stat-num" data-count="${u.following}">0</span>
          <span class="live-stat-label">Following</span>
        </div>`;
      els.stats.querySelectorAll('[data-count]').forEach((el) => {
        el.dataset.animated = '';
        animateValue(el, el.dataset.count, '');
      });
      animateDynamicContent(els.stats);
      requestAnimationFrame(() => els.stats?.classList.add('visible'));
    }

    renderCommits(data.recentCommits, u.login, data.fallback);
    renderCommitTicker(data.recentCommits);
    renderGitHubPulse(data.pulse, u.login, data.fallback, data.events);
    window.portfolioUpdatePerf?.(u.public_repos, u.followers);
    window.portfolioRefreshGlowCards?.();

    if (els.activity) {
      const profileUrl = `https://github.com/${u.login}`;
      els.activity.innerHTML = data.events?.length
        ? data.events
            .map(
              (ev, i) => `
          <a href="${profileUrl}/${ev.repo}" target="_blank" rel="noopener" class="feed-item pop-in" style="--d:${0.05 * i}s">
            <span class="feed-icon">${eventIcon(ev.type)}</span>
            <div class="feed-body">
              <span class="feed-text">${eventLabel(ev)}</span>
              ${ev.type === 'PushEvent' && ev.payload?.commits ? `<span class="feed-meta">${ev.payload.commits} commit(s)</span>` : ''}
            </div>
            <span class="feed-time">${timeAgo(ev.created_at)}</span>
          </a>`
            )
            .join('')
        : data.fallback
          ? `<p class="feed-empty">Activity feed unavailable — <a href="${profileUrl}" target="_blank" rel="noopener">view profile on GitHub ↗</a></p>`
          : '<p class="feed-empty">No recent public activity</p>';
      animateDynamicContent(els.activity);
    }

    if (els.repos) {
      els.repos.classList.add('reveal-stagger');
      const profileUrl = `https://github.com/${u.login}?tab=repositories`;
      if (data.repos?.length) {
        els.repos.innerHTML = data.repos
          .map(
            (r, i) => `
        <a href="${r.url}" target="_blank" rel="noopener" class="repo-live-card pop-in" style="--d:${0.06 * i}s">
          <div class="repo-live-top">
            <span class="repo-live-name">${r.name}</span>
            <span class="repo-live-lang">${r.language || 'Code'}</span>
          </div>
          <p class="repo-live-desc">${r.description || 'Open source project'}</p>
          <div class="repo-live-meta">
            <span>★ ${r.stars}</span><span>⑂ ${r.forks}</span><span>${timeAgo(r.pushed_at)}</span>
          </div>
        </a>`
          )
          .join('');
      } else {
        els.repos.innerHTML = data.fallback
          ? `<p class="feed-empty">Repo list unavailable — <a href="${profileUrl}" target="_blank" rel="noopener">browse ${u.public_repos}+ repos on GitHub ↗</a></p>`
          : '<p class="feed-empty">No public repos to show</p>';
      }
      animateDynamicContent(els.repos);
      requestAnimationFrame(() => els.repos?.classList.add('visible'));
    }

    renderLanguages(data.languages);
    if (els.lastUpdated) {
      const suffix = data.fallback ? ' (cached)' : data.partial ? ' (partial)' : '';
      els.lastUpdated.textContent = `Updated ${timeAgo(data.fetchedAt)}${suffix}`;
    }
  }

  function renderLinkedIn(config) {
    if (!els.linkedin) return;
    const li = config.linkedin || {};
    const postUrl = li.latestPostUrl?.trim();

    els.linkedin.innerHTML = `
      <div class="linkedin-stack pop-in">
        <div class="linkedin-granted-banner">
          <span class="linkedin-granted-icon">🏅</span>
          <div>
            <strong>3 Granted Patents</strong>
            <p>Listed on your LinkedIn profile — headgear, phonecase &amp; cooling pad</p>
          </div>
          <a href="${li.profileUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">LinkedIn ↗</a>
        </div>
        ${
          postUrl && postUrl.includes('linkedin.com')
            ? `<a href="${postUrl}" target="_blank" rel="noopener" class="linkedin-post-card"><span class="linkedin-logo">in</span><div><strong>Latest post</strong><p>View on LinkedIn →</p></div></a>`
            : `<div class="linkedin-badge-wrap" id="linkedinBadgeMount"></div>`
        }
      </div>`;

    if ($('#linkedinBadgeMount') && li.vanity && !document.querySelector('script[src*="profile.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://platform.linkedin.com/badges/js/profile.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      $('#linkedinBadgeMount').innerHTML = `
        <div class="badge-base LI-profile-badge" data-locale="en_US" data-size="medium"
          data-theme="dark" data-type="VERTICAL" data-vanity="${li.vanity}"></div>`;
    }
  }

  function renderHolopin(config) {
    if (!els.holopin) return;
    const hp = config.holopin || {};
    const user = hp.username || 'shail_sharma_2604';
    els.holopin.innerHTML = `
      <a href="${hp.profileUrl || `https://holopin.io/@${user}`}" target="_blank" rel="noopener" class="holopin-link pop-in">
        <img src="${hp.boardImage || `https://holopin.me/${user}`}?t=${Date.now()}" alt="Holopin badges" class="holopin-img" loading="lazy"
          onerror="this.src='https://holopin.io/api/user/board?user=${user}'" />
      </a>
      <p class="holopin-caption">Live badge board · click to view all trophies</p>`;
  }

  function getActionableErrorMessage() {
    const { protocol, port, hostname } = window.location;
    if (protocol === 'file:') {
      return 'Opened as a local file — APIs are blocked. Run npm start in the portfolio folder, then open http://localhost:3000';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port && port !== '3000') {
        return `Nothing responded on port ${port}. Run npm start and open http://localhost:3000`;
      }
      return 'Server not reachable. In the portfolio folder run npm start, then open http://localhost:3000';
    }
    return 'Live APIs unavailable. Check your deployment or try again in a few minutes (GitHub rate limits reset hourly).';
  }

  function showError() {
    const msg = getActionableErrorMessage();
    if (els.stats) {
      els.stats.innerHTML = `<p class="feed-error">${msg} <button type="button" id="retryLive" class="btn btn-glass btn-sm">Retry</button></p>`;
      $('#retryLive')?.addEventListener('click', loadAll);
    }
    if (els.patentsGrid) {
      els.patentsGrid.innerHTML = '<p class="feed-empty">Patent data could not be loaded.</p>';
    }
    renderGitHubNotice('');
  }

  function getGitHubNoticeMessage(githubResult) {
    if (window.location.protocol === 'file:') {
      return 'Offline preview — patents and profile load from local files. Run npm start and open http://localhost:3000 for live GitHub data.';
    }
    if (!githubResult.ok) {
      if (githubResult.reason === 'http-502' || githubResult.reason === 'http-503' || githubResult.reason === 'http-403') {
        return 'GitHub API rate-limited. Add GITHUB_TOKEN to .env (see .env.example), restart the server, then refresh.';
      }
      return 'GitHub feed unavailable. Run npm start with GITHUB_TOKEN set — see .env.example.';
    }
    if (githubResult.data?.stale) {
      return 'Showing cached GitHub data — live refresh failed. Data may be a few minutes old.';
    }
    if (githubResult.data?.partial) {
      return 'Some GitHub details could not refresh (rate limit). Profile stats are current; activity may be incomplete.';
    }
    return '';
  }

  async function loadAll(force = false) {
    const hadCache = !force && renderFromCache();
    if (!hadCache) {
      showGitHubSkeletons();
      if (els.patentsGrid) els.patentsGrid.innerHTML = skeleton('<div class="patent-skeleton"></div>', 3);
    }

    const isOffline = window.location.protocol === 'file:';
    const [githubResult, config, patents] = await Promise.all([
      fetchApi('/github'),
      loadConfig(),
      loadPatents(),
    ]);

    const hasPatents = (patents?.items?.length || 0) > 0;
    const hasConfig = config && Object.keys(config).length > 0;

    if (hasPatents) {
      setCache('patents', patents);
      renderPatents(patents);
    }
    if (hasConfig) {
      setCache('config', config);
      renderHolopin(config);
      renderLinkedIn(config);
      renderProfileLinks(config, patents);
    }

    let gh = null;
    if (githubResult.ok) {
      gh = githubResult.data;
      setCache('github', gh);
      renderGitHub(gh);
      renderGitHubNotice(getGitHubNoticeMessage(githubResult));
    } else if (hasPatents || hasConfig || isOffline) {
      gh = buildGitHubFallback(config);
      renderGitHub(gh);
      renderGitHubNotice(getGitHubNoticeMessage(githubResult));
    }

    if (gh) {
      renderImpactStats(gh, patents);
      renderLiveRibbon(gh, patents);
      renderLiveStatus(gh, patents);
      startCountdown();
      return;
    }

    console.warn('Live data load failed:', githubResult.reason);
    showError();
  }

  function bootLive() {
    initTabs();
    initPatentFilters();
    initMarqueePause();
    updateClock();
    setInterval(updateClock, 1000);
    els.refreshBtn?.addEventListener('click', () => loadAll(true));
    loadAll();
  }

  scheduleIdle(bootLive, 1200);
})();
