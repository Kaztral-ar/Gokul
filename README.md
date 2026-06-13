# Kaztral — Developer Portfolio

A dark, terminal-themed developer portfolio site.

## Structure

```
.
├── index.html              # Main portfolio page (hero, about, projects, skills)
├── contact.html            # Contact page
├── assets/
│   ├── css/
│   │   └── style.css       # Global styles for index.html
│   └── js/
│       ├── main.js          # Loader, nav, scroll effects, tabs, accordion
│       └── github-projects.js  # Pulls repos from the GitHub API for the Projects section
└── projects/
    └── sneech.html          # Standalone landing page for the SNEECH project
```

## Notes / fixes applied

- Fixed `github-projects.js` — the GitHub API URL was malformed
  (`/kaztral-ar/${kaztral-ar}/repos`) and now correctly points to
  `https://api.github.com/users/Kaztral-ar/repos`.
- Fixed `contact.html`, which was previously a truncated/invalid HTML file
  (unclosed tags, dead Cloudflare email-obfuscation link). The 4-column
  info grid now uses the location/status styles that were already defined
  in the CSS but unused.
- Moved `style.css`, `script.js` → `main.js`, and `github-projects.js`
  into `assets/css/` and `assets/js/` and updated references in
  `index.html`.
- Linked `projects/sneech.html`'s logo back to the main portfolio.

## To do

- Replace the placeholder email (`hello@kaztral.dev`) in `contact.html`
  with a real address.
- `github-projects.js` calls the unauthenticated GitHub API
  (60 requests/hour per IP) — fine for a personal site, but consider
  caching server-side if traffic grows.
