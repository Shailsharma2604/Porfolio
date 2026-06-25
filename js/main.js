(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

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

  const DEFAULT_THEME = { mode: 'dark', accent: 'violet', particles: true, cursor: true };

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

    const canvas = $('#bgParticles');
    if (canvas) canvas.style.opacity = themeState.particles ? '0.6' : '0';

    const toggleParticles = $('#toggleParticles');
    const toggleCursor = $('#toggleCursor');
    if (toggleParticles) toggleParticles.checked = themeState.particles;
    if (toggleCursor) toggleCursor.checked = themeState.cursor;

    if (themeState.particles) initParticles();
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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══ Scroll progress ═══ */
  const scrollProgress = $('#scrollProgress');
  const onScroll = () => {
    nav?.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollProgress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ═══ Nav mobile ═══ */
  navToggle?.addEventListener('click', () => nav.classList.toggle('open'));
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
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

  function canUseCustomCursor() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
      || window.matchMedia('(min-width: 769px)').matches;
  }

  function positionCursor(x, y) {
    mouseX = x;
    mouseY = y;
    if (cursorDot) {
      cursorDot.style.left = `${x}px`;
      cursorDot.style.top = `${y}px`;
    }
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
    if (!body.classList.contains('cursor-on')) return;
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
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
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

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

  function stopParticles() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
  }

  function initParticles() {
    if (!canvas || !themeState.particles) {
      stopParticles();
      return;
    }
    if (particlesReady && animId) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));

    function draw() {
      if (!themeState.particles) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = getComputedStyle(html).getPropertyValue('--primary-rgb').trim() || '139, 92, 246';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, 0.5)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb}, ${0.12 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    }

    particlesReady = true;
    if (animId) cancelAnimationFrame(animId);
    draw();
  }

  /* ═══ 3D tilt on cards ═══ */
  if (!prefersReducedMotion) {
    $$('.glass-card, .tilt-card, .metric-card').forEach((card) => {
      card.classList.add('tilt-active');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* Stat card cursor glow */
  document.addEventListener('mousemove', (e) => {
    $$('.live-stat-card, .impact-stat').forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      }
    });
  }, { passive: true });

  /* ═══ Magnetic buttons ═══ */
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
  if (typedEl) {
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
  const backTop = $('#backTop');
  window.addEventListener(
    'scroll',
    () => backTop?.classList.toggle('visible', window.scrollY > 500),
    { passive: true }
  );
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

  initParticles();
})();
