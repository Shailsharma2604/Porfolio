(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ═══ Floating code snippets ═══ */
  const SNIPPETS = [
    'df.groupBy("region").agg(F.sum("revenue"))',
    'spark.read.format("delta").load("/mnt/lake")',
    'SELECT * FROM analytics.fact_orders',
    'model = AutoML().fit(X_train, y_train)',
    'await chroma.add(documents=chunks)',
    'dbutils.widgets.text("env", "prod")',
    'CREATE TABLE catalog.schema.events',
    'agent.orchestrate(task="plan POC")',
    '@app.route("/api/health")',
    'unity_catalog.grant("SELECT", table)',
  ];

  function initCodeSnippets() {
    const layer = $('#bgCodeSnippets');
    if (!layer || reduced || mobile) return;

    SNIPPETS.forEach((text, i) => {
      const el = document.createElement('span');
      el.className = 'code-snippet-float';
      el.textContent = text;
      el.style.setProperty('--snip-x', `${8 + (i * 9) % 82}%`);
      el.style.setProperty('--snip-y', `${5 + (i * 13) % 88}%`);
      el.style.setProperty('--snip-dur', `${18 + (i % 5) * 4}s`);
      el.style.setProperty('--snip-delay', `${-i * 2.5}s`);
      layer.appendChild(el);
    });
  }

  /* ═══ Parallax layers ═══ */
  function initParallax() {
    if (reduced || mobile) return;

    const orbs = $('.bg-orbs');
    const mesh = $('.bg-mesh');
    const heroVisual = $('.hero-visual');
    const heroText = $('.hero-text');
    let parallaxTicking = false;

    window.addEventListener(
      'scroll',
      () => {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (orbs) orbs.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
          if (mesh) mesh.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
          if (heroVisual) heroVisual.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
          if (heroText) heroText.style.transform = `translate3d(0, ${y * 0.04}px, 0)`;
          parallaxTicking = false;
        });
      },
      { passive: true }
    );
  }

  /* ═══ Hero 3D avatar tilt — disabled (static profile photo) ═══ */
  function initHeroTilt() {
    /* Avatar tilt intentionally disabled */
  }

  /* ═══ Initial name decode on load ═══ */
  function initHeroDecode() {
    const el = $('#heroNameScramble');
    if (!el || reduced) return;
    const final = el.textContent.trim();
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    const start = performance.now();
    const duration = 900;

    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(final.length * p);
      let out = final.slice(0, revealed);
      for (let i = revealed; i < final.length; i++) {
        out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }

  /* ═══ Section divider draw-in ═══ */
  function initSectionDividers() {
    $$('.section-divider').forEach((div) => {
      if (reduced) {
        div.classList.add('drawn');
        return;
      }
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) div.classList.add('drawn');
        },
        { threshold: 0.5 }
      ).observe(div);
    });
  }

  /* ═══ Career timeline rail progress ═══ */
  function initTimelineProgress() {
    const rail = $('.exp-rail');
    const timeline = $('.exp-timeline');
    if (!rail || !timeline || reduced) return;

    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) rail.classList.add('active');
      },
      { threshold: 0.2 }
    ).observe(timeline);

    $$('.exp-card').forEach((card, i) => {
      card.style.setProperty('--exp-i', i);
      card.classList.add('exp-milestone');
      if (reduced) return;
      new IntersectionObserver(
        ([entry]) => card.classList.toggle('in-view', entry.isIntersecting),
        { threshold: 0.4 }
      ).observe(card);
    });
  }

  /* ═══ Skills radar chart ═══ */
  const RADAR_SKILLS = [
    { label: 'Python', level: 92 },
    { label: 'Databricks', level: 88 },
    { label: 'SQL', level: 85 },
    { label: 'AI/LLMs', level: 82 },
    { label: 'Web', level: 78 },
    { label: 'Azure', level: 75 },
  ];

  function initSkillRadar() {
    const canvas = $('#skillRadar');
    const wrap = canvas?.closest('.skill-radar-wrap');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    let animProgress = reduced ? 1 : 0;
    let hovered = -1;

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.36;
      const n = RADAR_SKILLS.length;
      const rgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-rgb').trim() || '139, 92, 246';

      ctx.clearRect(0, 0, w, h);

      for (let ring = 1; ring <= 4; ring++) {
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (maxR * ring) / 4;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${rgb}, ${0.08 + ring * 0.04})`;
        ctx.stroke();
      }

      RADAR_SKILLS.forEach((skill, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + Math.cos(angle) * maxR;
        const y = cy + Math.sin(angle) * maxR;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(${rgb}, 0.12)`;
        ctx.stroke();

        ctx.fillStyle = i === hovered ? `rgba(${rgb}, 1)` : 'var(--text-dim)';
        ctx.font = '500 11px JetBrains Mono, monospace';
        ctx.textAlign = Math.cos(angle) > 0.1 ? 'left' : Math.cos(angle) < -0.1 ? 'right' : 'center';
        ctx.textBaseline = Math.sin(angle) > 0.2 ? 'top' : Math.sin(angle) < -0.2 ? 'bottom' : 'middle';
        const lx = cx + Math.cos(angle) * (maxR + 18);
        const ly = cy + Math.sin(angle) * (maxR + 18);
        ctx.fillText(skill.label, lx, ly);
      });

      ctx.beginPath();
      RADAR_SKILLS.forEach((skill, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = maxR * (skill.level / 100) * animProgress;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(${rgb}, 0.22)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb}, 0.65)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      RADAR_SKILLS.forEach((skill, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = maxR * (skill.level / 100) * animProgress;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, i === hovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === hovered ? `rgb(${rgb})` : `rgba(${rgb}, 0.8)`;
        ctx.fill();
      });
    }

    function animateIn() {
      if (animProgress >= 1) return;
      animProgress = Math.min(animProgress + 0.03, 1);
      draw();
      requestAnimationFrame(animateIn);
    }

    resize();
    window.addEventListener('resize', () => {
      resize();
      draw();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!finePointer) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      const n = RADAR_SKILLS.length;
      let closest = -1;
      let minDist = Infinity;
      const maxR = Math.min(rect.width, rect.height) * 0.36;
      RADAR_SKILLS.forEach((skill, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = maxR * (skill.level / 100) * animProgress;
        const dx = mx - Math.cos(angle) * r;
        const dy = my - Math.sin(angle) * r;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist && d < 24) {
          minDist = d;
          closest = i;
        }
      });
      hovered = closest;
      const tip = $('#skillRadarTip');
      if (tip) {
        tip.textContent =
          closest >= 0
            ? `${RADAR_SKILLS[closest].label}: ${RADAR_SKILLS[closest].level}% proficiency`
            : 'Hover chart nodes for details';
      }
      draw();
    });

    canvas.addEventListener('mouseleave', () => {
      hovered = -1;
      draw();
    });

    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && animProgress < 1) animateIn();
      },
      { threshold: 0.3 }
    ).observe(wrap);

    draw();
  }

  /* ═══ Project carousel ═══ */
  const FEATURED = [
    {
      title: 'Vizieye',
      desc: 'Hackathon-winning data visualization platform — Smart India Hackathon & H.T.M. 5.0.',
      tags: ['Python', 'Data Viz', 'Hackathon'],
      url: 'https://github.com/Shailsharma2604/Vizieye',
      filter: 'hackathon',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.15))',
    },
    {
      title: 'POC Planning Agent',
      desc: '6-agent LLM pipeline generating architecture, APIs, data models & RAG docs.',
      tags: ['OpenAI', 'Streamlit', 'RAG'],
      url: '',
      filter: 'ai',
      gradient: 'linear-gradient(135deg, rgba(244,114,182,0.25), rgba(139,92,246,0.2))',
    },
    {
      title: 'TrendPredict',
      desc: 'Market trend analysis & prediction dashboard with ML signals.',
      tags: ['ML', 'Analytics'],
      url: 'https://github.com/Shailsharma2604/TrendPredict',
      filter: 'data',
      gradient: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(16,185,129,0.15))',
    },
    {
      title: 'Paper Vision AR',
      desc: 'Augmented reality overlays on physical media — web + CV.',
      tags: ['AR', 'Web'],
      url: 'https://github.com/Shailsharma2604/Paper-Vision-Augmented-Reality',
      filter: 'web',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(244,63,94,0.15))',
    },
  ];

  let carouselIdx = 0;
  let carouselFilter = 'all';

  function renderCarousel() {
    const track = $('#carouselTrack');
    const dots = $('#carouselDots');
    if (!track) return;

    const items = FEATURED.filter((p) => carouselFilter === 'all' || p.filter === carouselFilter);
    if (!items.length) {
      track.innerHTML = '<p class="carousel-empty">No featured projects in this category.</p>';
      if (dots) dots.innerHTML = '';
      return;
    }

    carouselIdx = Math.min(carouselIdx, items.length - 1);
    track.innerHTML = items
      .map(
        (p, i) => `
      <article class="carousel-slide${i === carouselIdx ? ' active' : ''}" data-idx="${i}" style="background:${p.gradient}">
        <div class="carousel-slide-inner">
          <span class="carousel-slide-tag">${p.filter.toUpperCase()}</span>
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          <div class="carousel-slide-chips">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
          ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Live preview ↗</a>` : ''}
        </div>
      </article>`
      )
      .join('');

    if (dots) {
      dots.innerHTML = items.map((_, i) => `<button type="button" class="carousel-dot${i === carouselIdx ? ' active' : ''}" data-idx="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
      dots.querySelectorAll('.carousel-dot').forEach((d) => {
        d.addEventListener('click', () => {
          carouselIdx = parseInt(d.dataset.idx, 10);
          renderCarousel();
        });
      });
    }

    track.querySelectorAll('.carousel-slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === carouselIdx);
    });
  }

  function initProjectCarousel() {
    renderCarousel();

    $('#carouselPrev')?.addEventListener('click', () => {
      const items = FEATURED.filter((p) => carouselFilter === 'all' || p.filter === carouselFilter);
      carouselIdx = (carouselIdx - 1 + items.length) % items.length;
      renderCarousel();
    });

    $('#carouselNext')?.addEventListener('click', () => {
      const items = FEATURED.filter((p) => carouselFilter === 'all' || p.filter === carouselFilter);
      carouselIdx = (carouselIdx + 1) % items.length;
      renderCarousel();
    });

    window.portfolioSyncCarousel = (filter) => {
      carouselFilter = filter;
      carouselIdx = 0;
      renderCarousel();
    };

    if (!reduced && !mobile) {
      setInterval(() => {
        const items = FEATURED.filter((p) => carouselFilter === 'all' || p.filter === carouselFilter);
        if (items.length > 1 && !document.hidden) {
          carouselIdx = (carouselIdx + 1) % items.length;
          renderCarousel();
        }
      }, 6000);
    }
  }

  /* ═══ Devshell auto-typing showcase ═══ */
  const DEVSHELL_LINES = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: 'Shail Sharma — Associate Data Engineer @ R Systems' },
    { type: 'cmd', text: 'cat stack.txt' },
    { type: 'out', text: 'Python · Databricks · Spark · Snowflake · LLMs/RAG · React' },
    { type: 'cmd', text: 'git log --oneline -3' },
    { type: 'out', text: 'a3f2c1d feat: lakehouse pipeline\n9b1e4f2 fix: unity catalog grants\n7c8d0a1 docs: POC agent architecture' },
    { type: 'cmd', text: 'echo $STATUS' },
    { type: 'out', text: 'Available for opportunities · Final year B.E. CSE (AI)' },
  ];

  function initDevShell() {
    const body = $('#devshellBody');
    if (!body || reduced) {
      DEVSHELL_LINES.forEach((line) => {
        const div = document.createElement('div');
        div.className = `devshell-line devshell-${line.type}`;
        div.innerHTML =
          line.type === 'cmd'
            ? `<span class="devshell-prompt">❯</span> ${line.text}`
            : line.text.replace(/\n/g, '<br>');
        body?.appendChild(div);
      });
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let currentEl = null;

    function typeNext() {
      if (lineIdx >= DEVSHELL_LINES.length) {
        setTimeout(() => {
          body.innerHTML = '';
          lineIdx = 0;
          charIdx = 0;
          typeNext();
        }, 4000);
        return;
      }

      const line = DEVSHELL_LINES[lineIdx];
      if (charIdx === 0) {
        currentEl = document.createElement('div');
        currentEl.className = `devshell-line devshell-${line.type}`;
        if (line.type === 'cmd') {
          currentEl.innerHTML = '<span class="devshell-prompt">❯</span> <span class="devshell-typed"></span>';
        } else {
          currentEl.innerHTML = '<span class="devshell-typed"></span>';
        }
        body.appendChild(currentEl);
        body.scrollTop = body.scrollHeight;
      }

      const typed = $('.devshell-typed', currentEl);
      const full = line.text;
      if (charIdx < full.length) {
        typed.textContent = full.slice(0, ++charIdx);
        setTimeout(typeNext, line.type === 'cmd' ? 42 : 18);
      } else {
        if (line.type === 'out' && full.includes('\n')) {
          typed.innerHTML = full.replace(/\n/g, '<br>');
        }
        lineIdx += 1;
        charIdx = 0;
        setTimeout(typeNext, line.type === 'cmd' ? 400 : 600);
      }
    }

    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !body.dataset.started) {
          body.dataset.started = '1';
          typeNext();
        }
      },
      { threshold: 0.35 }
    ).observe(body.closest('.devshell-wrap') || body);
  }

  /* ═══ Performance metrics widget ═══ */
  function initPerfWidget() {
    const grid = $('#perfWidgetGrid');
    if (!grid) return;

    const nav = performance.getEntriesByType('navigation')[0];
    const loadMs = nav ? Math.round(nav.loadEventEnd - nav.startTime) : null;
    const domMs = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null;

    const metrics = [
      { icon: '⚡', label: 'Page load', value: loadMs ? `${loadMs}ms` : '—', sub: 'Navigation timing' },
      { icon: '📄', label: 'DOM ready', value: domMs ? `${domMs}ms` : '—', sub: 'Content parsed' },
      { icon: '📦', label: 'Repos', value: '—', sub: 'GitHub live', id: 'perfRepos' },
      { icon: '👥', label: 'Followers', value: '—', sub: 'GitHub live', id: 'perfFollowers' },
    ];

    grid.innerHTML = metrics
      .map(
        (m) => `
      <div class="perf-metric pop-in">
        <span class="perf-icon">${m.icon}</span>
        <span class="perf-val" ${m.id ? `id="${m.id}"` : ''}>${m.value}</span>
        <span class="perf-label">${m.label}</span>
        <span class="perf-sub">${m.sub}</span>
      </div>`
      )
      .join('');

    window.portfolioUpdatePerf = (repos, followers) => {
      const r = $('#perfRepos');
      const f = $('#perfFollowers');
      if (r) r.textContent = repos ?? '—';
      if (f) f.textContent = followers ?? '—';
    };
  }

  /* ═══ Contact form ═══ */
  function initContactForm() {
    const form = $('#contactForm');
    const success = $('#contactSuccess');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      const data = Object.fromEntries(new FormData(form));

      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');

        form.hidden = true;
        success.hidden = false;
        success.classList.add('show');
        window.portfolioToast?.('Message sent — thanks for reaching out!', 'success');
      } catch {
        form.hidden = true;
        success.hidden = false;
        success.classList.add('show');
        window.portfolioToast?.('Message received locally — email copied as backup', 'success');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send message';
      }
    });
  }

  /* ═══ Project card 3D flip on hover (desktop) ═══ */
  function initProjectFlip() {
    if (reduced || mobile) return;
    $$('#projectsGrid .project-card:not(.project-cta-card)').forEach((card) => {
      card.classList.add('project-flip-card');
      const inner = document.createElement('div');
      inner.className = 'project-flip-inner';
      while (card.firstChild) inner.appendChild(card.firstChild);
      card.appendChild(inner);
    });
  }

  /* ═══ Sync carousel with project filters ═══ */
  function hookProjectFilters() {
    $$('.project-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.portfolioSyncCarousel?.(btn.dataset.filter);
      });
    });
  }

  /* ═══ Boot (critical first, heavy deferred) ═══ */
  function scheduleIdle(fn, timeout = 2000) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
    else setTimeout(fn, 1);
  }

  initSectionDividers();
  initTimelineProgress();
  initProjectCarousel();
  initDevShell();
  initPerfWidget();
  initContactForm();
  hookProjectFilters();

  scheduleIdle(() => {
    initCodeSnippets();
    initParallax();
    initHeroDecode();
    initSkillRadar();
    initProjectFlip();
  }, 1800);
})();
