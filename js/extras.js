(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const toast = (msg, type) => window.portfolioToast?.(msg, type);

  /* ─── Cursor spotlight ─── */
  const spotlight = $('#cursorSpotlight');
  if (spotlight && window.matchMedia('(hover: hover)').matches) {
    let sx = 0;
    let sy = 0;
    let tx = 0;
    let ty = 0;
    document.addEventListener(
      'mousemove',
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
      },
      { passive: true }
    );
    function tickSpotlight() {
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      spotlight.style.setProperty('--spot-x', `${sx}px`);
      spotlight.style.setProperty('--spot-y', `${sy}px`);
      requestAnimationFrame(tickSpotlight);
    }
    tickSpotlight();
  }

  /* ─── Name scramble ─── */
  const scrambleEl = $('#heroNameScramble');
  const ORIGINAL = 'Sharma';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

  function scrambleText(el, final, duration = 600) {
    if (!el || el.dataset.scrambling === '1') return;
    el.dataset.scrambling = '1';
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(final.length * p);
      let out = final.slice(0, revealed);
      for (let i = revealed; i < final.length; i++) {
        out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else {
        el.textContent = final;
        el.dataset.scrambling = '0';
      }
    }
    requestAnimationFrame(frame);
  }

  scrambleEl?.addEventListener('dblclick', () => scrambleText(scrambleEl, ORIGINAL));

  /* ─── Experience expand ─── */
  $$('.exp-expandable').forEach((card) => {
    const toggle = () => {
      const wasOpen = card.classList.contains('expanded');
      $$('.exp-expandable').forEach((c) => c.classList.remove('expanded'));
      if (!wasOpen) card.classList.add('expanded');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* ─── Scroll achievements ─── */
  const ACHIEVEMENTS = {
    patents: { icon: '🏅', title: 'Innovator', desc: 'Discovered the patents section' },
    activity: { icon: '⚡', title: 'Live Wire', desc: 'Opened the live dashboard' },
    projects: { icon: '▣', title: 'Builder', desc: 'Explored the projects gallery' },
    contact: { icon: '✉', title: 'Let\'s Talk', desc: 'Found the contact section' },
    skills: { icon: '◆', title: 'Stack Master', desc: 'Checked out the skill meters' },
    writing: { icon: '✎', title: 'Reader', desc: 'Found the writing section' },
    devshell: { icon: '>_', title: 'Shell Explorer', desc: 'Discovered the dev shell' },
  };

  const unlocked = new Set(JSON.parse(localStorage.getItem('portfolio-achievements') || '[]'));
  const tray = $('#achievementsTray');

  function showAchievement(key) {
    if (unlocked.has(key)) return;
    const a = ACHIEVEMENTS[key];
    if (!a || !tray) return;
    unlocked.add(key);
    localStorage.setItem('portfolio-achievements', JSON.stringify([...unlocked]));

    const el = document.createElement('div');
    el.className = 'achievement-pop';
    el.innerHTML = `<span class="achievement-icon">${a.icon}</span><div><strong>${a.title}</strong><p>${a.desc}</p></div>`;
    tray.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3200);
  }

  Object.keys(ACHIEVEMENTS).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) showAchievement(id);
      },
      { threshold: 0.4 }
    ).observe(el);
  });

  /* ─── Konami code → acid theme ─── */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIdx = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx += 1;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        document.documentElement.dataset.accent = 'acid';
        try {
          const s = JSON.parse(localStorage.getItem('portfolio-theme') || '{}');
          s.accent = 'acid';
          localStorage.setItem('portfolio-theme', JSON.stringify(s));
        } catch {}
        toast('🎮 Acid mode unlocked!', 'success');
        burstConfetti(window.innerWidth / 2, window.innerHeight / 2);
      }
    } else {
      konamiIdx = e.key === KONAMI[0] ? 1 : 0;
    }
  });

  /* ─── Confetti ─── */
  function burstConfetti(x, y, n = 40) {
    const colors = ['#8b5cf6', '#22d3ee', '#f472b6', '#fcd34d', '#34d399'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', `${(Math.random() - 0.5) * 280}px`);
      p.style.setProperty('--dy', `${-80 - Math.random() * 200}px`);
      p.style.setProperty('--rot', `${Math.random() * 720}deg`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  /* ─── Terminal ─── */
  const terminalWrap = $('#terminalWrap');
  const terminalBody = $('#terminalBody');
  const terminalInput = $('#terminalInput');
  let cmdHistory = [];
  let historyIdx = -1;

  const BANNER = `Portfolio shell v2.0 — type <span class="t-dim">help</span> to begin`;

  const COMMANDS = {
    help() {
      return `Available commands:
  <span class="t-cmd">help</span>       show this message
  <span class="t-cmd">whoami</span>     about Shail
  <span class="t-cmd">skills</span>     tech stack summary
  <span class="t-cmd">patents</span>    patent stats
  <span class="t-cmd">experience</span> work history
  <span class="t-cmd">contact</span>    email & phone
  <span class="t-cmd">social</span>     profile links
  <span class="t-cmd">github</span>     open GitHub
  <span class="t-cmd">theme</span>      open theme panel
  <span class="t-cmd">goto</span>       goto [section] — home, projects, patents, live, contact
  <span class="t-cmd">clear</span>      clear terminal
  <span class="t-cmd">stats</span>      exploration stats
  <span class="t-cmd">sudo hire me</span>  👀`;
    },
    whoami() {
      return `Shail Sharma
Associate Data Engineer @ R Systems International
Final-year B.E. CSE (AI) · Chitkara University
3 granted patents · Databricks Certified
Delhi NCR · shail020604@gmail.com`;
    },
    skills() {
      return `Python ██████████ 92%
Databricks/Spark █████████░ 88%
SQL & Modeling ████████░░ 85%
AI / LLMs / RAG ████████░░ 82%
Web (React/Flask) ███████░░░ 78%
Azure ███████░░░ 75%`;
    },
    async patents() {
      try {
        const d = await fetch('/api/patents').then((r) => r.json());
        return `Patents: ${d.grantedCount} granted · ${d.filedCount} filed · ${d.count} total
Registry: curin.chitkara.edu.in/patents-granted/`;
      } catch {
        return '3 granted · 6 filed · 9 total (offline estimate)';
      }
    },
    experience() {
      return `Oct 2025 — Present  Associate Data Engineer @ R Systems
2023 — 2024           UI/UX & Marketing @ Conceptou · Accerovic
2022 — 2026           B.E. CSE (AI) @ Chitkara University`;
    },
    contact() {
      return `Email: shail020604@gmail.com
Phone: +91 82888 51361
LinkedIn: in/shail-sharma-607175250`;
    },
    social() {
      return `GitHub    github.com/Shailsharma2604
LinkedIn  in.linkedin.com/in/shail-sharma-607175250
Kaggle    kaggle.com/shail2604
ORCID     orcid.org/0009-0005-6101-1998
Databricks directory profile linked on site`;
    },
    github() {
      window.open('https://github.com/Shailsharma2604', '_blank');
      return 'Opening GitHub profile…';
    },
    theme() {
      $('#themeFab')?.click();
      return 'Theme panel opened.';
    },
    goto(args) {
      const map = { live: 'activity', home: 'home' };
      const id = map[args[0]] || args[0];
      if (!id) return 'Usage: goto [home|about|projects|patents|live|contact|skills]';
      const el = document.getElementById(id);
      if (!el) return `Unknown section: ${args[0]}`;
      closeTerminal();
      el.scrollIntoView({ behavior: 'smooth' });
      return `Navigating to #${id}…`;
    },
    clear() {
      terminalBody.innerHTML = '';
      return null;
    },
    stats() {
      return `Sections explored: ${unlocked.size}/${Object.keys(ACHIEVEMENTS).length}
Achievements: ${[...unlocked].join(', ') || 'none yet'}
Theme: ${document.documentElement.dataset.accent || 'violet'} · ${document.documentElement.dataset.mode || 'dark'}`;
    },
    sudo(args) {
      if (args.join(' ') === 'hire me') {
        burstConfetti(window.innerWidth / 2, window.innerHeight / 2, 60);
        return '🎉 Permission granted. Let\'s build something great together!';
      }
      return 'sudo: command not found';
    },
  };

  function printLine(html, cls = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${cls}`;
    line.innerHTML = html;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  async function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    printLine(`<span class="t-prompt">❯</span> ${trimmed}`, 't-input-echo');
    cmdHistory.push(trimmed);
    historyIdx = cmdHistory.length;

    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);
    const handler = COMMANDS[cmd];
    if (!handler) {
      printLine(`command not found: ${cmd}. Type <span class="t-dim">help</span>.`, 't-error');
      return;
    }
    const result = await handler(args);
    if (result) printLine(result.replace(/\n/g, '<br>'));
  }

  function openTerminal() {
    terminalWrap?.removeAttribute('hidden');
    terminalWrap?.classList.add('open');
    document.body.classList.add('modal-open');
    if (!terminalBody.dataset.ready) {
      terminalBody.dataset.ready = '1';
      printLine(BANNER, 't-banner');
      printLine('Type <span class="t-dim">help</span> for commands · <span class="t-dim">goto patents</span> to jump', 't-dim-line');
    }
    setTimeout(() => terminalInput?.focus(), 50);
  }

  function closeTerminal() {
    terminalWrap?.classList.remove('open');
    terminalWrap?.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }

  window.portfolioOpenTerminal = openTerminal;

  $('#terminalFab')?.addEventListener('click', openTerminal);
  $('#terminalClose')?.addEventListener('click', closeTerminal);
  terminalWrap?.addEventListener('click', (e) => {
    if (e.target === terminalWrap) closeTerminal();
  });

  terminalInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      await runCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length && historyIdx > 0) {
        historyIdx -= 1;
        terminalInput.value = cmdHistory[historyIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        historyIdx += 1;
        terminalInput.value = cmdHistory[historyIdx];
      } else {
        historyIdx = cmdHistory.length;
        terminalInput.value = '';
      }
    } else if (e.key === 'Escape') {
      closeTerminal();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const val = terminalInput.value.trim();
      const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(val));
      if (matches.length === 1) terminalInput.value = matches[0];
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '`' && !e.target.matches('input, textarea') && !$('#cmdPalette')?.classList.contains('open')) {
      e.preventDefault();
      terminalWrap?.classList.contains('open') ? closeTerminal() : openTerminal();
    }
  });

  /* ─── Click ripple on primary buttons ─── */
  $$('.btn-primary, .btn-magnetic').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
    });
  });
})();
