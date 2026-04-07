'use strict';

/* ═══════════════════════════════════════════════════════════
   KAZTRAL — script.js
   ═══════════════════════════════════════════════════════════ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── LOADER ─────────────────────────────────────────────────── */
(async function runLoader() {
  const overlay = $('#loaderOverlay');
  const bar     = $('#loaderBar');
  const pct     = $('#loaderPct');
  const status  = $('#loaderStatus');
  const llines  = $$('.lline');

  if (!overlay) { document.body.classList.add('loaded'); activateHeroBg(); return; }

  function setProgress(n) {
    if (bar) bar.style.width = `${n}%`;
    if (pct) pct.textContent = `${n}%`;
  }

  function typeText(el, text, speed) {
    speed = speed || 28;
    return new Promise(function(resolve) {
      var i = 0;
      function tick() {
        el.textContent = text.slice(0, i++);
        if (i <= text.length) setTimeout(tick, speed);
        else resolve();
      }
      tick();
    });
  }

  function decorateLine(el) {
    var s = el.dataset.style;
    var t = el.dataset.text || '';
    if (s === 'top') {
      el.innerHTML = '┌──(<span class="prompt-user">kaztral</span>㉿<span class="prompt-host">portfolio</span>)-[<span class="prompt-path">~</span>]';
    } else if (s === 'boot') {
      el.innerHTML = '└─<span class="prompt-dollar">$</span> <span class="prompt-command">boot --init</span>';
    } else if (el.classList.contains('lline--ok')) {
      el.innerHTML = '<span class="status-online">✓ ' + t + '</span>';
    } else {
      el.innerHTML = '<span class="prompt-dollar">$</span> <span class="prompt-command">' + t + '</span>';
    }
  }

  var steps = llines.length;
  setProgress(0);

  for (var i = 0; i < llines.length; i++) {
    var line = llines[i];
    await typeText(line, line.dataset.text || '', 26);
    decorateLine(line);
    setProgress(Math.round(((i + 1) / steps) * 90));
    await wait(130);
  }

  if (status) status.textContent = 'READY';
  setProgress(100);
  await wait(600);

  overlay.classList.add('hidden');
  document.body.classList.add('loaded');
  setTimeout(activateHeroBg, 700);
})();

/* ── HERO CODE BG ───────────────────────────────────────────── */
var snippets = [
  "const buildSession = await bootstrap({ env: 'prod', cache: true });",
  "if (!res.ok) throw new Error(`API ${res.status}: retrying...`);",
  "git checkout -b feat/hero-bg && git commit -m 'chore: refine hero'",
  "curl -s https://api.kaztral.dev/v1/status | jq '.uptime,.region'",
  'npm run lint && npm run test:smoke',
  '[INFO] 14:22:11 websocket connected :: user=kaztral latency=31ms',
  'docker compose up -d gateway worker redis',
  'SELECT service, health, latency_ms FROM runtime_metrics ORDER BY latency_ms ASC;',
  "fetch('/api/deploy', { method: 'POST', body: JSON.stringify(payload) });",
  '[WARN] auth.refresh token nearing expiry; rotating credentials',
  "ssh prod-node-03 'journalctl -u edge-proxy -n 25 --no-pager'",
  'const queueDepth = metrics.jobs.pending + metrics.jobs.retry;',
  'rsync -az --delete ./dist/ deploy@edge:/srv/www/kaztral/',
  'git log --oneline --decorate --graph -n 12',
  '[TRACE] request_id=8f42d route=/signal method=POST status=202',
  'pnpm dlx playwright test --project=chromium',
  'const latencyBudget = 120; // SLO guardrail',
  'bash deploy.sh --region=ap-southeast --canary=15',
  '[API] GET /v1/projects -> 200 (cache hit, 12ms)',
  'const fallback = primary ?? secondary ?? emergencyMirror;',
];

function activateHeroBg() {
  var bg  = $('#heroCodeBg');
  var pre = $('#heroCodePre');
  if (!bg || !pre) return;

  var lines = [];
  for (var i = 0; i < 100; i++) {
    var pad = ' '.repeat(Math.floor(Math.random() * 12));
    var pfx = Math.random() > 0.5 ? '$ ' : '> ';
    lines.push(pad + pfx + snippets[Math.floor(Math.random() * snippets.length)]);
  }

  pre.textContent = lines.join('\n');
  requestAnimationFrame(function() { bg.classList.add('active'); });
}

/* ── MOBILE NAV ─────────────────────────────────────────────── */
var navToggle = $('#navToggle');
var navDrawer = $('#navDrawer');

