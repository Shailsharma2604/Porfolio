(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const TYPE_ICONS = {
    work: '◈',
    cert: '◆',
    patent: '🏅',
    award: '★',
    edu: '◎',
  };

  /** Embedded fallback — sections stay filled when fetch fails (file://, offline, CDN miss). */
  const FALLBACK_SITE_CONFIG = {
    availability: {
      enabled: true,
      badge: 'Open to opportunities',
      roles: ['Full-time', 'Collaborations'],
      startDate: 'May 2026 or earlier',
      location: 'Delhi NCR · Remote / hybrid OK',
    },
    nowFocus: 'Associate Data Engineer @ R Systems',
    latestUpdate: 'Building production lakehouse pipelines on Databricks & Unity Catalog',
    stats: [
      { value: '2+', label: 'Years experience', icon: '◈' },
      { value: '3', label: 'Patents granted', icon: '🏅', liveKey: 'patentGranted' },
      { value: '51+', label: 'Projects shipped', icon: '▣', liveKey: 'repoCount' },
      { value: '1', label: 'Certifications', icon: '◆' },
      { value: '6', label: 'Total IP filings', icon: '⚡', liveKey: 'patentTotal' },
    ],
    experience: [
      {
        date: 'Oct 2025 — Present',
        title: 'Associate Data Engineer',
        company: 'R Systems International',
        badge: 'Current',
        badgeClass: 'exp-live',
        featured: true,
        description:
          'Data pipelines, analytics platforms, and scalable ETL with Databricks, Snowflake, and Unity Catalog.',
        bullets: [
          'Building production lakehouse pipelines, GenAI upskilling, and scalable analytics for enterprise clients',
          'Delta Live Tables, Unity Catalog governance, and Snowflake integration patterns',
        ],
        tags: ['Databricks', 'Spark', 'ETL', 'Snowflake'],
      },
      {
        date: '2023 — 2024',
        title: 'UI/UX & Digital Marketing Intern',
        company: 'Conceptou · Accerovic',
        badge: 'Internship',
        description: 'Brand visibility, user engagement, and product design across digital channels.',
        bullets: [
          'Led UI/UX design workflows, content strategy, and digital campaigns',
          'Improved brand reach and user engagement across client channels',
        ],
        tags: ['UI/UX', 'Marketing', 'Figma'],
      },
      {
        date: '2022 — Present',
        title: 'Co-Inventor & Patent Research',
        company: 'Chitkara University · CURIN',
        badge: 'Innovation',
        description: 'Co-inventor on granted patents and filed applications through university research programs.',
        bullets: [
          '3 granted patents — assistive headgear, integrated phone case, multifunctional cooling pad',
          '6 total IP filings · CURIN patents registry · co-inventor workflows',
        ],
        tags: ['Patents', 'R&D', 'Assistive Tech'],
      },
      {
        date: '2023',
        title: 'Smart India Hackathon — Vizieye',
        company: 'Team Lead · Data Visualization',
        badge: 'Hackathon',
        description: 'Hackathon-winning data visualization platform built for Smart India Hackathon & H.T.M. 5.0.',
        bullets: [
          'Built Vizieye for speed, clarity, and team collaboration under competition pressure',
          'Python data viz stack · pitched and demoed to national jury panels',
        ],
        tags: ['Python', 'Data Viz', 'Hackathon'],
      },
      {
        date: '2022 — 2026',
        title: 'B.E. CSE (Artificial Intelligence)',
        company: 'Chitkara University · Final Year',
        badge: 'Education',
        description:
          'Final-year undergraduate in CSE (AI) — Python, Java, C++, AI/ML, hackathons, and open-source work.',
        bullets: [
          'Smart India Hackathon · H.T.M. 5.0 · 3 granted patents · CURIN research',
          'Graduating May 2026 · AI/ML coursework and production-minded capstone work',
        ],
        tags: ['AI/ML', 'Python', 'Research'],
      },
    ],
    milestones: [
      {
        date: 'Oct 2025',
        title: 'Associate Data Engineer',
        subtitle: 'R Systems International',
        type: 'work',
      },
      {
        date: '2026',
        title: 'Databricks Certified',
        subtitle: 'Data Engineer Associate',
        type: 'cert',
      },
      {
        date: '2024',
        title: '3 Patents Granted',
        subtitle: 'Assistive headgear · phone case · cooling pad',
        type: 'patent',
      },
      {
        date: '2023',
        title: 'Smart India Hackathon',
        subtitle: 'Vizieye — data visualization platform',
        type: 'award',
      },
      {
        date: '2022',
        title: 'B.E. CSE (AI)',
        subtitle: 'Chitkara University · Final year',
        type: 'edu',
      },
    ],
    learning: [
      {
        topic: 'Delta Live Tables & Lakeflow',
        context: 'Production lakehouse pipelines @ R Systems',
        progress: 75,
      },
      {
        topic: 'Multi-Agent LLM Systems',
        context: 'POC Planning Agent — 6-agent RAG pipeline',
        progress: 65,
      },
      {
        topic: 'Snowflake + Unity Catalog',
        context: 'Enterprise data governance patterns',
        progress: 70,
      },
      {
        topic: 'GenAI for Data Engineering',
        context: 'Databricks upskilling & automation',
        progress: 55,
      },
    ],
    faq: [
      {
        q: 'Are you open to full-time roles?',
        a: 'Yes — actively exploring full-time Data Engineer, ML Engineer, and AI Developer roles. Graduating May 2026; available for the right opportunity earlier.',
      },
      {
        q: 'What about contract or freelance work?',
        a: 'Open to project-based collaborations and contract work in data engineering, AI/ML, and full-stack development.',
      },
      {
        q: 'Work authorization & location?',
        a: 'Authorized to work in India. Based in Delhi NCR. Open to relocation within India and remote or hybrid arrangements.',
      },
      {
        q: 'Preferred start date?',
        a: 'Flexible — May 2026 (post-graduation) or earlier for the right full-time role. Immediate for contract projects.',
      },
      {
        q: 'What roles are you targeting?',
        a: 'Associate / Junior Data Engineer, ML Engineer, AI Developer, and analytics engineering roles. Strong fit for lakehouse, Spark, and LLM/RAG work.',
      },
      {
        q: 'How can I reach you quickly?',
        a: 'Email shail020604@gmail.com, call +91 82888 51361, or message on LinkedIn. I typically respond within 24–48 hours.',
      },
    ],
    resume: {
      path: 'assets/resume.pdf',
      filename: 'Shail_Sharma_Resume.pdf',
      lastUpdated: 'Jul 2026',
    },
    resumeSummary: {
      role: 'Associate Data Engineer · R Systems International',
      education: 'B.E. Computer Science (AI) · Chitkara University · May 2026',
      highlights: [
        '3 granted patents — assistive tech, consumer devices & wearables · 6 total IP filings',
        'Databricks Certified Data Engineer Associate (2026)',
        'Production lakehouse pipelines · Spark · Unity Catalog · Snowflake',
        'GitHub @Shailsharma2604 · Python · AI/ML · ETL',
      ],
      skills: 'Data Engineering · Databricks · Python · Apache Spark · AI/ML · SQL',
    },
    aboutContact: {
      role: 'Associate Data Engineer',
      company: 'R Systems International',
      education: 'B.E. CSE (AI) · Final Year',
      location: 'Delhi NCR',
      phone: '+91 82888 51361',
      email: 'shail020604@gmail.com',
      linkedin: 'https://www.linkedin.com/in/shail2604',
      linkedinHandle: 'in/shail2604',
    },
    certification: {
      name: 'Databricks Certified Data Engineer Associate',
      year: '2026',
      verifyUrl: 'https://credentials.databricks.com/26a22197-b2ed-4002-80a2-dae3b4abb0d8',
      directoryUrl: 'https://directory.databrickscertified.com/profile/701279c0-04e0-4025-8ac4-6a8fea31f2d1',
    },
    siteUrl: 'https://shailsharma2604.vercel.app',
  };

  async function loadSiteConfig() {
    try {
      const res = await fetch('config/site.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote = await res.json();
      return { ...FALLBACK_SITE_CONFIG, ...remote };
    } catch (err) {
      console.warn('[site-content] Using embedded fallback config:', err?.message || err);
      return FALLBACK_SITE_CONFIG;
    }
  }

  function activateDynamic(el) {
    if (!el) return;
    el.classList.add('visible');
    el.closest('.reveal, .stats-snapshot-section, .section')?.classList.add('visible');
    window.portfolioActivateDynamic?.(el);
  }

  function applyAvailability(cfg) {
    if (!cfg?.availability) return;
    const { availability, nowFocus, latestUpdate } = cfg;

    const focusEl = $('#nowFocus');
    if (focusEl && nowFocus) focusEl.textContent = nowFocus;

    const openEl = $('.now-open');
    if (openEl && availability.badge) openEl.textContent = availability.badge;

    const heroEyebrow = $('.hero-eyebrow');
    if (heroEyebrow && availability.enabled) {
      const roles = availability.roles?.join(' · ') || '';
      const parts = [availability.badge, roles].filter(Boolean);
      const textNode = heroEyebrow.childNodes[heroEyebrow.childNodes.length - 1];
      if (textNode?.nodeType === Node.TEXT_NODE) {
        textNode.textContent = ` ${parts.join(' · ')}`;
      }
    }

    if (latestUpdate) {
      const statusEl = $('#liveStatusText');
      if (statusEl) statusEl.textContent = latestUpdate;
    }
  }

  function renderStats(cfg) {
    const grid = $('#statsSnapshot');
    if (!grid || !cfg?.stats?.length) return;

    grid.innerHTML = cfg.stats
      .map(
        (s) => `
      <article class="stat-snap-card glass-card" ${s.liveKey ? `data-live-key="${s.liveKey}"` : ''}>
        <span class="stat-snap-icon" aria-hidden="true">${s.icon || '◆'}</span>
        <span class="stat-snap-value" ${s.liveKey ? `id="statLive_${s.liveKey}"` : ''}>${s.value}</span>
        <span class="stat-snap-label">${s.label}</span>
      </article>`
      )
      .join('');

    activateDynamic(grid);
    $('#statsSnapshotSection')?.classList.add('visible');
  }

  function renderExperience(cfg) {
    const grid = $('#expGrid');
    if (!grid || !cfg?.experience?.length) return;

    grid.innerHTML = cfg.experience
      .map((exp) => {
        const featured = exp.featured ? ' exp-featured' : '';
        const badgeClass = exp.badgeClass ? ` ${exp.badgeClass}` : '';
        const tags = (exp.tags || []).map((t) => `<span>${t}</span>`).join('');
        const bullets = (exp.bullets || [])
          .map((b) => `<li>${b}</li>`)
          .join('');
        const bulletsHtml = bullets ? `<ul class="exp-bullets">${bullets}</ul>` : '';

        return `
      <article class="surface-card exp-card${featured}">
        <div class="exp-node" aria-hidden="true"></div>
        <div class="exp-top">
          <span class="exp-badge${badgeClass}">${exp.badge || ''}</span>
          <span class="exp-date">${exp.date}</span>
        </div>
        <h3>${exp.title}</h3>
        <p class="exp-org">${exp.company}</p>
        <p class="exp-desc">${exp.description || ''}</p>
        ${bulletsHtml}
        ${tags ? `<div class="exp-tags">${tags}</div>` : ''}
      </article>`;
      })
      .join('');

    activateDynamic(grid);
  }

  function renderMilestones(cfg) {
    const track = $('#milestonesTrack');
    if (!track || !cfg?.milestones?.length) return;

    track.innerHTML = cfg.milestones
      .map(
        (m, i) => `
      <article class="milestone-card glass-card" data-type="${m.type || 'work'}" style="--ms-i:${i}">
        <div class="milestone-marker" aria-hidden="true">
          <span class="milestone-dot">${TYPE_ICONS[m.type] || '◆'}</span>
        </div>
        <time class="milestone-date">${m.date}</time>
        <h3 class="milestone-title">${m.title}</h3>
        <p class="milestone-sub">${m.subtitle || ''}</p>
      </article>`
      )
      .join('');

    activateDynamic(track);
  }

  function renderLearning(cfg) {
    const list = $('#learningList');
    if (!list || !cfg?.learning?.length) return;

    list.innerHTML = cfg.learning
      .map(
        (item, i) => `
      <article class="learning-card glass-card" style="--ms-i:${i}">
        <div class="learning-head">
          <h3>${item.topic}</h3>
          <span class="learning-pct">${item.progress}%</span>
        </div>
        <p class="learning-context">${item.context || ''}</p>
        <div class="learning-track" role="progressbar" aria-valuenow="${item.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${item.topic} progress">
          <div class="learning-fill" style="--progress:${item.progress}%"></div>
        </div>
      </article>`
      )
      .join('');

    activateDynamic(list);
  }

  function renderFaq(cfg) {
    const list = $('#faqList');
    if (!list || !cfg?.faq?.length) return;

    list.innerHTML = cfg.faq
      .map(
        (item, i) => `
      <details class="faq-item glass-card" ${i === 0 ? 'open' : ''}>
        <summary class="faq-q">${item.q}</summary>
        <p class="faq-a">${item.a}</p>
      </details>`
      )
      .join('');

    activateDynamic(list);
  }

  async function pdfExists(path) {
    try {
      const res = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
      const type = res.headers.get('content-type') || '';
      return res.ok && (type.includes('pdf') || path.endsWith('.pdf'));
    } catch {
      return false;
    }
  }

  function renderResumeSummaryHtml(summary, compact = false) {
    const s = summary || FALLBACK_SITE_CONFIG.resumeSummary;
    const highlights = (s.highlights || [])
      .map((h) => `<li>${h}</li>`)
      .join('');

    return `
      <div class="resume-preview-summary${compact ? ' resume-preview-summary--compact' : ''}">
        <p class="resume-summary-role">${s.role}</p>
        <p class="resume-summary-edu">${s.education}</p>
        <ul class="resume-summary-highlights">${highlights}</ul>
        <p class="resume-summary-skills"><span class="resume-summary-label">Core stack</span> ${s.skills}</p>
      </div>`;
  }

  function renderAboutSection(cfg) {
    const contact = { ...FALLBACK_SITE_CONFIG.aboutContact, ...cfg?.aboutContact };
    const cert = { ...FALLBACK_SITE_CONFIG.certification, ...cfg?.certification };

    const roleEl = $('#aboutContactRole');
    const companyEl = $('#aboutContactCompany');
    const educationEl = $('#aboutContactEducation');
    const locationEl = $('#aboutContactLocation');
    const phoneEl = $('#aboutContactPhone');
    const emailEl = $('#aboutContactEmail');
    const linkedInEl = $('#aboutContactLinkedIn');
    const certEl = $('#aboutCertName');

    if (roleEl) roleEl.textContent = contact.role;
    if (companyEl) companyEl.textContent = contact.company;
    if (educationEl) educationEl.textContent = contact.education;
    if (locationEl) locationEl.textContent = contact.location;
    if (phoneEl) {
      phoneEl.innerHTML = `<a href="tel:${contact.phone.replace(/\s/g, '')}">${contact.phone}</a>`;
    }
    if (emailEl) {
      emailEl.innerHTML = `<a href="mailto:${contact.email}">${contact.email}</a>`;
    }
    if (linkedInEl && contact.linkedin) {
      const handle = contact.linkedinHandle || contact.linkedin;
      linkedInEl.innerHTML = `<a href="${contact.linkedin}" target="_blank" rel="noopener">${handle} ↗</a>`;
    }
    if (certEl) certEl.textContent = cert.name;
    const certBadge = $('.about-tile-cert .about-tile-badge');
    if (certBadge && cert.year) certBadge.textContent = `Certified · ${cert.year}`;
    const certVerify = $('#aboutCertVerify');
    if (certVerify && cert.verifyUrl) {
      certVerify.href = cert.verifyUrl;
    }
    const certVerifyLink = $('#certVerifyLink');
    if (certVerifyLink && cert.verifyUrl) certVerifyLink.href = cert.verifyUrl;
    const certDirectoryLink = $('#certDirectoryLink');
    if (certDirectoryLink && cert.directoryUrl) certDirectoryLink.href = cert.directoryUrl;
  }

  function wireResumeLinks(hasPdf, path, filename) {
    const selectors = [
      '.hero-actions a[data-resume-link]',
      '#contactResumeLink',
      '.footer-resume-link',
    ];
    selectors.forEach((sel) => {
      const link = document.querySelector(sel);
      if (!link) return;
      if (hasPdf) {
        link.href = path;
        link.setAttribute('download', filename);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      } else {
        link.href = '#about';
        link.removeAttribute('download');
        link.removeAttribute('target');
      }
    });

    const heroLink = document.querySelector('.hero-actions a[data-resume-link]');
    if (heroLink) heroLink.textContent = hasPdf ? 'Download resume' : 'View resume summary';

    const contactLink = $('#contactResumeLink');
    if (contactLink) contactLink.textContent = hasPdf ? 'Download resume' : 'View resume summary';
  }

  async function renderResumePreview(cfg) {
    const wrap = $('#resumePreview');
    if (!wrap || !cfg?.resume) return;

    const { path, filename, lastUpdated } = cfg.resume;
    const summary = cfg.resumeSummary || FALLBACK_SITE_CONFIG.resumeSummary;
    const hasPdf = await pdfExists(path);
    const slimLayout = wrap.classList.contains('about-tile-resume');
    wireResumeLinks(hasPdf, path, filename);

    const previewBlock = hasPdf
      ? `<div class="resume-preview-frame-wrap">
          <object class="resume-preview-frame" data="${path}#toolbar=0&navpanes=0" type="application/pdf" aria-label="Resume preview">
            ${renderResumeSummaryHtml(summary, slimLayout)}
          </object>
        </div>`
      : renderResumeSummaryHtml(summary, slimLayout);

    wrap.innerHTML = `
      <div class="resume-preview-head">
        <span class="resume-preview-icon" aria-hidden="true">📄</span>
        <div>
          <h3>Resume</h3>
          <p class="resume-preview-meta">Updated ${lastUpdated || 'recently'}${hasPdf ? '' : ' · summary preview'}</p>
        </div>
      </div>
      ${previewBlock}
      <div class="resume-preview-actions">
        <a href="${hasPdf ? path : '#about'}" class="btn btn-primary btn-sm" ${hasPdf ? `target="_blank" rel="noopener" download="${filename}"` : ''}>${hasPdf ? 'Download resume ↓' : 'Summary below'}</a>
        <a href="${hasPdf ? path : '#about'}" class="btn btn-glass btn-sm" ${hasPdf ? 'target="_blank" rel="noopener"' : ''}>${hasPdf ? 'View full PDF ↗' : 'Scroll up'}</a>
        <a href="https://github.com/Shailsharma2604" class="btn btn-glass btn-sm" target="_blank" rel="noopener">GitHub ↗</a>
      </div>`;

    activateDynamic(wrap);
  }

  function bindLiveStats() {
    window.portfolioUpdateSiteStats = (data) => {
      if (!data) return;
      const map = {
        patentGranted: data.grantedCount,
        repoCount: data.repoCount != null ? `${data.repoCount}+` : null,
        patentTotal: data.totalCount ?? data.count,
      };
      Object.entries(map).forEach(([key, val]) => {
        if (val == null) return;
        const el = $(`#statLive_${key}`);
        if (el) el.textContent = val;
      });
    };
  }

  async function init() {
    const cfg = await loadSiteConfig();

    applyAvailability(cfg);
    renderAboutSection(cfg);
    renderStats(cfg);
    renderExperience(cfg);
    renderMilestones(cfg);
    renderLearning(cfg);
    renderFaq(cfg);
    await renderResumePreview(cfg);
    bindLiveStats();

    window.portfolioSiteConfig = cfg;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
