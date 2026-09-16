# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **Jekyll static site** (a personal blog, "Silicon") built on
the `jekyll-theme-minimal` theme (defined by `jekyll-theme-minimal.gemspec` and
loaded via the `Gemfile`). There is no backend/database — the only service is the
local Jekyll dev server.

### Running the site (dev server)
Gems are installed locally into `vendor/bundle` (bundler is configured with a
local `path` in `.bundle/config`). Start the dev server with:

```
bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload
```

Then open `http://localhost:4000`. Live regeneration is enabled, so edits to
content/layouts are picked up automatically.

### Build / lint / test
- Build: `bundle exec jekyll build` (outputs to `_site/`). Sass `@import`
  deprecation warnings are expected and harmless.
- Lint: `bundle exec rubocop` runs, but note `script/cibuild` invokes it with
  `--config .rubocop.yml`, and **that config file does not exist in this repo**,
  so `script/cibuild` is not runnable as-is. The `htmlproofer` and
  `script/validate-html` steps in `cibuild` also require network access
  (w3c validators) and external assets, so they are not reliable in this
  environment.

### Non-obvious gotchas
- **Front matter is required for theme rendering.** A markdown page is only run
  through the theme layout if it starts with YAML front matter (e.g.
  `---\nlayout: default\n---`). See `another-page.md` for a working example.
  Most pages here (including `index.md`) have **no** front matter, so Jekyll
  copies them verbatim instead of converting them to HTML. Consequently, visiting
  `http://localhost:4000/` locally shows a WEBrick **directory listing**, not a
  rendered homepage. This is expected local behavior — on GitHub Pages, GitHub
  renders those `.md` files directly. To verify the theme renders correctly
  locally, open a page that has front matter, e.g.
  `http://localhost:4000/another-page.html`.
