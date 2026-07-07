(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isTablet = window.matchMedia('(max-width: 1024px)').matches;
  const isCoarse = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PERF_LITE_KEY = 'portfolio-perf-lite';

  let perfLite = false;
  try {
    perfLite = localStorage.getItem(PERF_LITE_KEY) === '1';
  } catch {}

  const motionLite = isMobile || isTablet || isCoarse || prefersReducedMotion || perfLite;

  if (motionLite) document.body.classList.add('motion-lite');
  if (perfLite) document.body.classList.add('perf-lite');

  /* Single rAF scroll scheduler — all scroll work shares one frame */
  const scrollHandlers = new Set();
  let scrollRafScheduled = false;

  function runScrollHandlers() {
    scrollRafScheduled = false;
    scrollHandlers.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn('Scroll handler error:', err);
      }
    });
  }

  function scheduleScrollRun() {
    if (scrollRafScheduled) return;
    scrollRafScheduled = true;
    requestAnimationFrame(runScrollHandlers);
  }

  window.portfolioOnScroll = (fn) => {
    scrollHandlers.add(fn);
    return () => scrollHandlers.delete(fn);
  };

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
  const navBackdrop = $('#navBackdrop');

  function isSidebarLayout() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  function getScrollOffset() {
    if (isSidebarLayout()) return 24;
    if (!nav) return 64;
    return Math.ceil(nav.getBoundingClientRect().height) + 8;
  }

  window.portfolioScrollOffset = getScrollOffset;
  window.portfolioIsSidebarLayout = isSidebarLayout;

  let navScrollY = 0;

  function lockBodyScroll() {
    if (body.dataset.scrollLocked === '1') return;
    navScrollY = window.scrollY;
    body.dataset.scrollLocked = '1';
    body.style.position = 'fixed';
    body.style.top = `-${navScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  }

  function unlockBodyScroll() {
    if (body.dataset.scrollLocked !== '1') return;
    body.dataset.scrollLocked = '0';
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    window.scrollTo(0, navScrollY);
  }

  function setNavOpen(open) {
    if (!nav) return;
    if (isSidebarLayout()) open = false;
    const wasOpen = nav.classList.contains('open');
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    navToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const navPanel = $('#navPanel');
    navPanel?.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (navBackdrop) {
      navBackdrop.hidden = !open;
      navBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (open && !wasOpen && !isSidebarLayout()) {
      lockBodyScroll();
    } else if (!open && wasOpen) {
      unlockBodyScroll();
    }
  }

  window.portfolioCloseNav = () => setNavOpen(false);
  const yearEl = $('#year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ═══ Particle canvas ═══
     Declared before the theme system, since applyTheme() synchronously
     calls stopParticles()/schedules initParticles(). */
  const canvas = $('#bgParticles');
  let particles = [];
  let animId = null;
  let particlesReady = false;
  let particlesVisible = true;

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('tab-hidden', document.hidden);
    if (document.hidden) {
      stopParticles();
    } else if (themeState.particles && particlesVisible && !isCoarse && !isMobile && !perfLite) {
      scheduleIdle(() => initParticles(), 300);
    }
    updateBgAnimPause();
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
    if (!canvas || !themeState.particles || isCoarse || isMobile || perfLite) {
      stopParticles();
      return;
    }
    if (particlesReady && animId) return;
    if (particlesReady && !animId) {
      draw();
      return;
    }
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
      if (!themeState.particles || document.hidden || !particlesVisible) {
        animId = null;
        return;
      }

      animId = requestAnimationFrame(draw);
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

  /* ═══ Theme system ═══ */
  const ACCENT_RGB = {
    blue: '37, 99, 235',
    violet: '124, 108, 240',
    ocean: '30, 64, 175',
    emerald: '8, 145, 178',
    sunset: '99, 102, 241',
    rose: '59, 130, 246',
    databricks: '255, 54, 33',
  };

  const THEME_KEY = 'portfolio-theme-v2';
  const DEFAULT_THEME = { mode: 'dark', accent: 'blue', particles: false };

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function loadTheme() {
    try {
      const legacy = localStorage.getItem('portfolio-theme');
      if (legacy && !localStorage.getItem(THEME_KEY)) {
        const parsed = JSON.parse(legacy);
        if (parsed.accent === 'terracotta') parsed.accent = 'blue';
        localStorage.setItem(THEME_KEY, JSON.stringify({ ...DEFAULT_THEME, ...parsed }));
        localStorage.removeItem('portfolio-theme');
      }
      const saved = JSON.parse(localStorage.getItem(THEME_KEY) || '{}');
      if (saved.accent === 'terracotta') saved.accent = 'blue';
      return { ...DEFAULT_THEME, ...saved };
    } catch {
      return { ...DEFAULT_THEME };
    }
  }

  function saveTheme(state) {
    localStorage.setItem(THEME_KEY, JSON.stringify(state));
  }

  let themeState = loadTheme();

  function applyTheme() {
    html.dataset.mode = themeState.mode;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.content = themeState.mode === 'light' ? '#f8fafc' : '#0a0f1a';
    }

    if (themeState.accent === 'custom' && themeState.custom) {
      html.dataset.accent = 'custom';
      html.style.setProperty('--primary', themeState.custom);
      html.style.setProperty('--primary-rgb', hexToRgb(themeState.custom));
    } else {
      html.dataset.accent = themeState.accent || 'violet';
      html.style.removeProperty('--primary');
      html.style.setProperty('--primary-rgb', ACCENT_RGB[themeState.accent] || ACCENT_RGB.blue);
    }

    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === themeState.mode));
    $$('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.accent === themeState.accent));

    const colorInput = $('#customColor');
    const hexLabel = $('#customHex');
    if (colorInput && themeState.custom) colorInput.value = themeState.custom;
    if (hexLabel) hexLabel.textContent = themeState.custom || colorInput?.value || '#2563eb';

    const useParticles = themeState.particles && !isCoarse && !isMobile && !perfLite;
    if (canvas) canvas.style.opacity = useParticles ? '0.6' : '0';

    const toggleParticles = $('#toggleParticles');
    if (toggleParticles) toggleParticles.checked = themeState.particles;

    const togglePerfLite = $('#togglePerfLite');
    if (togglePerfLite) togglePerfLite.checked = perfLite;

    if (useParticles) scheduleIdle(() => initParticles(), 1500);
    else stopParticles();
  }

  function setPerfLite(enabled) {
    perfLite = enabled;
    try {
      localStorage.setItem(PERF_LITE_KEY, enabled ? '1' : '0');
    } catch {}
    document.body.classList.toggle('perf-lite', enabled);
    const shouldMotionLite = isMobile || isTablet || isCoarse || prefersReducedMotion || enabled;
    document.body.classList.toggle('motion-lite', shouldMotionLite);
    applyTheme();
    updateBgAnimPause();
  }

  window.portfolioSetPerfLite = setPerfLite;
  window.portfolioIsPerfLite = () => perfLite;
  window.portfolioIsMotionLite = () => motionLite || perfLite;

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
    $('#customColor').value = '#2563eb';
  }

  /* Theme panel */
  const themePanel = $('#themePanel');
  const themeOverlay = $('#themeOverlay');
  const themeFab = $('#themeFab');
  const themeClose = $('#themeClose');

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
    themePanel?.setAttribute('hidden', '');
    themeOverlay?.setAttribute('hidden', '');
    themeFab?.classList.remove('panel-open');
    body.style.overflow = '';
  }

  themeFab?.addEventListener('click', () => {
    themePanel?.classList.contains('open') ? closeThemePanel() : openThemePanel();
  });
  themeClose?.addEventListener('click', closeThemePanel);
  themeOverlay?.addEventListener('click', closeThemePanel);

  $('#navModeBtn')?.addEventListener('click', () => {
    setMode(themeState.mode === 'dark' ? 'light' : 'dark');
  });

  window.portfolioSetMode = setMode;

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

  $('#togglePerfLite')?.addEventListener('change', (e) => {
    setPerfLite(e.target.checked);
  });

  applyTheme();

  /* ═══ Back-to-top (throttled) ═══ */
  const backTop = $('#backTop');

  navToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    setNavOpen(!nav.classList.contains('open'));
  });
  navBackdrop?.addEventListener('click', () => setNavOpen(false));
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });
  nav.querySelector('.nav-footer')?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) {
      e.stopPropagation();
      setNavOpen(false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!nav?.classList.contains('open')) return;
    if (nav.contains(e.target)) return;
    setNavOpen(false);
  });
  window.addEventListener('resize', () => {
    if (isSidebarLayout()) setNavOpen(false);
  });

  /* Stat card cursor glow (throttled) — static highlight, no transform follow */
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
        if (document.body.classList.contains('perf-lite') || document.body.classList.contains('motion-lite')) return;
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

  /* Magnetic / 3D tilt hover removed — caused cursor-tracking jitter */

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

  /* Hero metrics — animate when hero enters viewport */
  const heroMetrics = $('.hero-metrics');
  if (heroMetrics) {
    const heroMetricsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || heroMetrics.dataset.animated === '1') return;
          heroMetrics.dataset.animated = '1';
          $$('[data-count]', heroMetrics).forEach((el) => {
            if (!el.dataset.done) {
              el.dataset.done = '1';
              animateCount(el);
            }
          });
          window.portfolioAnimateHeroMetrics?.();
        });
      },
      { threshold: 0.35 }
    );
    heroMetricsObserver.observe(heroMetrics);
  }

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

  /* Dynamic sections inject content after the scroll observer bound empty shells */
  window.portfolioActivateDynamic = (el) => {
    if (!el) return;
    el.classList.add('visible');
    el.closest('.reveal, .stats-snapshot-section, .section')?.classList.add('visible');
    window.portfolioReveal?.(el);
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
    '.about-magazine',
    '.hero-metrics',
    '.patent-spotlight-grid',
    '.patent-summary-stack',
    '.contact-channels',
    '.social-grid',
    '.project-filters',
    '.project-toolbar',
    '.patent-filters',
    '.live-tabs',
    '.project-carousel-wrap',
    '.skills-viz-row',
    '.writing-grid',
    '.devshell-wrap',
    '.contact-form',
    '.stats-snapshot-grid',
    '.milestones-track',
    '.learning-grid',
    '.faq-list',
    '#resumePreview',
  ];

  staggerSelectors.forEach((sel) => {
    $$(sel).forEach((el) => {
      el.classList.add('reveal-stagger');
      observeReveal(el);
    });
  });

  $$('.metric-card, .about-stat, .about-tile, .stack-block').forEach((el) => {
    el.classList.add('reveal-child');
    observeReveal(el);
  });

  $$('.activity-subhead').forEach(observeReveal);

  /* Static markup may include reveal-* classes before dynamic content loads */
  $$('.reveal-child, .reveal-fade, .reveal-scale').forEach(observeReveal);
  window.portfolioReveal?.(document);

  /* Failsafe: reveal any content still hidden after scroll observer misses */
  setTimeout(() => {
    $$('.reveal:not(.visible), .reveal-stagger:not(.visible), .reveal-child:not(.visible), .reveal-fade:not(.visible), .reveal-scale:not(.visible), .reveal-head:not(.visible)').forEach((el) => {
      el.classList.add('visible');
    });
    $$('.reveal-stagger:not(.visible) > *').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }, 2800);

  /* ═══ Active nav (scroll spy) ═══ */
  const sectionIds = [
    'home',
    'about',
    'experience',
    'milestones',
    'skills',
    'projects',
    'patents',
    'activity',
    'writing',
    'certifications',
    'learning',
    'faq',
    'contact',
  ];

  const NAV_SECTION_MAP = {
    home: null,
    about: 'about',
    experience: 'experience',
    milestones: 'experience',
    skills: 'skills',
    projects: 'projects',
    patents: 'patents',
    activity: 'activity',
    writing: 'writing',
    certifications: 'certifications',
    learning: 'learning',
    faq: null,
    contact: 'contact',
  };

  function getActiveSectionId() {
    const offset = getScrollOffset() + 48;
    let active = sectionIds[0];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= offset) active = id;
    }
    return active;
  }

  function updateActiveNav() {
    const navTarget = NAV_SECTION_MAP[getActiveSectionId()] ?? null;
    navLinks?.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href')?.slice(1);
      a.classList.toggle('active', Boolean(navTarget && href === navTarget));
    });
    $('.nav-cta')?.classList.toggle('active', navTarget === 'contact');
  }

  window.portfolioGetActiveSection = getActiveSectionId;
  window.portfolioUpdateActiveNav = updateActiveNav;

  function updateBgAnimPause() {
    const pause = document.hidden || perfLite || window.scrollY > window.innerHeight * 0.85;
    document.body.classList.toggle('bg-anim-paused', pause);
  }

  const onScrollWork = () => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 40);
    backTop?.classList.toggle('visible', y > 500);
    updateActiveNav();
    updateBgAnimPause();
  };
  scrollHandlers.add(onScrollWork);
  window.addEventListener('scroll', scheduleScrollRun, { passive: true });
  scheduleScrollRun();
  updateActiveNav();
  updateBgAnimPause();

  /* ═══ Nav mobile drawer ═══ */

  /* ═══ Typed hero tagline ═══ */
  const typedEl = $('#typedTagline');
  const phrases = [
    'Scalable data pipelines on Databricks & Spark…',
    'Multi-agent AI systems and RAG architectures…',
    '3 granted patents · assistive tech & innovation…',
    'Enterprise lakehouse engineering with modern AI…',
    'Final-year student shipping production-grade work…',
  ];
  if (typedEl && (motionLite || perfLite)) {
    typedEl.textContent = phrases[0];
    typedEl.closest('.hero-tagline')?.querySelector('.typed-cursor')?.classList.add('hidden');
  } else if (typedEl) {
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let typeTimer = null;
    function typeTick() {
      if (document.hidden || perfLite) return;
      const phrase = phrases[phraseIdx];
      if (!deleting) {
        typedEl.textContent = phrase.slice(0, ++charIdx);
        if (charIdx === phrase.length) {
          deleting = true;
          typeTimer = setTimeout(typeTick, 2200);
          return;
        }
      } else {
        typedEl.textContent = phrase.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      typeTimer = setTimeout(typeTick, deleting ? 35 : 55);
    }
    typeTimer = setTimeout(typeTick, 600);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (typeTimer) clearTimeout(typeTimer);
      } else if (!perfLite) {
        typeTimer = setTimeout(typeTick, 400);
      }
    });
  }

  /* Replace backdrop-filter on below-fold glass cards (desktop only) */
  if (!motionLite && !prefLite && !prefersReducedMotion) {
    const glassSolidObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight * 0.45) {
            entry.target.classList.add('glass-solid');
            glassSolidObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '80px 0px', threshold: 0.01 }
    );
    $$('.glass-card').forEach((el) => glassSolidObserver.observe(el));
    window.portfolioObserveGlassSolid = (root = document) => {
      root.querySelectorAll('.glass-card:not(.glass-solid)').forEach((el) => glassSolidObserver.observe(el));
    };
  }

  /* ─── Back to top ─── */
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
  window.addEventListener('hashchange', updateActiveNav);
  window.addEventListener('resize', throttleRaf(updateActiveNav));

  /* ═══ Hero avatar — LinkedIn via server proxy, then local/GitHub fallbacks ═══ */
  function initHeroAvatar() {
    const img = $('#heroAvatar');
    if (!img) return;

    const linkedInProxy = '/api/linkedin-photo/image';
    const fallbacks = [
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
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="#0a0f1a"/>
        <circle cx="200" cy="200" r="160" fill="url(#g)" opacity="0.25"/>
        <text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="#2563eb">SS</text>
      </svg>`
    );

    let index = -1;

    function markLoaded() {
      img.classList.remove('hero-avatar-loading');
      img.classList.add('hero-avatar-loaded');
    }

    function tryFallback() {
      index += 1;
      if (index < fallbacks.length) {
        img.classList.add('hero-avatar-loading');
        img.classList.remove('hero-avatar-loaded', 'hero-avatar-fallback');
        img.src = fallbacks[index];
        return;
      }
      img.src = `data:image/svg+xml,${initialsSvg}`;
      img.classList.remove('hero-avatar-loading');
      img.classList.add('hero-avatar-fallback');
    }

    img.addEventListener('load', () => {
      if (img.naturalWidth === 0) tryFallback();
      else markLoaded();
    });
    img.addEventListener('error', tryFallback);

    // HTML sets src before defer scripts run — cached images may finish before load fires.
    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded();
      else tryFallback();
    } else if (!img.getAttribute('src')) {
      img.classList.add('hero-avatar-loading');
      img.src = linkedInProxy;
    } else {
      img.classList.add('hero-avatar-loading');
    }
  }

  initHeroAvatar();
})();
