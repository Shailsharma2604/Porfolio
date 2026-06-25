(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isCoarse = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionLite = isMobile || isCoarse || prefersReducedMotion;

  if (motionLite) document.body.classList.add('motion-lite');

  function scheduleIdle(fn, timeout = 2000) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
    else setTimeout(fn, 1);
  }

  function throttleRaf(fn) {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
    };
  }

  const html = document.documentElement;
  const body = document.body;
  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const yearEl = $('#year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ═══ Theme system ═══ */
  const ACCENT_RGB = {
    acid: '200, 255, 0',
    violet: '139, 92, 246',
    ocean: '14, 165, 233',
    emerald: '16, 185, 129',
    sunset: '249, 115, 22',
    rose: '244, 63, 94',
    databricks: '255, 54, 33',
  };

  const DEFAULT_THEME = { mode: 'dark', accent: 'violet', particles: !isCoarse && !isMobile, cursor: !isCoarse };

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function loadTheme() {
    try {
      return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem('portfolio-theme') || '{}') };
    } catch {
      return { ...DEFAULT_THEME };
    }
  }

  function saveTheme(state) {
    localStorage.setItem('portfolio-theme', JSON.stringify(state));
  }

  let themeState = loadTheme();

  function applyTheme() {
    html.dataset.mode = themeState.mode;

    if (themeState.accent === 'custom' && themeState.custom) {
      html.dataset.accent = 'custom';
      html.style.setProperty('--primary', themeState.custom);
      html.style.setProperty('--primary-rgb', hexToRgb(themeState.custom));
    } else {
      html.dataset.accent = themeState.accent || 'violet';
      html.style.removeProperty('--primary');
      html.style.setProperty('--primary-rgb', ACCENT_RGB[themeState.accent] || ACCENT_RGB.violet);
    }

    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === themeState.mode));
    $$('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.accent === themeState.accent));

    const colorInput = $('#customColor');
    const hexLabel = $('#customHex');
    if (colorInput && themeState.custom) colorInput.value = themeState.custom;
    if (hexLabel) hexLabel.textContent = themeState.custom || colorInput?.value || '#8b5cf6';

    const useCursor = themeState.cursor && canUseCustomCursor();
    body.classList.toggle('cursor-on', useCursor);
    if (!useCursor) {
      body.classList.remove('cursor-active');
    }
    initCustomCursor(useCursor);

    const useParticles = themeState.particles && !isCoarse && !isMobile;
    const canvas = $('#bgParticles');
    if (canvas) canvas.style.opacity = useParticles ? '0.6' : '0';

    const toggleParticles = $('#toggleParticles');
    const toggleCursor = $('#toggleCursor');
    if (toggleParticles) toggleParticles.checked = themeState.particles;
    if (toggleCursor) toggleCursor.checked = themeState.cursor;

    if (useParticles) scheduleIdle(() => initParticles(), 1500);
    else stopParticles();
  }

  function setMode(mode) {
    themeState.mode = mode;
    saveTheme(themeState);
    applyTheme();
  }

  function setAccent(accent, customHex) {
    themeState.accent = accent;
    if (customHex) themeState.custom = customHex;
    saveTheme(themeState);
    applyTheme();
  }

  function resetTheme() {
    themeState = { ...DEFAULT_THEME };
    html.style.removeProperty('--primary');
    saveTheme(themeState);
    applyTheme();
    $('#customColor').value = '#8b5cf6';
  }

  /* Theme panel */
  const themePanel = $('#themePanel');
  const themeOverlay = $('#themeOverlay');
  const themeFab = $('#themeFab');
  const themeClose = $('#themeClose');
  const navThemeBtn = $('#navThemeBtn');

  function openThemePanel() {
    themePanel?.classList.add('open');
    themeOverlay?.classList.add('visible');
    themeOverlay?.removeAttribute('hidden');
    themePanel?.removeAttribute('hidden');
    themeFab?.classList.add('panel-open');
    body.style.overflow = 'hidden';
  }

  function closeThemePanel() {
    themePanel?.classList.remove('open');
    themeOverlay?.classList.remove('visible');
    themeFab?.classList.remove('panel-open');
    body.style.overflow = '';
  }

  themeFab?.addEventListener('click', () => {
    themePanel?.classList.contains('open') ? closeThemePanel() : openThemePanel();
  });
  navThemeBtn?.addEventListener('click', openThemePanel);
  themeClose?.addEventListener('click', closeThemePanel);
  themeOverlay?.addEventListener('click', closeThemePanel);

  $$('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  $$('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => setAccent(sw.dataset.accent));
  });

  $('#customColor')?.addEventListener('input', (e) => {
    $('#customHex').textContent = e.target.value;
  });

  $('#applyCustom')?.addEventListener('click', () => {
    const hex = $('#customColor')?.value;
    if (hex) setAccent('custom', hex);
    $$('.swatch').forEach((s) => s.classList.remove('active'));
  });

  $('#themeReset')?.addEventListener('click', resetTheme);

  $('#toggleParticles')?.addEventListener('change', (e) => {
    themeState.particles = e.target.checked;
    saveTheme(themeState);
    applyTheme();
  });

  $('#toggleCursor')?.addEventListener('change', (e) => {
    themeState.cursor = e.target.checked;
    saveTheme(themeState);
    applyTheme();
  });

  applyTheme();

  /* ═══ Now strip (IST clock) ═══ */
  function initNowStrip() {
    const timeEl = $('#nowTime');
    if (!timeEl) return;

    const fmt = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    function tickNow() {
      const now = new Date();
      timeEl.textContent = `${fmt.format(now)} IST`;
      timeEl.dateTime = now.toISOString();
    }

    tickNow();
    setInterval(tickNow, 30000);
  }

  initNowStrip();

  /* ═══ Scroll progress + back-to-top (throttled) ═══ */
  const scrollProgress = $('#scrollProgress');
  const backTop = $('#backTop');
  const onScroll = throttleRaf(() => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 40);
    if (scrollProgress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.style.width = h > 0 ? `${(y / h) * 100}%` : '0%';
    }
    backTop?.classList.toggle('visible', y > 500);
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ═══ Nav mobile ═══ */
  function setNavOpen(open) {
    if (!nav) return;
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    navToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  navToggle?.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) setNavOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!nav?.classList.contains('open')) return;
    if (nav.contains(e.target)) return;
    setNavOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 769px)').matches) setNavOpen(false);
  });

  /* ═══ Custom cursor ═══ */
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let cursorBound = false;
  let ringAnimating = false;
  let ringDirty = false;

  function canUseCustomCursor() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function positionCursor(x, y) {
    mouseX = x;
    mouseY = y;
    if (cursorDot) {
      cursorDot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
    ringDirty = true;
  }

  function onMouseMove(e) {
    positionCursor(e.clientX, e.clientY);
    if (!body.classList.contains('cursor-active')) {
      body.classList.add('cursor-active');
      ringX = e.clientX;
      ringY = e.clientY;
    }
  }

  function animateRing() {
    if (!body.classList.contains('cursor-on')) {
      ringAnimating = false;
      return;
    }
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    if (!ringDirty && Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) {
      ringAnimating = false;
      return;
    }
    ringX += dx * 0.18;
    ringY += dy * 0.18;
    if (Math.abs(mouseX - ringX) < 0.4 && Math.abs(mouseY - ringY) < 0.4) {
      ringX = mouseX;
      ringY = mouseY;
      ringDirty = false;
    }
    if (cursorRing) {
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    }
    requestAnimationFrame(animateRing);
  }

  function bindCursorHover() {
    $$('a, button, .chip, .glass-card, .social-tile, .btn, .swatch, .theme-fab').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing?.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorRing?.classList.remove('hover'));
    });
  }

  function initCustomCursor(enabled) {
    if (!enabled || !cursorDot || !cursorRing) {
      body.classList.remove('cursor-active');
      if (cursorBound) {
        window.removeEventListener('mousemove', onMouseMove);
        cursorBound = false;
      }
      return;
    }

    positionCursor(mouseX, mouseY);
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

    if (!cursorBound) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseleave', () => body.classList.remove('cursor-active'));
      document.addEventListener('mouseenter', () => {
        if (body.classList.contains('cursor-on')) body.classList.add('cursor-active');
      });
      bindCursorHover();
      cursorBound = true;
    }

    if (!ringAnimating) {
      ringAnimating = true;
      animateRing();
    }
  }

  /* ═══ Particle canvas ═══ */
  const canvas = $('#bgParticles');
  let particles = [];
  let animId = null;
  let particlesReady = false;
  let particlesVisible = true;

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('tab-hidden', document.hidden);
  });

  if (canvas) {
    new IntersectionObserver(
      ([entry]) => {
        particlesVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    ).observe(canvas);
  }

  function stopParticles() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
  }

  function initParticles() {
    if (!canvas || !themeState.particles || isCoarse || isMobile) {
      stopParticles();
      return;
    }
    if (particlesReady && animId) return;
    const ctx = canvas.getContext('2d');
    let particleRgb = getComputedStyle(html).getPropertyValue('--primary-rgb').trim() || '139, 92, 246';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    if (!canvas.dataset.resizeBound) {
      window.addEventListener('resize', resize);
      canvas.dataset.resizeBound = '1';
    }

    const count = Math.min(32, Math.floor((canvas.width * canvas.height) / 28000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
    }));

    function draw() {
      animId = requestAnimationFrame(draw);
      if (!themeState.particles || document.hidden || !particlesVisible) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const linkDist = 90;
      const linkDistSq = linkDist * linkDist;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleRgb}, 0.5)`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i += 2) {
        const p = particles[i];
        for (let j = i + 3; j < particles.length; j += 2) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkDistSq) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${particleRgb}, ${0.1 * (1 - dist / linkDist)})`;
            ctx.stroke();
          }
        }
      }
    }

    particlesReady = true;
    if (animId) cancelAnimationFrame(animId);
    draw();

    if (!html.dataset.themeRgbBound) {
      html.dataset.themeRgbBound = '1';
      new MutationObserver(() => {
        particleRgb = getComputedStyle(html).getPropertyValue('--primary-rgb').trim() || particleRgb;
      }).observe(html, { attributes: true, attributeFilter: ['data-accent', 'style'] });
    }
  }

  /* ═══ 3D tilt on cards (desktop only) ═══ */
  if (!prefersReducedMotion && !isCoarse) {
    const tiltRaf = throttleRaf((card, e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    $$('.glass-card, .tilt-card, .metric-card').forEach((card) => {
      card.classList.add('tilt-active');
      card.addEventListener('mousemove', (e) => tiltRaf(card, e));
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* Stat card cursor glow (throttled) */
  let glowCards = [];
  const refreshGlowCards = () => {
    glowCards = $$('.live-stat-card, .impact-stat');
  };
  refreshGlowCards();
  window.portfolioRefreshGlowCards = refreshGlowCards;

  if (!isCoarse) {
    document.addEventListener(
      'mousemove',
      throttleRaf((e) => {
        glowCards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
            card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
          }
        });
      }),
      { passive: true }
    );
  }

  /* ═══ Magnetic buttons ═══ */
  if (!isCoarse) {
  $$('.btn-primary, .nav-cta').forEach((btn) => {
    btn.classList.add('btn-magnetic');
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
  }

  /* ═══ Chip ripple ═══ */
  $$('.chip').forEach((chip) => {
    chip.style.position = 'relative';
    chip.style.overflow = 'hidden';
    chip.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(chip.offsetWidth, chip.offsetHeight);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.offsetX - size / 2}px`;
      ripple.style.top = `${e.offsetY - size / 2}px`;
      chip.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ═══ Counter animation ═══ */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const duration = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * ease) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.done) {
          entry.target.dataset.done = '1';
          animateCount(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ═══ Reveal on scroll ═══ */
  function markAllRevealed() {
    $$('.reveal, .reveal-stagger, .reveal-child, .reveal-fade, .reveal-scale, .reveal-head, .activity-subhead').forEach((el) => {
      el.classList.add('visible', 'subhead-visible');
    });
  }

  const revealObserver = prefersReducedMotion
    ? { observe: () => {} }
    : new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              if (entry.target.classList.contains('activity-subhead')) {
                entry.target.classList.add('subhead-visible');
              }
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
      );

  function observeReveal(el) {
    if (!el || el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    if (!prefersReducedMotion) revealObserver.observe(el);
    else el.classList.add('visible');
  }

  window.portfolioReveal = (root = document) => {
    root.querySelectorAll('.reveal-child, .reveal-fade, .reveal-scale, .pop-in, .activity-subhead').forEach(observeReveal);
    root.querySelectorAll('.reveal-stagger:not([data-reveal-bound])').forEach((el) => {
      observeReveal(el);
    });
    root.querySelectorAll('[data-count]').forEach((el) => {
      if (!el.dataset.done && el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        el.dataset.done = '1';
        animateCount(el);
      }
    });
  };

  if (prefersReducedMotion) {
    document.body.classList.add('page-loaded', 'motion-reduced');
    markAllRevealed();
  } else {
    requestAnimationFrame(() => {
      document.body.classList.add('page-loaded');
    });
  }

  $$('.hero-text > *, .hero-visual > .hero-metrics, .hero-badges, .hero-actions, .hero-live-bar').forEach((el, i) => {
    el.classList.add('hero-stagger');
    el.style.setProperty('--hero-i', i);
  });

  $$('.section-head').forEach((el) => {
    el.classList.add('reveal-head');
    observeReveal(el);
  });

  $$('.section, .hero').forEach((el) => {
    el.classList.add('reveal');
    observeReveal(el);
  });

  const staggerSelectors = [
    '.exp-grid',
    '.projects-masonry',
    '.stack-bento',
    '.certs-row',
    '.activity-hub',
    '.patents-grid',
    '.insights-grid',
    '.skill-meters',
    '.exp-timeline',
    '.about-bento',
    '.hero-metrics',
    '.patent-spotlight-grid',
    '.patent-summary-stack',
    '.contact-channels',
    '.social-grid',
    '.project-filters',
    '.patent-filters',
    '.live-tabs',
    '.project-carousel-wrap',
    '.skills-viz-row',
    '.writing-grid',
    '.devshell-wrap',
    '.contact-form',
  ];

  staggerSelectors.forEach((sel) => {
    $$(sel).forEach((el) => {
      el.classList.add('reveal-stagger');
      observeReveal(el);
    });
  });

  $$('.metric-card, .info-row, .stack-block').forEach((el) => {
    el.classList.add('reveal-child');
    observeReveal(el);
  });

  $$('.activity-subhead').forEach(observeReveal);

  /* ═══ Active nav ═══ */
  const sectionIds = ['home', 'about', 'devshell', 'experience', 'skills', 'projects', 'patents', 'activity', 'writing', 'certifications', 'contact'];

  /* ═══ Typed hero tagline ═══ */
  const typedEl = $('#typedTagline');
  const phrases = [
    'Scalable data pipelines on Databricks & Spark…',
    'Multi-agent AI systems and RAG architectures…',
    '3 granted patents · assistive tech & innovation…',
    'Enterprise lakehouse engineering with modern AI…',
    'Final-year student shipping production-grade work…',
  ];
  if (typedEl && !motionLite) {
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    function typeTick() {
      const phrase = phrases[phraseIdx];
      if (!deleting) {
        typedEl.textContent = phrase.slice(0, ++charIdx);
        if (charIdx === phrase.length) {
          deleting = true;
          setTimeout(typeTick, 2200);
          return;
        }
      } else {
        typedEl.textContent = phrase.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      setTimeout(typeTick, deleting ? 35 : 55);
    }
    setTimeout(typeTick, 600);
  }

  /* ═══ Back to top ═══ */
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks?.querySelectorAll('a').forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      });
    },
    { threshold: 0.25, rootMargin: `-${nav?.offsetHeight || 76}px 0px -60% 0px` }
  );

  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });

  /* ═══ Hero avatar with local + remote fallbacks ═══ */
  function initHeroAvatar() {
    const img = $('#heroAvatar');
    if (!img) return;

    const sources = [
      'assets/profile.jpg',
      'assets/profile.png',
      'assets/profile.webp',
      'assets/images/profile.jpg',
      'assets/images/profile.png',
      'https://github.com/Shailsharma2604.png?size=400',
      'https://avatars.githubusercontent.com/u/125866925?v=4',
    ];

    const initialsSvg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="#09090f"/>
        <circle cx="200" cy="200" r="160" fill="url(#g)" opacity="0.25"/>
        <text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="#8b5cf6">SS</text>
      </svg>`
    );

    let index = 0;
    img.addEventListener('error', () => {
      index += 1;
      if (index < sources.length) {
        img.src = sources[index];
        return;
      }
      img.src = `data:image/svg+xml,${initialsSvg}`;
      img.classList.add('hero-avatar-fallback');
    });

    img.src = sources[0];
  }

  initHeroAvatar();
})();
