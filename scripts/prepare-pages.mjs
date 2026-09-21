import { readFile, writeFile } from 'node:fs/promises';

const filename = 'docs/index.html';
let html = await readFile(filename, 'utf8');
// Cloudflare's per-origin challenge is injected by the original hosting service.
// It is not part of the portfolio and must not be replayed on GitHub Pages.
html = html.replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?<\/script>/g, '');
if (!html.includes('name="robots"')) {
  html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"/></head>');
}
await writeFile(filename, html);
console.log('Prepared static HTML for GitHub Pages.');
