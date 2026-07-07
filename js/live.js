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
      vanity: 'shail2604',
      profileUrl: 'https://www.linkedin.com/in/shail2604',
      latestPostUrl: '',
      name: 'Shail Sharma',
      headline:
        'Associate Data Engineer @ R Systems International | AI/ML Enthusiast | Python • Machine Learning • Deep Learning',
      location: 'Greater Noida, India',
      openToWork: true,
    },
  };

  const STATIC_GITHUB_STATS = {
    public_repos: 51,
    followers: 10,
    following: 0,
    totalStars: 0,
    accountYears: 3,
  };

  const STATIC_GITHUB_LANGUAGES = [
    { name: 'Python', count: 22 },
    { name: 'Jupyter Notebook', count: 9 },
    { name: 'JavaScript', count: 6 },
    { name: 'HTML', count: 5 },
    { name: 'CSS', count: 3 },
    { name: 'Java', count: 2 },
    { name: 'C++', count: 2 },
    { name: 'TypeScript', count: 1 },
  ];

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
    patentFiledBadge: $('#patentFiledBadge'),
    patentBadge: $('#patentCountBadge'),
    patentSubGranted: $('#patentSubGranted'),
    patentSubFiled: $('#patentSubFiled'),
    patentsGrid: $('#patentsGrid'),
    patentSpotlight: $('#patentSpotlight'),
    aboutPatentTeaser: $('#aboutPatentTeaser'),
    linkedin: $('#linkedinContent'),
    linkedinShowcase: $('#linkedinShowcase'),
    aboutLinkedInName: $('#aboutLinkedInName'),
    aboutLinkedInHeadline: $('#aboutLinkedInHeadline'),
    aboutLinkedInTile: $('#aboutLinkedInTile'),
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
    githubStatsEmbed: $('#githubStatsEmbed'),
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

  function initEmbedImageFallbacks() {
    $$('img[data-embed-fallback]').forEach((img) => {
      if (img.dataset.embedBound) return;
      img.dataset.embedBound = '1';
      img.addEventListener('error', () => {
        const msg = img.dataset.embedFallback || 'Image unavailable';
        const wrap = img.closest('.contrib-wrap, .github-embed-streak-wrap') || img.parentElement;
        if (!wrap || wrap.querySelector('.embed-fallback-msg')) return;
        img.hidden = true;
        const note = document.createElement('p');
        note.className = 'embed-fallback-msg feed-empty';
        note.textContent = msg;
        wrap.appendChild(note);
      });
    });
  }

  function renderGitHubEmbed(data, opts = {}) {
    if (!els.githubStatsEmbed) return;
    const { deferStreak = false } = opts;
    const u = data?.user;
    const login = u?.login || STATIC_CONFIG.github;
    const profileUrl = `https://github.com/${login}`;
    const suffix = data?.fallback ? ' · cached' : '';

    if (!u) {
      els.githubStatsEmbed.innerHTML = `
        <div class="github-embed-card glass-card">
          <h4 class="github-embed-title">@${login}</h4>
          <p class="embed-fallback-msg">Stats unavailable — <a href="${profileUrl}" target="_blank" rel="noopener">view on GitHub ↗</a></p>
        </div>`;
      return;
    }

    const streakUrl =
      `https://streak-stats.demolab.com/?user=${encodeURIComponent(login)}&theme=transparent&hide_border=true&stroke=2563eb&ring=0ea5e9&fire=60a5fa&currStreakLabel=2563eb`;

    const streakBlock = deferStreak
      ? `<div class="github-embed-streak-wrap glass-card pop-in" style="--d:0.1s" data-streak-deferred="${encodeURIComponent(streakUrl)}" data-streak-login="${login}">
        <p class="embed-fallback-msg feed-empty">Streak chart loads when you open Activity…</p>
      </div>`
      : `<div class="github-embed-streak-wrap glass-card pop-in" style="--d:0.1s">
        <img
          src="${streakUrl}"
          alt="GitHub contribution streak for ${login}"
          class="stats-img github-streak-img"
          loading="lazy"
          decoding="async"
          data-embed-fallback="Streak chart unavailable — contributions still visible on GitHub"
        >
      </div>`;

    els.githubStatsEmbed.innerHTML = `
      <div class="github-embed-card glass-card pop-in" style="--d:0.05s">
        <h4 class="github-embed-title">@${login}</h4>
        <div class="github-embed-stats">
          <div class="github-embed-stat">
            <span class="github-embed-val">${u.public_repos}+</span>
            <span class="github-embed-label">Public repos</span>
          </div>
          <div class="github-embed-stat">
            <span class="github-embed-val">${data.totalStars || 0}</span>
            <span class="github-embed-label">Total stars</span>
          </div>
          <div class="github-embed-stat">
            <span class="github-embed-val">${u.followers}</span>
            <span class="github-embed-label">Followers</span>
          </div>
          <div class="github-embed-stat">
            <span class="github-embed-val">${data.accountYears || 1}+ yrs</span>
            <span class="github-embed-label">On GitHub</span>
          </div>
        </div>
        <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-glass btn-sm">Open profile ↗</a>
        ${data.fallback ? '<p class="embed-fallback-msg">Live refresh unavailable — showing configured stats.</p>' : ''}
      </div>
      ${streakBlock}`;

    initEmbedImageFallbacks();
    initDeferredStreak();
    animateDynamicContent(els.githubStatsEmbed);
    window.portfolioObserveGlassSolid?.(els.githubStatsEmbed);
  }

  function initDeferredStreak() {
    const wrap = els.githubStatsEmbed?.querySelector('[data-streak-deferred]');
    if (!wrap || wrap.dataset.streakBound) return;
    wrap.dataset.streakBound = '1';
    const loadStreak = () => {
      if (wrap.dataset.streakLoaded) return;
      wrap.dataset.streakLoaded = '1';
      const url = decodeURIComponent(wrap.dataset.streakDeferred || '');
      const login = wrap.dataset.streakLogin || STATIC_CONFIG.github;
      wrap.innerHTML = `<img
        src="${url}"
        alt="GitHub contribution streak for ${login}"
        class="stats-img github-streak-img"
        loading="lazy"
        decoding="async"
        data-embed-fallback="Streak chart unavailable — contributions still visible on GitHub"
      >`;
      initEmbedImageFallbacks();
    };
    const activity = document.getElementById('activity');
    if (!activity) {
      loadStreak();
      return;
    }
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadStreak();
      },
      { rootMargin: '200px 0px', threshold: 0 }
    ).observe(activity);
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
      renderGitHubEmbed(gh);
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
    if (!els.liveClock || document.hidden) return;
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
    if (document.hidden) return;
    countdownTimer = setInterval(() => {
      if (document.hidden) return;
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
        window.portfolioSyncFilterIndicator?.($('.live-tabs'));
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
        window.portfolioSyncFilterIndicator?.($('#patentFilters'));
      });
    });
  }

  function patentYear(p) {
    const d = p.grantedDate || p.filedDate;
    if (!d) return '';
    const y = new Date(d).getFullYear();
    return Number.isNaN(y) ? '' : String(y);
  }

  function patentTypeTag(p) {
    if (p.patentNumber && String(p.patentNumber).startsWith('DES')) return 'Design';
    if (p.status === 'Granted') return 'Utility';
    return 'Application';
  }

  function patentRefLabel(p) {
    if (p.patentNumber) {
      const prefix = String(p.patentNumber).startsWith('DES') ? 'Design No.' : 'Patent No.';
      return `<span class="patent-ref-row"><strong>${prefix}</strong> <code class="patent-ref-num">${p.patentNumber}</code></span>`;
    }
    if (p.portfolioRef) {
      const ref = [p.portfolioRef, p.universityRef].filter(Boolean).join(' · ');
      return `<span class="patent-ref-row"><strong>Ref.</strong> <code class="patent-ref-num">${ref}</code></span>`;
    }
    return '';
  }

  function patentCardHtml(p, i, variant = 'grid') {
    const isGranted = p.status === 'Granted';
    const cls = variant === 'spotlight' ? 'patent-spot-card' : 'patent-card';
    const year = patentYear(p);
    const typeTag = patentTypeTag(p);
    const expandable = variant === 'grid';
    const expandAttrs = expandable
      ? ' tabindex="0" role="button" aria-expanded="false" aria-label="Toggle patent details"'
      : '';
    const expandHint = expandable
      ? `<span class="patent-expand-hint"><span class="patent-expand-chevron">▾</span> Filing details</span>`
      : '';

    return `
      <article class="glass-card ${cls} pop-in ${expandable ? 'patent-expandable' : 'patent-spot-expanded'} ${isGranted ? 'patent-granted' : 'patent-filed'}" style="--d:${0.05 * i}s" data-status="${p.status || 'Filed'}"${expandAttrs}>
        <div class="patent-top">
          <span class="patent-status ${isGranted ? 'patent-status-granted' : 'patent-status-filed'}">${isGranted ? '🏅 Granted' : p.status || 'Filed'}</span>
          <span class="patent-category">${p.category || 'Innovation'}</span>
        </div>
        <h3 class="patent-title">${p.title}</h3>
        ${p.description ? `<p class="patent-desc">${p.description}</p>` : ''}
        <div class="patent-tags">
          ${year ? `<span class="patent-tag">${year}</span>` : ''}
          ${typeTag ? `<span class="patent-tag patent-tag-type">${typeTag}</span>` : ''}
          ${p.category ? `<span class="patent-tag patent-tag-domain">${p.category.split(' · ')[0]}</span>` : ''}
        </div>
        <div class="patent-meta patent-meta-primary">
          ${patentRefLabel(p)}
        </div>
        ${expandHint}
        <div class="patent-meta-extra">
          <span><strong>App. No.</strong> <code class="patent-ref-num">${p.applicationNumber}</code></span>
          <span><strong>Filed</strong> ${formatDate(p.filedDate)}</span>
          ${p.grantedDate ? `<span><strong>Granted</strong> ${formatDate(p.grantedDate)}</span>` : ''}
          ${p.coInventors?.length ? `<p class="patent-inventors">Co-inventors: ${p.coInventors.join(', ')}</p>` : ''}
        </div>
        ${
          p.patentUrl
            ? `<a href="${p.patentUrl}" target="_blank" rel="noopener" class="patent-link btn btn-glass btn-sm">View on CURIN ↗</a>`
            : ''
        }
      </article>`;
  }

  function initPatentExpand(container) {
    if (!container) return;
    container.querySelectorAll('.patent-expandable').forEach((card) => {
      if (card.dataset.expandBound) return;
      card.dataset.expandBound = '1';
      const toggle = () => {
        const open = card.classList.toggle('expanded');
        card.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        toggle();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function renderAboutPatentTeaser(data) {
    if (!els.aboutPatentTeaser) return;
    const granted = data.items?.filter((p) => p.status === 'Granted') || [];
    if (!granted.length) return;
    const items = granted
      .map(
        (p) =>
          `<li><strong>${p.title}</strong>${p.patentNumber ? ` <span class="about-patent-ref">${p.patentNumber}</span>` : ''}</li>`
      )
      .join('');
    els.aboutPatentTeaser.innerHTML = `
      <ul class="about-patent-highlights">${items}</ul>
      <a href="#patents" class="about-patent-cta">View all patents &amp; filings →</a>`;
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
    initPatentExpand(els.patentsGrid);
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
  let pendingHeroGranted = null;
  let pendingHeroPatents = null;

  window.portfolioAnimateHeroMetrics = () => {
    if (pendingHeroGranted !== null && els.heroGranted) animateValue(els.heroGranted, pendingHeroGranted, '');
    if (pendingHeroPatents !== null && els.heroPatents) animateValue(els.heroPatents, pendingHeroPatents, '');
  };

  function renderPatents(data) {
    patentsCache = data;
    const granted = data.grantedCount ?? data.items?.filter((p) => p.status === 'Granted').length ?? 0;
    const total = data.count || data.items?.length || 0;
    const filed = data.filedCount ?? total - granted;

    pendingHeroGranted = granted;
    pendingHeroPatents = total;
    if (document.querySelector('.hero-metrics')?.dataset.animated === '1') {
      window.portfolioAnimateHeroMetrics();
    }
    if (els.patentGrantedBadge) animateValue(els.patentGrantedBadge, granted, '');
    if (els.patentFiledBadge) animateValue(els.patentFiledBadge, filed, '');
    if (els.patentBadge) animateValue(els.patentBadge, total, '');
    if (els.patentSubGranted) els.patentSubGranted.textContent = `${granted} granted`;
    if (els.patentSubFiled) els.patentSubFiled.textContent = `${filed} filed`;
    if (els.heroGrantedText) els.heroGrantedText.textContent = `${granted} Patent${granted !== 1 ? 's' : ''} Granted`;

    window.portfolioUpdateSiteStats?.({
      grantedCount: granted,
      totalCount: total,
    });

    renderPatentSpotlight(data);
    renderPatentsGrid(data);
    renderAboutPatentTeaser(data);
  }

  function renderLanguages(languages, opts = {}) {
    if (!els.languageBars) return;
    const { fallback = false, partial = false, login = STATIC_CONFIG.github } = opts;
    const useStatic = !languages?.length && (fallback || partial);
    const list = languages?.length ? languages : useStatic ? STATIC_GITHUB_LANGUAGES : [];
    const usingStatic = useStatic && list.length > 0;

    if (!list.length) {
      els.languageBars.innerHTML = `
        <p class="feed-empty">Language breakdown unavailable right now.</p>
        <button type="button" class="btn btn-glass btn-sm lang-retry-btn" data-lang-retry>Retry ↻</button>
        <p class="lang-hint feed-empty">Set <code>GITHUB_TOKEN</code> in <code>.env</code> for live data, or
          <a href="https://github.com/${login}?tab=repositories" target="_blank" rel="noopener">browse repos on GitHub ↗</a>
        </p>`;
      els.languageBars.querySelector('[data-lang-retry]')?.addEventListener('click', () => loadAll(true));
      return;
    }

    const max = Math.max(...list.map((l) => l.count));
    els.languageBars.innerHTML = `
      ${list
        .map(
          (l) => `
      <div class="lang-row">
        <span class="lang-name">${l.name}</span>
        <div class="lang-bar-track"><div class="lang-bar-fill" style="width:${max ? (l.count / max) * 100 : 0}%"></div></div>
        <span class="lang-count">${l.count}</span>
      </div>`
        )
        .join('')}
      ${
        usingStatic
          ? '<p class="lang-hint feed-empty">Approximate breakdown — live GitHub refresh unavailable.</p>'
          : partial
            ? '<p class="lang-hint feed-empty">Based on available repo data — some details may be incomplete.</p>'
            : ''
      }`;
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
      .slice(0, 8)
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

    const profileApi = await fetchApi('/linkedin-profile');
    const local = (await fetchStaticJson('config/social.json')) || STATIC_CONFIG;
    if (profileApi.ok && local.linkedin) {
      local.linkedin = {
        ...local.linkedin,
        headline: profileApi.data.headline || local.linkedin.headline,
        name: profileApi.data.name || local.linkedin.name,
        location: profileApi.data.location || local.linkedin.location,
      };
    }
    return local;
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
      languages: STATIC_GITHUB_LANGUAGES,
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
    window.portfolioUpdateSiteStats?.({ repoCount: u.public_repos });
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

    renderLanguages(data.languages, {
      fallback: data.fallback,
      partial: data.partial,
      login: u.login,
    });
    renderGitHubEmbed(data);
    if (els.lastUpdated) {
      const suffix = data.fallback ? ' (cached)' : data.partial ? ' (partial)' : '';
      els.lastUpdated.textContent = `Updated ${timeAgo(data.fetchedAt)}${suffix}`;
    }
  }

  function mergeLinkedInConfig(config) {
    return {
      ...STATIC_CONFIG.linkedin,
      ...(config?.linkedin || {}),
    };
  }

  function getLinkedInHeadline(li) {
    return li.headline || STATIC_CONFIG.linkedin.headline || '';
  }

  function linkedInPhotoSources(vanity) {
    const slug = encodeURIComponent(vanity || 'shail2604');
    const sources = [];
    if (getApiBase()) sources.push('/api/linkedin-photo/image');
    sources.push(
      `https://unavatar.io/linkedin/${slug}`,
      'assets/profile.jpg',
      'https://github.com/Shailsharma2604.png?size=400'
    );
    return sources;
  }

  function initLinkedInPhoto(img, vanity) {
    if (!img) return;
    const sources = linkedInPhotoSources(vanity);
    let index = 0;

    function tryNext() {
      index += 1;
      if (index < sources.length) img.src = sources[index];
      else img.classList.add('li-photo-fallback');
    }

    img.addEventListener('error', tryNext);
    img.addEventListener('load', () => {
      if (img.naturalWidth === 0) tryNext();
    });
    img.src = sources[0];
  }

  function buildLinkedInCardHtml(li, variant = 'full') {
    const vanity = li.vanity || 'shail2604';
    const profileUrl = li.profileUrl || `https://www.linkedin.com/in/${vanity}`;
    const name = li.name || 'Shail Sharma';
    const headline = getLinkedInHeadline(li);
    const location = li.location || 'Greater Noida, India';
    const postUrl = li.latestPostUrl?.trim();
    const otw =
      li.openToWork !== false
        ? '<span class="li-otw-badge"><span class="pulse-dot"></span> Open to work</span>'
        : '';

    const postBlock =
      postUrl && postUrl.includes('linkedin.com')
        ? `<a href="${postUrl}" target="_blank" rel="noopener" class="linkedin-post-card"><span class="linkedin-logo">in</span><div><strong>Latest post</strong><p>View on LinkedIn →</p></div></a>`
        : '';

    if (variant === 'compact') {
      return `
      <div class="linkedin-profile-card linkedin-profile-card--compact pop-in">
        <div class="li-card-main">
          <img class="li-card-photo" alt="${escapeAttr(name)} — LinkedIn profile" width="72" height="72" loading="lazy" decoding="async">
          <div class="li-card-body">
            <div class="li-card-head">
              <h3 class="li-card-name">${name}</h3>
              ${otw}
            </div>
            <p class="li-card-headline">${headline}</p>
            <p class="li-card-location">${location}</p>
          </div>
        </div>
        <div class="li-card-actions">
          <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm btn-linkedin">
            <span class="linkedin-logo">in</span> Connect on LinkedIn
          </a>
          <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-glass btn-sm">View profile ↗</a>
        </div>
      </div>`;
    }

    return `
      <div class="linkedin-stack pop-in">
        <div class="linkedin-profile-card">
          <div class="li-card-main">
            <img class="li-card-photo" alt="${escapeAttr(name)} — LinkedIn profile" width="96" height="96" loading="lazy" decoding="async">
            <div class="li-card-body">
              <div class="li-card-head">
                <h3 class="li-card-name">${name}</h3>
                ${otw}
              </div>
              <p class="li-card-headline">${headline}</p>
              <p class="li-card-location">${location}</p>
              <div class="li-card-actions">
                <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm btn-linkedin">
                  <span class="linkedin-logo">in</span> Connect
                </a>
                <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-glass btn-sm">Message ↗</a>
              </div>
            </div>
          </div>
        </div>
        <div class="linkedin-granted-banner">
          <span class="linkedin-granted-icon">🏅</span>
          <div>
            <strong>3 Granted Patents</strong>
            <p>Listed on LinkedIn — headgear, phonecase &amp; cooling pad</p>
          </div>
          <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-glass btn-sm">Verify ↗</a>
        </div>
        ${postBlock}
        <p class="linkedin-hint">Live profile card · photo via secure proxy with GitHub &amp; unavatar fallbacks</p>
      </div>`;
  }

  function mountLinkedInPhotos(root, vanity) {
    if (!root) return;
    root.querySelectorAll('.li-card-photo').forEach((img) => initLinkedInPhoto(img, vanity));
  }

  function renderAboutLinkedInTile(config) {
    const li = mergeLinkedInConfig(config);
    const vanity = li.vanity || 'shail2604';
    const profileUrl = li.profileUrl || `https://www.linkedin.com/in/${vanity}`;
    const headline = getLinkedInHeadline(li);
    const name = li.name || 'Shail Sharma';

    if (els.aboutLinkedInName) els.aboutLinkedInName.textContent = name;
    if (els.aboutLinkedInHeadline) els.aboutLinkedInHeadline.textContent = headline;

    if (els.aboutLinkedInTile) {
      const photo = els.aboutLinkedInTile.querySelector('.about-li-photo');
      const link = els.aboutLinkedInTile.querySelector('a.btn-linkedin');
      if (link) link.href = profileUrl;
      if (photo && !photo.dataset.liBound) {
        photo.dataset.liBound = '1';
        initLinkedInPhoto(photo, vanity);
      }
    }
  }

  function renderLinkedIn(config) {
    const li = mergeLinkedInConfig(config);
    const vanity = li.vanity || 'shail2604';

    if (els.linkedin) {
      els.linkedin.innerHTML = buildLinkedInCardHtml(li, 'full');
      mountLinkedInPhotos(els.linkedin, vanity);
    }

    if (els.linkedinShowcase) {
      els.linkedinShowcase.innerHTML = buildLinkedInCardHtml(li, 'compact');
      mountLinkedInPhotos(els.linkedinShowcase, vanity);
    }

    renderAboutLinkedInTile(config);
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
    renderLinkedIn(STATIC_CONFIG);
    const gh = buildGitHubFallback(STATIC_CONFIG);
    renderGitHub(gh);
    renderGitHubEmbed(gh);
    renderGitHubNotice(msg);
    if (els.patentsGrid && !patentsCache) {
      els.patentsGrid.innerHTML = '<p class="feed-empty">Patent data could not be loaded.</p>';
    }
  }

  function getGitHubNoticeMessage(githubResult) {
    if (window.location.protocol === 'file:') {
      return 'Offline preview — patents and profile load from local files. Run npm start and open http://localhost:3000 for live GitHub data.';
    }
    if (githubResult.data?.fallback) {
      return 'Showing configured GitHub stats — live refresh unavailable. Set GITHUB_TOKEN in Vercel env (see .env.example) for commits, activity & repos.';
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
    const ghFromCache = !force ? getCached('github') : null;
    const hadCache = !force && renderFromCache();
    if (force || !ghFromCache) {
      showGitHubSkeletons();
    }
    if (force || !hadCache) {
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
    startCountdown();
  }

  renderLinkedIn(STATIC_CONFIG);
  renderGitHubEmbed(buildGitHubFallback(STATIC_CONFIG), { deferStreak: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = null;
    } else {
      updateClock();
      startCountdown();
    }
  });

  function deferBootLive() {
    const targets = ['#patents', '#activity', '#projects']
      .map((sel) => document.querySelector(sel))
      .filter(Boolean);
    if (!targets.length) {
      bootLive();
      return;
    }

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      bootLive();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start();
      },
      { rootMargin: '320px 0px', threshold: 0 }
    );
    targets.forEach((el) => io.observe(el));
    setTimeout(start, 4500);
  }

  function bootLive() {
    initTabs();
    initPatentFilters();
    initMarqueePause();
    initEmbedImageFallbacks();
    updateClock();
    setInterval(updateClock, 1000);
    els.refreshBtn?.addEventListener('click', () => loadAll(true));
    loadAll();
  }

  scheduleIdle(deferBootLive, 900);
})();
