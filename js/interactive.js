(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const SECTIONS = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'about', label: 'About', icon: '◉' },
    { id: 'experience', label: 'Experience', icon: '◈' },
    { id: 'skills', label: 'Skills', icon: '◆' },
    { id: 'projects', label: 'Projects', icon: '▣' },
    { id: 'patents', label: 'Patents', icon: '🏅' },
    { id: 'activity', label: 'Live Dashboard', icon: '⚡' },
    { id: 'writing', label: 'Writing', icon: '✎' },
    { id: 'certifications', label: 'Certifications', icon: '✓' },
    { id: 'contact', label: 'Contact', icon: '✉' },
  ];

  const LINKS = [
    { label: 'GitHub Profile', url: 'https://github.com/Shailsharma2604', icon: 'GH', group: 'Links' },
    { label: 'LinkedIn', url: 'https://in.linkedin.com/in/shail-sharma-607175250', icon: 'in', group: 'Links' },
    { label: 'Databricks Directory', url: 'https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1', icon: '◆', group: 'Links' },
    { label: 'Kaggle', url: 'https://www.kaggle.com/shail2604', icon: 'K', group: 'Links' },
    { label: 'ORCID', url: 'https://orcid.org/0009-0005-6101-1998', icon: 'ID', group: 'Links' },
    { label: 'Patents Registry', url: 'https://curin.chitkara.edu.in/patents-granted/', icon: 'P', group: 'Links' },
    { label: 'Download Resume', url: 'assets/resume.pdf', icon: '↓', group: 'Links' },
  ];

  const ACTIONS = [
    { label: 'Copy email', action: 'copy-email', icon: '⎘', group: 'Actions' },
    { label: 'Copy phone', action: 'copy-phone', icon: '⎘', group: 'Actions' },
    { label: 'Open theme panel', action: 'theme', icon: '◐', group: 'Actions' },
    { label: 'Open terminal', action: 'terminal', icon: '>_', group: 'Actions' },
    { label: 'Refresh live data', action: 'refresh', icon: '↻', group: 'Actions' },
  ];

  let toastTimer = null;
  let gKeyPending = false;
  let gKeyTimer = null;
  let projectFilter = 'all';

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
      document.getElementById(btn.dataset.id)?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'link') {
      closeCmd();
      window.open(btn.dataset.url, btn.dataset.url.startsWith('assets/') ? '_blank' : '_blank');
    } else if (type === 'action') {
      closeCmd();
      runAction(btn.dataset.action);
    }
  }

  function runAction(action) {
    if (action === 'copy-email') copyText('shail020604@gmail.com', 'Email');
    if (action === 'copy-phone') copyText('+918288851361', 'Phone');
    if (action === 'theme') $('#themeFab')?.click();
    if (action === 'terminal') window.portfolioOpenTerminal?.();
    if (action === 'refresh') $('#refreshLiveBtn')?.click();
  }

  function openCmd() {
    cmdPalette?.removeAttribute('hidden');
    cmdOverlay?.removeAttribute('hidden');
    cmdPalette?.classList.add('open');
    cmdOverlay?.classList.add('visible');
    renderCommands('');
    cmdInput.value = '';
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
  }

  function closeShortcuts() {
    shortcutsPanel?.classList.remove('open');
    shortcutsOverlay?.classList.remove('visible');
    shortcutsPanel?.setAttribute('hidden', '');
    shortcutsOverlay?.setAttribute('hidden', '');
  }

  shortcutsOverlay?.addEventListener('click', closeShortcuts);
  $('#shortcutsClose')?.addEventListener('click', closeShortcuts);

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
      closeCmd();
      closeShortcuts();
      closeProjectModal();
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
      gKeyTimer = setTimeout(() => (gKeyPending = false), 1200);
      return;
    }
    if (gKeyPending) {
      gKeyPending = false;
      const map = { h: 'home', p: 'projects', l: 'activity', c: 'contact', a: 'about' };
      const id = map[e.key.toLowerCase()];
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ─── Section dots ─── */
  const sectionDots = $('#sectionDots');
  if (sectionDots) {
    sectionDots.innerHTML = SECTIONS.map(
      (s) => `<a href="#${s.id}" class="section-dot" data-section="${s.id}" title="${s.label}"><span class="section-dot-label">${s.label}</span></a>`
    ).join('');

    const dotObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            $$('.section-dot').forEach((d) => d.classList.toggle('active', d.dataset.section === entry.target.id));
          }
        });
      },
      { threshold: 0.35, rootMargin: '-72px 0px -55% 0px' }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) dotObserver.observe(el);
    });
  }

  /* ─── Project filters ─── */
  function filterProjects() {
    $$('#projectsGrid .project-card').forEach((card) => {
      if (card.dataset.noModal !== undefined) {
        card.style.display = '';
        return;
      }
      const tags = card.dataset.tags || '';
      const show = projectFilter === 'all' || tags.includes(projectFilter);
      card.style.display = show ? '' : 'none';
      if (show) {
        card.classList.remove('filter-out');
        card.classList.add('filter-in');
      }
    });
  }

  $$('.project-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.project-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      projectFilter = btn.dataset.filter;
      filterProjects();
    });
  });

  /* ─── Project modal ─── */
  const projectModal = $('#projectModal');
  const projectModalBackdrop = $('#projectModalBackdrop');

  function openProjectModal(card) {
    if (card.dataset.noModal !== undefined) return;
    const title = $('h3', card)?.textContent || 'Project';
    const desc = $('p', card)?.textContent || '';
    const id = $('.project-id', card)?.textContent || '';
    const chips = $$('.project-chips span', card).map((c) => c.textContent);
    const gh = card.dataset.github || $('a.project-link', card)?.href;

    $('#projectModalTitle').textContent = title;
    $('#projectModalDesc').textContent = desc;
    $('#projectModalId').textContent = id;
    $('#projectModalChips').innerHTML = chips.map((c) => `<span>${c}</span>`).join('');

    const ghBtn = $('#projectModalGithub');
    if (gh && ghBtn) {
      ghBtn.href = gh;
      ghBtn.hidden = false;
    } else if (ghBtn) {
      ghBtn.hidden = true;
    }

    projectModal?.removeAttribute('hidden');
    projectModal?.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeProjectModal() {
    projectModal?.classList.remove('open');
    projectModal?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  projectModalBackdrop?.addEventListener('click', closeProjectModal);
  $('#projectModalClose')?.addEventListener('click', closeProjectModal);
  $('#projectModalDismiss')?.addEventListener('click', closeProjectModal);

  $$('#projectsGrid .project-card').forEach((card) => {
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

  /* ─── Copy buttons ─── */
  $$('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => copyText(btn.dataset.copy, btn.dataset.label));
  });

  /* ─── Cert flip ─── */
  $$('.cert-flip-wrap').forEach((wrap) => {
    const flip = () => wrap.querySelector('.cert-flip')?.classList.toggle('flipped');
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      flip();
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
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
        if (skillTip) skillTip.textContent = 'Hover a skill to see context';
        meter.classList.remove('active');
      });
      meter.addEventListener('click', () => {
        if (skillTip) skillTip.textContent = meter.dataset.tip || meter.dataset.skill;
        $$('.skill-meter', skillMeters).forEach((m) => m.classList.remove('active'));
        meter.classList.add('active');
      });
    });
  }

  /* ─── Kbd hint fade ─── */
  const kbdHint = $('#kbdHint');
  if (kbdHint) {
    setTimeout(() => kbdHint.classList.add('fade-out'), 8000);
    setTimeout(() => kbdHint.remove(), 9500);
  }

  /* ─── Expose refresh for live.js ─── */
  window.portfolioToast = toast;
})();
