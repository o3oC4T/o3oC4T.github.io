# Portfolio reference draft

Live preview: https://o3oc4t.github.io/

The current draft uses the browser-delivered files from [Mridul Narnaulia's
portfolio](https://mridul.design/), the reference selected by the repository
owner. The original 3D archive, hover animations, project pages, résumé,
contact sheet, typography, and mobile interface are preserved for review.

The original name, projects, résumé, and contact information are reference
content, not the repository owner's identity or experience. See [CREDITS.md](CREDITS.md).
Search indexing is disabled for this draft.

## Preview locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory docs
```

Open http://127.0.0.1:4173/. The server must serve `docs/` as its root because
the original bundles reference absolute asset paths.

## Layout

- `docs/index.html`: static application entry, prepared for GitHub Pages.
- `docs/_next/static/`: original browser JavaScript and CSS bundles.
- `docs/fonts/`: locally served fonts.
- `docs/media/`: downloaded project images, previews, and videos.
- `docs/lottie/`: local animation runtime.
- `docs/.nojekyll`: makes GitHub Pages serve the `_next` asset directory.
- `scripts/download-reference.mjs`: downloads the public asset dependency graph.
- `scripts/prepare-pages.mjs`: removes host-specific Cloudflare injection and sets noindex.

GitHub Pages serves the `main` branch's `/docs` folder. No application server
or build step is needed. SoundCloud streaming still requires an external
connection. Download reports and inspection captures are kept in the ignored
`reference/` folder. The prior custom design is preserved in Git history.
