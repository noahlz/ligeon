# Site

Static landing page built with [Eleventy](https://www.11ty.dev/), deployed to GitHub Pages.

## Paths

- CI/CD workflow: `../.github/workflows/site-ci.yml`
- Run git commands from the repo root (`cd ..`), not from `site/`.

## OG Image

`_site/og-image.png` is CI-generated and not committed. To preview locally (from repo root):

```sh
node site/scripts/generate-og-image.js
```

Requires `_site/ligeon-screen.png` — run `cd site && npx @11ty/eleventy` first.
