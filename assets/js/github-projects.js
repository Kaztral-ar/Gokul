/**
 * github-projects.js
 * Auto-populates the Projects section from the GitHub API.
 * Fetches public repos for Kaztral-ar, sorted by push date.
 *
 * Strategy:
 *  1. Try sessionStorage cache to avoid hammering the API on every page load.
 *  2. Fetch from GitHub REST API (60 req/hr unauthenticated).
 *  3. Skip forked repos (forks: true) — only show original work.
 *  4. Render using the existing .project-row markup pattern.
 *  5. On error, show fallback message and log details.
 */

(function () {
  "use strict";

  /* ── Config ─────────────────────────────────────────────────────────── */
  const GITHUB_USER   = "Kaztral-ar";
  const API_URL       = `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=30`;
  const CACHE_KEY     = "kz_gh_repos";
  const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

  /* ── GitHub SVG icon (reused per card) ──────────────────────────────── */
  const GH_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.3.8-.6v-2.3c-3.3.8-4-1.5-4-1.5-.6-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8
    1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.6-1.4-5.6-6.2
    0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6.1 0c2.4-1.5
    3.4-1.2 3.4-1.2.7 1.7.3 3 .1 3.3.8.9 1.2 2 1.2 3.4 0 4.8-2.9 5.9-5.6 6.2.4.4.8 1.1.8
    2.3v3.3c0 .4.2.8.8.6A12 12 0 0 0 12 .5"/>
  </svg>`;

  /* ── Language → tag map (extend as needed) ──────────────────────────── */
  const LANG_TAGS = {
    JavaScript : ["JS", "Node.js"],
    TypeScript : ["TS", "Node.js"],
    Python     : ["Python"],
    Shell      : ["Bash", "Linux"],
    HTML       : ["HTML", "CSS"],
    CSS        : ["CSS"],
    default    : [],
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  /**
   * Derive display tags from a repo's language + topic list.
   * GitHub Topics API requires a separate call; we use language only here
   * to avoid extra requests. Topics can be added via repo settings on GitHub.
   */
  function tagsForRepo(repo) {
    const langTags = LANG_TAGS[repo.language] || LANG_TAGS.default;
    // GitHub topics are available when you set them on the repo.
    const topicTags = (repo.topics || []).map(t =>
      t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    );
    // Merge, deduplicate, cap at 4
    return [...new Set([...langTags, ...topicTags])].slice(0, 4);
  }

  /** Format ISO date → "MMM YYYY" e.g. "Jun 2025" */
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  /** Build star/fork metadata string shown in tagline */
  function metaLine(repo) {
    const parts = [];
    if (repo.stargazers_count > 0) parts.push(`★ ${repo.stargazers_count}`);
    if (repo.forks_count > 0)      parts.push(`⑂ ${repo.forks_count}`);
    parts.push(`Updated ${fmtDate(repo.pushed_at)}`);
    return parts.join("  ·  ");
  }

  /* ── DOM builder ────────────────────────────────────────────────────── */

  /**
   * Build a single project-row <article> matching the existing markup pattern.
   * @param {Object} repo  — GitHub repo object
   * @param {number} idx   — 1-based display index
   */
  function buildProjectRow(repo, idx) {
    const num      = String(idx).padStart(2, "0");
    const bodyId   = `proj-gh-${repo.id}-body`;
    const tags     = tagsForRepo(repo);
    const desc     = repo.description || "No description provided.";
    const homepage = repo.homepage
      ? `<a class="btn btn-sm btn-ghost" href="${repo.homepage}" target="_blank" rel="noopener">Live Demo ↗</a>`
      : "";

    // Tag chips HTML
    const tagHtml = tags.map(t => `<span class="tag">${t}</span>`).join("");

    const article = document.createElement("article");
    article.className   = "project-row";
    article.setAttribute("role", "listitem");
    article.setAttribute("data-index", num);

    article.innerHTML = `
      <button class="project-row-toggle" aria-expanded="false" aria-controls="${bodyId}">
        <span class="proj-num">${num}</span>
        <div class="proj-main">
          <h3 class="proj-title">${escHtml(repo.name)}</h3>
          <p class="proj-tagline">${escHtml(metaLine(repo))}</p>
        </div>
        <div class="proj-tags">${tagHtml}</div>
        <span class="proj-arrow">↓</span>
      </button>
      <div class="project-row-body" id="${bodyId}" hidden>
        <p class="proj-description">${escHtml(desc)}</p>
        <div class="proj-actions">
          <a class="btn btn-sm" href="${repo.html_url}" target="_blank" rel="noopener">
            ${GH_ICON} GitHub
          </a>
          ${homepage}
        </div>
      </div>
    `;

    /* Accordion toggle — mirrors whatever script.js does for static rows */
    const toggle = article.querySelector(".project-row-toggle");
    const body   = article.querySelector(".project-row-body");

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      body.hidden = open;
      // Rotate arrow
      const arrow = toggle.querySelector(".proj-arrow");
      if (arrow) arrow.style.transform = open ? "" : "rotate(180deg)";
    });

    return article;
  }

  /** Minimal HTML escape to prevent XSS from repo metadata */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  function render(repos) {
    const list  = document.getElementById("projectList");
    const count = document.getElementById("projectCount");
    if (!list) return;

    // Filter out forks; keep only owned repos with at least a name
    const owned = repos.filter(r => !r.fork && r.name);

    // Clear skeletons
    list.innerHTML = "";
    list.setAttribute("aria-busy", "false");

    if (owned.length === 0) {
      showError();
      return;
    }

    owned.forEach((repo, i) => {
      list.appendChild(buildProjectRow(repo, i + 1));
    });

    if (count) {
      count.textContent = `${String(owned.length).padStart(2, "0")} works`;
    }
  }

  function showError() {
    const list  = document.getElementById("projectList");
    const error = document.getElementById("projectError");
    const count = document.getElementById("projectCount");
    if (list)  { list.innerHTML = ""; list.setAttribute("aria-busy", "false"); }
    if (error) error.hidden = false;
    if (count) count.textContent = "-- works";
  }

  /* ── Cache helpers ───────────────────────────────────────────────────── */

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return data;
    } catch { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full or private mode — non-fatal */ }
  }

  /* ── Fetch ───────────────────────────────────────────────────────────── */

  async function loadRepos() {
    // 1. Serve from cache if fresh
    const cached = readCache();
    if (cached) { render(cached); return; }

    // 2. Fetch from GitHub
    try {
      const res = await fetch(API_URL, {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!res.ok) {
        // 403 = rate limited; 404 = user not found
        console.warn(`[github-projects] API error ${res.status}`);
        showError();
        return;
      }

      const repos = await res.json();
      writeCache(repos);
      render(repos);
    } catch (err) {
      // Network failure, CSP block, etc.
      console.error("[github-projects] fetch failed:", err);
      showError();
    }
  }

  /* ── Init ───────────────────────────────────────────────────────────── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadRepos);
  } else {
    loadRepos();
  }
})();