if (navToggle && navDrawer) {
  navToggle.addEventListener('click', function() {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navDrawer.classList.toggle('open', !open);
    navDrawer.setAttribute('aria-hidden', String(open));
  });

  navDrawer.addEventListener('click', function(e) {
    if (e.target.matches('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      navDrawer.classList.remove('open');
      navDrawer.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ── SCROLL PROGRESS ────────────────────────────────────────── */
var scrollBar = $('#scrollProgress');

function updateScrollBar() {
  if (!scrollBar) return;
  var total = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.width = total > 0 ? (scrollY / total * 100) + '%' : '0%';
}

window.addEventListener('scroll', updateScrollBar, { passive: true });
updateScrollBar();

/* ── ACTIVE NAV ─────────────────────────────────────────────── */
var navLinks = $$('.nav-link[data-section]');
var sections = $$('main section[id]');

function updateActiveNav() {
  var y = scrollY + 100;
  sections.forEach(function(sec) {
    if (y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(function(l) {
        l.classList.toggle('active', l.dataset.section === sec.id);
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ── SECTION REVEAL ─────────────────────────────────────────── */
var revealEls = $$('.reveal');

var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(function(el) { revealObs.observe(el); });

/* ── ABOUT TYPING ───────────────────────────────────────────── */
var aboutTerminal = $('#aboutTerminal');

function typeInto(el, text, speed) {
  speed = speed || 22;
  return new Promise(function(resolve) {
    var i = 0;
    el.classList.add('is-typing');
    function tick() {
      el.textContent = text.slice(0, i++);
      if (i <= text.length) setTimeout(tick, speed);
      else { el.classList.remove('is-typing'); resolve(); }
    }
    tick();
  });
}

async function runAboutTyping() {
  if (!aboutTerminal) return;

  var accent   = aboutTerminal.querySelector('.about-accent');
  var lines    = $$('.about-line', aboutTerminal);
  var linesBox = aboutTerminal.querySelector('.about-lines');

  if (!accent || !linesBox || !lines.length) return;

  accent.textContent = '';
  linesBox.classList.remove('is-visible');
  lines.forEach(function(l) { l.textContent = ''; });

  await typeInto(accent, accent.dataset.typeLine || '', 30);
  await wait(900);

  accent.classList.add('is-clearing');
  await wait(200);
  accent.textContent = '';
  accent.classList.remove('is-clearing');
  await wait(100);

  linesBox.classList.add('is-visible');

  for (var i = 0; i < lines.length; i++) {
    await typeInto(lines[i], lines[i].dataset.typeLine || '', 20);
    await wait(100);
  }
}

if (aboutTerminal) {
  var aboutObs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !aboutTerminal.dataset.ran) {
      aboutTerminal.dataset.ran = '1';
      runAboutTyping();
      aboutObs.disconnect();
    }
  }, { threshold: 0.3 });
  aboutObs.observe(aboutTerminal);
}

/* ── PROJECT ACCORDION ──────────────────────────────────────── */
$$('.project-row-toggle').forEach(function(btn) {
  var bodyId = btn.getAttribute('aria-controls');
  var body   = bodyId ? document.getElementById(bodyId) : null;

  btn.addEventListener('click', function() {
    var isOpen = btn.getAttribute('aria-expanded') === 'true';

    $$('.project-row-toggle[aria-expanded="true"]').forEach(function(other) {
      if (other === btn) return;
      other.setAttribute('aria-expanded', 'false');
      var otherId = other.getAttribute('aria-controls');
      if (otherId) {
        var ob = document.getElementById(otherId);
        if (ob) ob.hidden = true;
      }
    });

    btn.setAttribute('aria-expanded', String(!isOpen));
    if (body) body.hidden = isOpen;
  });
});

/* ── CAPABILITIES TABS ──────────────────────────────────────── */
var capTabs   = $$('.caps-tab');
var capPanels = $$('.caps-panel');

function activateTab(index) {
  capTabs.forEach(function(tab, i) {
    var active = i === index;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  capPanels.forEach(function(panel, i) {
    var active = i === index;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}

capTabs.forEach(function(tab, i) {
  tab.addEventListener('click', function() { activateTab(i); });

  tab.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      var next = (i + 1) % capTabs.length;
      activateTab(next);
      capTabs[next].focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      var prev = (i - 1 + capTabs.length) % capTabs.length;
      activateTab(prev);
      capTabs[prev].focus();
    }
  });
});

activateTab(0);

/* ── FOOTER YEAR ────────────────────────────────────────────── */
var yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
