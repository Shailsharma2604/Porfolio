(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const toast = (msg, type) => window.portfolioToast?.(msg, type);

  /* ─── Terminal (hidden from UI) ─── */
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
  <span class="t-cmd">projects</span>   featured builds
  <span class="t-cmd">contact</span>    email & phone
  <span class="t-cmd">resume</span>     download PDF resume
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
        return '3 granted · 3 filed · 6 total (offline estimate)';
      }
    },
    experience() {
      const items = window.portfolioSiteConfig?.experience;
      if (items?.length) {
        return items
          .map((exp) => `${exp.date.padEnd(22)} ${exp.title} @ ${exp.company.split(' · ')[0]}`)
          .join('\n');
      }
      return `Oct 2025 — Present   Associate Data Engineer @ R Systems
2023 — 2024            UI/UX Intern @ Conceptou · Accerovic
2022 — Present         Co-Inventor @ Chitkara · CURIN
2023                   Smart India Hackathon — Vizieye
2022 — 2026            B.E. CSE (AI) @ Chitkara University`;
    },
    projects() {
      return `Vizieye — Smart India Hackathon data viz platform
POC Planning Agent — 6-agent LLM RAG pipeline
TrendPredict — ML market trend dashboard
Paper Vision AR — augmented reality web + CV
Type goto projects to scroll the gallery`;
    },
    contact() {
      return `Email: shail020604@gmail.com
Phone: +91 82888 51361
LinkedIn: in/shail2604`;
    },
    resume() {
      const cfg = window.portfolioSiteConfig?.resume;
      const path = cfg?.path || 'assets/resume.pdf';
      const filename = cfg?.filename || 'Shail_Sharma_Resume.pdf';
      const a = document.createElement('a');
      a.href = path;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return `Downloading ${filename}…`;
    },
    social() {
      return `GitHub    github.com/Shailsharma2604
LinkedIn  www.linkedin.com/in/shail2604
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
      window.portfolioSmoothScroll?.(el) ?? el.scrollIntoView({ behavior: 'smooth' });
      return `Navigating to #${id}…`;
    },
    clear() {
      terminalBody.innerHTML = '';
      return null;
    },
    stats() {
      return `Theme: ${document.documentElement.dataset.accent || 'violet'} · ${document.documentElement.dataset.mode || 'dark'}`;
    },
    sudo(args) {
      if (args.join(' ') === 'hire me') {
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

  /* ─── Click ripple on buttons ─── */
  $$('.btn-primary, .btn-glass, .btn-linkedin, .nav-cta, .contact-email, .contact-phone, .contact-linkedin').forEach((btn) => {
    if (btn.style.position !== 'relative') {
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
    }
    btn.addEventListener('click', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  /* ─── Quick contact FAB ─── */
  const contactFabToggle = $('#contactFabToggle');
  const contactFabMenu = $('#contactFabMenu');

  function closeContactFab() {
    contactFabToggle?.setAttribute('aria-expanded', 'false');
    contactFabMenu?.setAttribute('hidden', '');
  }

  contactFabToggle?.addEventListener('click', () => {
    const open = contactFabToggle.getAttribute('aria-expanded') === 'true';
    contactFabToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    if (open) contactFabMenu?.setAttribute('hidden', '');
    else contactFabMenu?.removeAttribute('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#contactFabWrap')) closeContactFab();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactFab();
  });

  $('#sharePortfolioFab')?.addEventListener('click', () => {
    closeContactFab();
    window.portfolioShare?.(false);
  });

  $('#sharePortfolioHero')?.addEventListener('click', () => {
    window.portfolioShare?.(false);
  });

  $('#downloadVcardFab')?.addEventListener('click', () => {
    closeContactFab();
    window.portfolioDownloadVCard?.();
  });

  $('#downloadVcardBtn')?.addEventListener('click', () => {
    window.portfolioDownloadVCard?.();
  });
})();
