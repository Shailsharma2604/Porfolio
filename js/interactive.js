(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const SECTIONS = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'about', label: 'About', icon: '◉' },
    { id: 'experience', label: 'Experience', icon: '◈' },
    { id: 'milestones', label: 'Milestones', icon: '★' },
    { id: 'skills', label: 'Skills', icon: '◆' },
    { id: 'projects', label: 'Projects', icon: '▣' },
    { id: 'patents', label: 'Patents', icon: '🏅' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
    { id: 'writing', label: 'Writing', icon: '✎' },
    { id: 'certifications', label: 'Certifications', icon: '✓' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'faq', label: 'FAQ', icon: '?' },
    { id: 'contact', label: 'Contact', icon: '✉' },
  ];

  const LINKS = [
    { label: 'GitHub Profile', url: 'https://github.com/Shailsharma2604', icon: 'GH', group: 'Links' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/shail2604', icon: 'in', group: 'Links' },
    { label: 'Databricks Directory', url: 'https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1', icon: '◆', group: 'Links' },
    { label: 'Kaggle', url: 'https://www.kaggle.com/shail2604', icon: 'K', group: 'Links' },
    { label: 'ORCID', url: 'https://orcid.org/0009-0005-6101-1998', icon: 'ID', group: 'Links' },
    { label: 'Patents Registry', url: 'https://curin.chitkara.edu.in/patents-granted/', icon: 'P', group: 'Links' },
    { label: 'Download Resume', url: 'assets/resume.pdf', icon: '↓', group: 'Links' },
  ];

  const VCARD = `BEGIN:VCARD
VERSION:3.0
FN:Shail Sharma
N:Sharma;Shail;;;
TITLE:Associate Data Engineer
ORG:R Systems International
EMAIL;TYPE=INTERNET:shail020604@gmail.com
TEL;TYPE=CELL:+918288851361
URL:https://www.linkedin.com/in/shail2604
NOTE:Portfolio — Data Engineer & AI Developer. 3 granted patents. Databricks Certified.
END:VCARD`;

  const ACTIONS = [
    { label: 'Copy email', action: 'copy-email', icon: '⎘', group: 'Actions' },
    { label: 'Copy phone', action: 'copy-phone', icon: '⎘', group: 'Actions' },
    { label: 'Share portfolio link', action: 'share', icon: '↗', group: 'Actions' },
    { label: 'Share on LinkedIn', action: 'share-linkedin', icon: 'in', group: 'Actions' },
    { label: 'Download vCard', action: 'vcard', icon: '↓', group: 'Actions' },
    { label: 'Keyboard shortcuts', action: 'shortcuts', icon: '?', group: 'Actions' },
    { label: 'Open theme panel', action: 'theme', icon: '◐', group: 'Actions' },
    { label: 'Open terminal', action: 'terminal', icon: '>_', group: 'Actions' },
    { label: 'Refresh live data', action: 'refresh', icon: '↻', group: 'Actions' },
  ];

  let toastTimer = null;
  let gKeyPending = false;
  let gKeyTimer = null;
  let projectFilter = 'all';
  let projectSearch = '';

  /* ─── Smooth scroll for in-page anchors ─── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function smoothScrollTo(el) {
    if (!el) return;
    window.portfolioCloseNav?.();
    const offset = window.portfolioScrollOffset?.() ?? (document.getElementById('nav')?.offsetHeight || 56) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    requestAnimationFrame(() => window.portfolioUpdateActiveNav?.());
  }

  window.portfolioSmoothScroll = smoothScrollTo;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href') === '#') return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target);
    history.replaceState(null, '', `#${id}`);
  });

  /* ─── Toast ─── */
  function toast(msg, type = 'default') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast toast-${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied to clipboard`, 'success');
    } catch {
      toast('Could not copy — try manually', 'error');
    }
  }

  function downloadVCard() {
    const blob = new Blob([VCARD], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Shail-Sharma.vcf';
    a.click();
    URL.revokeObjectURL(url);
    toast('vCard downloaded', 'success');
  }

  async function sharePortfolio(openLinkedIn = false) {
    const url = window.location.href.replace(/#.*$/, '');
    const title = 'Shail Sharma — Data Engineer & AI Developer';
    if (openLinkedIn) {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    await copyText(url, 'Portfolio link');
  }

  window.portfolioShare = sharePortfolio;
  window.portfolioDownloadVCard = downloadVCard;

  /* ─── Command palette ─── */
  const cmdPalette = $('#cmdPalette');
  const cmdOverlay = $('#cmdOverlay');
  const cmdInput = $('#cmdInput');
  const cmdList = $('#cmdList');

  function allCommands() {
    return [
      ...SECTIONS.map((s) => ({ ...s, type: 'section', group: 'Navigate' })),
      ...LINKS.map((l) => ({ ...l, type: 'link' })),
      ...ACTIONS.map((a) => ({ ...a, type: 'action' })),
    ];
  }

  function renderCommands(query = '') {
    const q = query.trim().toLowerCase();
    const items = allCommands().filter(
      (c) =>
        !q ||
        c.label.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
    );

    if (!cmdList) return;
    if (!items.length) {
      cmdList.innerHTML = '<li class="cmd-empty">No matches</li>';
      return;
    }

    let lastGroup = '';
    cmdList.innerHTML = items
      .map((item, i) => {
        let groupHtml = '';
        if (item.group && item.group !== lastGroup) {
          lastGroup = item.group;
          groupHtml = `<li class="cmd-group">${item.group}</li>`;
        }
        return `${groupHtml}<li><button type="button" class="cmd-item${i === 0 ? ' active' : ''}" data-idx="${i}" data-type="${item.type}" data-id="${item.id || ''}" data-url="${item.url || ''}" data-action="${item.action || ''}">
          <span class="cmd-item-icon">${item.icon || '•'}</span>
          <span>${item.label}</span>
        </button></li>`;
      })
      .join('');

    cmdList.querySelectorAll('.cmd-item').forEach((btn) => {
      btn.addEventListener('click', () => runCommand(btn));
    });
  }

  function runCommand(btn) {
    const type = btn.dataset.type;
    if (type === 'section') {
      closeCmd();
      const el = document.getElementById(btn.dataset.id);
      smoothScrollTo(el);
      if (el) history.replaceState(null, '', `#${btn.dataset.id}`);
    } else if (type === 'link') {
      closeCmd();
      window.open(btn.dataset.url, '_blank', 'noopener,noreferrer');
    } else if (type === 'action') {
      closeCmd();
      runAction(btn.dataset.action);
    }
  }

  function runAction(action) {
    if (action === 'copy-email') copyText('shail020604@gmail.com', 'Email');
    if (action === 'copy-phone') copyText('+918288851361', 'Phone');
    if (action === 'share') sharePortfolio(false);
    if (action === 'share-linkedin') sharePortfolio(true);
    if (action === 'vcard') downloadVCard();
    if (action === 'shortcuts') openShortcuts();
    if (action === 'theme') $('#themeFab')?.click();
    if (action === 'terminal') window.portfolioOpenTerminal?.();
    if (action === 'refresh') $('#refreshLiveBtn')?.click();
  }

  function openCmd() {
    window.portfolioCloseNav?.();
    cmdPalette?.removeAttribute('hidden');
    cmdOverlay?.removeAttribute('hidden');
    cmdPalette?.classList.add('open');
    cmdOverlay?.classList.add('visible');
    renderCommands('');
    if (cmdInput) cmdInput.value = '';
    setTimeout(() => cmdInput?.focus(), 50);
    document.body.classList.add('modal-open');
  }

  function closeCmd() {
    cmdPalette?.classList.remove('open');
    cmdOverlay?.classList.remove('visible');
    cmdPalette?.setAttribute('hidden', '');
    cmdOverlay?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  cmdOverlay?.addEventListener('click', closeCmd);
  $('#navCmdBtn')?.addEventListener('click', openCmd);
  cmdInput?.addEventListener('input', (e) => renderCommands(e.target.value));

  cmdInput?.addEventListener('keydown', (e) => {
    const items = $$('.cmd-item', cmdList);
    let idx = items.findIndex((el) => el.classList.contains('active'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[idx]?.classList.remove('active');
      idx = (idx + 1) % items.length;
      items[idx]?.classList.add('active');
      items[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[idx]?.classList.remove('active');
      idx = (idx - 1 + items.length) % items.length;
      items[idx]?.classList.add('active');
      items[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[idx]?.click();
    } else if (e.key === 'Escape') {
      closeCmd();
    }
  });

  /* ─── Shortcuts panel ─── */
  const shortcutsPanel = $('#shortcutsPanel');
  const shortcutsOverlay = $('#shortcutsOverlay');

  function openShortcuts() {
    shortcutsPanel?.removeAttribute('hidden');
    shortcutsOverlay?.removeAttribute('hidden');
    shortcutsPanel?.classList.add('open');
    shortcutsOverlay?.classList.add('visible');
    document.body.classList.add('modal-open');
  }

  function closeShortcuts() {
    shortcutsPanel?.classList.remove('open');
    shortcutsOverlay?.classList.remove('visible');
    shortcutsPanel?.setAttribute('hidden', '');
    shortcutsOverlay?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  shortcutsOverlay?.addEventListener('click', closeShortcuts);
  $('#shortcutsClose')?.addEventListener('click', closeShortcuts);

  /* ─── Filter tabs (simple active state, no sliding indicator) ─── */
  window.portfolioSyncFilterIndicator = () => {};

  /* ─── Project filters + search ─── */
  function filterProjects() {
    const q = projectSearch.trim().toLowerCase();
    let visibleCount = 0;

    $$('#projectsGrid .project-card').forEach((card) => {
      if (card.dataset.noModal !== undefined) {
        card.style.display = q ? 'none' : '';
        return;
      }

      const tags = card.dataset.tags || '';
      const text = card.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      const tagMatch = projectFilter === 'all' || tags.includes(projectFilter);
      const searchMatch = !q || text.includes(q);
      const show = tagMatch && searchMatch;

      card.style.display = show ? '' : 'none';
      if (show) {
        visibleCount += 1;
        card.classList.remove('filter-out');
        card.classList.add('filter-in');
      }
    });

    const emptyEl = $('#projectsEmpty');
    if (emptyEl) emptyEl.hidden = visibleCount > 0;
  }

  $$('.project-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.project-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      projectFilter = btn.dataset.filter;
      filterProjects();
    });
  });

  const projectSearchInput = $('#projectSearch');
  projectSearchInput?.addEventListener('input', (e) => {
    projectSearch = e.target.value;
    filterProjects();
  });

  projectSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      projectSearchInput.value = '';
      projectSearch = '';
      filterProjects();
      projectSearchInput.blur();
    }
  });

  /* ─── Stack chip tooltips (desktop hover only) ─── */
  const CHIP_TIPS = {
    Databricks: 'Production lakehouse pipelines & Unity Catalog @ R Systems',
    'Apache Spark': 'Distributed ETL, streaming & batch processing',
    Snowflake: 'Cloud data warehouse & analytics workloads',
    SQL: 'Dimensional modeling, Snowflake & Unity Catalog',
    'Unity Catalog': 'Governance, lineage & access control on Databricks',
    'ETL Pipelines': 'Production-grade ingestion & transformation patterns',
    'Power BI': 'Enterprise dashboards & self-service analytics',
    Azure: 'Cloud data services, deployment & integration',
    Python: 'Daily driver — ML, ETL, automation & scripting',
    Java: 'OOP, enterprise patterns & academic projects',
    'C++': 'Systems programming & algorithms',
    JavaScript: 'Web apps, dashboards & interactive UIs',
    TensorFlow: 'Deep learning models & computer vision',
    'Scikit-learn': 'Classical ML, feature engineering & evaluation',
    'OpenAI / LLMs': 'Multi-agent systems, RAG & prompt engineering',
    'RAG · ChromaDB': 'Retrieval-augmented generation with vector stores',
    'Multi-Agent': 'Orchestrated LLM agents for POC planning',
    React: 'Component-based UIs, dashboards & portfolios',
    Flask: 'Lightweight Python APIs & ML serving',
    Streamlit: 'Rapid ML/AI app prototyping & demos',
    GitHub: 'Open source, CI/CD & collaboration',
    Figma: 'UI/UX design & product prototyping',
  };

  let chipTipEl = null;
  function showChipTip(chip, text) {
    if (!text) return;
    if (!chipTipEl) {
      chipTipEl = document.createElement('div');
      chipTipEl.className = 'chip-tooltip';
      chipTipEl.setAttribute('role', 'tooltip');
      document.body.appendChild(chipTipEl);
    }
    chipTipEl.textContent = text;
    const rect = chip.getBoundingClientRect();
    chipTipEl.style.left = `${rect.left + rect.width / 2}px`;
    chipTipEl.style.top = `${rect.top - 8}px`;
    chipTipEl.classList.add('visible');
  }

  function hideChipTip() {
    chipTipEl?.classList.remove('visible');
  }

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  $$('.chip').forEach((chip) => {
    const label = chip.textContent.replace(/\s+/g, ' ').trim();
    const tip = CHIP_TIPS[label] || chip.dataset.tip;
    if (!tip) return;
    chip.dataset.tip = tip;
    if (canHover) {
      chip.setAttribute('aria-label', `${label}: ${tip}`);
      chip.addEventListener('mouseenter', () => showChipTip(chip, tip));
      chip.addEventListener('mouseleave', hideChipTip);
    }
  });

  /* ─── Skill meters ─── */
  const skillMeters = $('#skillMeters');
  const skillTip = $('#skillMeterTip');

  if (skillMeters) {
    const meterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || skillMeters.dataset.animated) return;
          skillMeters.dataset.animated = '1';
          $$('.skill-meter', skillMeters).forEach((meter, i) => {
            const level = parseInt(meter.dataset.level, 10);
            const fill = $('.skill-meter-fill', meter);
            const pct = $('.skill-meter-pct', meter);
            setTimeout(() => {
              if (fill) fill.style.width = `${level}%`;
              if (pct) pct.textContent = `${level}%`;
            }, 80 * i);
          });
        });
      },
      { threshold: 0.3 }
    );
    meterObserver.observe(skillMeters);

    $$('.skill-meter', skillMeters).forEach((meter) => {
      meter.addEventListener('mouseenter', () => {
        if (skillTip) skillTip.textContent = meter.dataset.tip || meter.dataset.skill;
        meter.classList.add('active');
      });
      meter.addEventListener('mouseleave', () => {
        if (skillTip) skillTip.textContent = 'Tap a skill bar for details';
        meter.classList.remove('active');
      });
      meter.addEventListener('click', () => {
        if (skillTip) skillTip.textContent = meter.dataset.tip || meter.dataset.skill;
        $$('.skill-meter', skillMeters).forEach((m) => m.classList.remove('active'));
        meter.classList.add('active');
      });
    });
  }

  /* ─── Project modal & case studies ─── */
  const projectModal = $('#projectModal');
  const projectModalBackdrop = $('#projectModalBackdrop');

  const FALLBACK_CASE_STUDIES = {
    vizieye: {
      problem: 'Smart India Hackathon teams needed to explore datasets, build charts, and present insights under tight deadlines — without wrestling with fragmented tools or slow iteration cycles.',
      solution: 'Led development of Vizieye, a Python data visualization platform focused on speed, clarity, and team collaboration. Built for SIH & H.T.M. 5.0 with a workflow tuned for rapid exploration and demo-ready outputs.',
      stack: ['Python', 'Data Visualization', 'Collaborative UX', 'Hackathon tooling'],
      impact: 'Team Lead on a hackathon-winning platform — pitched and demoed to national jury panels under competition pressure.',
    },
    lakehouse: {
      problem: 'Enterprise analytics teams needed governed, scalable pipelines that bridge raw ingestion with trusted analytics — without siloed data or brittle ETL.',
      solution: 'Design and build production lakehouse pipelines at R Systems using Databricks, Delta Live Tables, Unity Catalog, and Snowflake integration patterns for enterprise clients.',
      stack: ['Databricks', 'Apache Spark', 'Delta Live Tables', 'Unity Catalog', 'Snowflake', 'ETL'],
      impact: 'Delivering production-grade lakehouse architecture with governance-first data modeling — current role focus since Oct 2025.',
    },
  };

  let caseStudiesCache = null;

  async function loadCaseStudies() {
    if (caseStudiesCache) return caseStudiesCache;
    try {
      const res = await fetch('config/projects.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      caseStudiesCache = { ...FALLBACK_CASE_STUDIES, ...(data.caseStudies || {}) };
    } catch {
      caseStudiesCache = FALLBACK_CASE_STUDIES;
    }
    return caseStudiesCache;
  }

  function renderCaseStudyHtml(study) {
    if (!study) return '';
    const stack = (study.stack || [])
      .map((t) => `<span>${t}</span>`)
      .join('');
    return `
      <div class="case-study-grid">
        <div class="case-study-block">
          <span class="case-study-label">Problem</span>
          <p>${study.problem}</p>
        </div>
        <div class="case-study-block">
          <span class="case-study-label">Solution</span>
          <p>${study.solution}</p>
        </div>
        <div class="case-study-block">
          <span class="case-study-label">Tech stack</span>
          <div class="case-study-stack">${stack}</div>
        </div>
        <div class="case-study-block case-study-impact">
          <span class="case-study-label">Impact</span>
          <p>${study.impact}</p>
        </div>
      </div>`;
  }

  function openProjectModal(card) {
    if (!projectModal || card.dataset.noModal !== undefined) return;
    const idEl = $('#projectModalId');
    const titleEl = $('#projectModalTitle');
    const descEl = $('#projectModalDesc');
    const chipsEl = $('#projectModalChips');
    const ghLink = $('#projectModalGithub');
    const caseEl = $('#projectModalCase');

    if (idEl) idEl.textContent = $('.project-id', card)?.textContent?.trim() || '';
    if (titleEl) titleEl.textContent = $('h3', card)?.textContent?.trim() || '';
    if (descEl) descEl.textContent = $('p', card)?.textContent?.trim() || '';
    if (chipsEl) {
      chipsEl.innerHTML = $$('.project-chips span', card)
        .map((s) => `<span>${s.textContent.trim()}</span>`)
        .join('');
    }
    if (ghLink) {
      const url = card.dataset.github;
      if (url) {
        ghLink.href = url;
        ghLink.hidden = false;
      } else {
        ghLink.hidden = true;
      }
    }

    const caseKey = card.dataset.caseStudy;
    if (caseEl) {
      if (caseKey) {
        loadCaseStudies().then((studies) => {
          const study = studies[caseKey];
          if (study) {
            caseEl.innerHTML = renderCaseStudyHtml(study);
            caseEl.hidden = false;
            projectModal?.classList.add('has-case-study');
          } else {
            caseEl.innerHTML = '';
            caseEl.hidden = true;
            projectModal?.classList.remove('has-case-study');
          }
        });
      } else {
        caseEl.innerHTML = '';
        caseEl.hidden = true;
        projectModal?.classList.remove('has-case-study');
      }
    }

    projectModal.removeAttribute('hidden');
    projectModal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeProjectModal() {
    projectModal?.classList.remove('open', 'has-case-study');
    projectModal?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  $$('#projectsGrid .project-card').forEach((card) => {
    if (card.dataset.noModal !== undefined) return;
    const top = $('.project-top', card);
    if (top && !$('.project-expand-hint', top)) {
      const hint = document.createElement('span');
      hint.className = 'project-expand-hint';
      hint.textContent = 'Click for details';
      const link = $('.project-link', top);
      if (link) top.insertBefore(hint, link);
      else top.appendChild(hint);
    }
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      openProjectModal(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(card);
      }
    });
  });

  $('#projectModalClose')?.addEventListener('click', closeProjectModal);
  $('#projectModalDismiss')?.addEventListener('click', closeProjectModal);
  projectModalBackdrop?.addEventListener('click', closeProjectModal);

  /* ─── Global keyboard shortcuts ─── */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      cmdPalette?.classList.contains('open') ? closeCmd() : openCmd();
      return;
    }
    if (e.key === '?' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      shortcutsPanel?.classList.contains('open') ? closeShortcuts() : openShortcuts();
      return;
    }
    if (e.key === 'Escape') {
      if (document.getElementById('nav')?.classList.contains('open')) return;
      closeCmd();
      closeShortcuts();
      if (projectModal?.classList.contains('open')) closeProjectModal();
      return;
    }
    if (e.target.matches('input, textarea') || cmdPalette?.classList.contains('open')) return;

    if (e.key === 't' || e.key === 'T') {
      $('#themeFab')?.click();
    }
    if (e.key === 'r' || e.key === 'R') {
      $('#refreshLiveBtn')?.click();
      toast('Refreshing live data…', 'default');
    }

    if (e.key === 'g' || e.key === 'G') {
      gKeyPending = true;
      clearTimeout(gKeyTimer);
      gKeyTimer = setTimeout(() => {
        gKeyPending = false;
      }, 1200);
      return;
    }
    if (gKeyPending) {
      gKeyPending = false;
      const map = {
        h: 'home',
        a: 'about',
        e: 'experience',
        p: 'projects',
        l: 'activity',
        c: 'contact',
      };
      const id = map[e.key.toLowerCase()];
      if (id) {
        const el = document.getElementById(id);
        smoothScrollTo(el);
        history.replaceState(null, '', `#${id}`);
      }
    }
  });

  /* ─── Expose refresh for live.js ─── */
  window.portfolioToast = toast;
})();
