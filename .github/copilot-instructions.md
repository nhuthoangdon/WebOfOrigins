<!-- COPILOT INSTRUCTIONS: concise, actionable guidance for AI coding agents -->
# Web of Origins — Copilot instructions

Purpose: give an AI coding agent the minimal, actionable context needed to be productive in this repository.

- Big picture
  - This is a static Jekyll site (GitHub Pages) that visualises a graph database.
  - Presentation layer: `_layouts/`, `_includes/`, `assets/`, `src/` (JS fragments). Content is authored in `_posts/` and `pages/`.
  - Data layer: CSV files live in `data/` (and the live site fetches data from https://data.weboforigins.com). The visualisation uses `vis-network` and `Papa.parse` to load CSVs.

- Build & run (developer workflow)
  - Install Ruby gems with `bundle install` (Windows: `wdm` gem present for file watching).
  - Local dev: `bundle exec jekyll serve --livereload` (serves at http://127.0.0.1:4000). Use `--incremental` for faster rebuilds when needed.
  - CI / GitHub Pages: site relies on the `github-pages` gem declared in `Gemfile`.

- Project-specific conventions and gotchas
  - Header & footer are loaded at runtime from `/src/header.html` and `/src/footer.html` via `src/script.js` (see `loadFragments()`). Edit `src/header.html` (not `_includes/header.html`) when changing the site chrome.
  - Asset versioning: CSS/JS references include a query string like `?v1.0` in `_includes/head.html`. Update those tags when bumping asset cache versions.
  - CSV delimiter: data CSVs use `;` as the delimiter (see `src/vis-script.js` and `src/script.js` Papa.parse calls). Preserve the delimiter when editing or producing CSVs.
  - Data endpoints: production visualisations load `https://data.weboforigins.com/nodes.csv` and `edges.csv`. For local testing, point `src/vis-script.js` to `/data/nodes.csv` and `/data/edges.csv` (or proxy the domain).
  - Posts default to `layout: post` via `_config.yml` defaults — don't need front-matter layout on each post unless overriding.

- Integration points and external dependencies
  - vis-network: loaded from CDN in `_includes/head.html` and used in `src/vis-script.js`.
  - Papa Parse: used to parse CSVs in-browser (see `src/vis-script.js` and `src/script.js`).
  - jQuery is included (slim) in `_layouts/default.html` but most DOM logic is vanilla JS.

- Patterns and examples (concrete)
  - Make listing card clickable: `makeListingsClickable()` in `src/script.js` — list items are made keyboard-accessible and navigate to the data-url when Enter/Space pressed.
  - Mobile CTA pattern: header mobile CTA is created once in `initHeader()` (`createMobileCTA()`), appended into `.menu-items` on mobile. Search for `createMobileCTA` to adapt behaviour.
  - Visualisation CSV parsing: `fetchAndParse(..., delimiter: ";")` and then `Papa.parse(..., { header: true })` — maintain `header: true` and semicolon delimiter.

- Files to read first (quick map)
  - Configuration: `_config.yml` ([`_config.yml`](../_config.yml))
  - Build: `Gemfile` ([`Gemfile`](../Gemfile))
  - Layout: `_layouts/default.html` (layout + script includes) ([`_layouts/default.html`](../_layouts/default.html))
  - Header/footer fragments: `src/header.html`, `src/footer.html` ([`src/header.html`](../src/header.html))
  - Main JS: `src/script.js` (site-wide behaviour) ([`src/script.js`](../src/script.js))
  - Vis JS: `src/vis-script.js` (graph loading + rendering) ([`src/vis-script.js`](../src/vis-script.js))
  - Data: `data/nodes.csv` and `data/edges.csv` ([`data/nodes.csv`](../data/nodes.csv))

- Quick tasks examples (how to change things)
  - To change the header HTML used across pages: edit `src/header.html`, then run `bundle exec jekyll serve` and refresh.
  - To test graph changes locally if remote CSVs are unavailable: modify `src/vis-script.js` temporarily to point to `/data/nodes.csv` and `/data/edges.csv`.
  - When adding CSS, prefer `assets/main.scss`/_sass partials; build will produce `assets/main.css`.

If any of these references are incomplete or you'd like more examples (small PRs, test commands, or how to run a minimal node-based static server for preview), tell me which section to expand. 
