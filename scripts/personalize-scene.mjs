// One-time, mechanical adaptation of the downloaded reference renderer.
// Camera, geometry, materials, lighting and animation logic are unchanged.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { icons } from '../docs/content.js';

const snapshot = resolve(process.argv[2] || 'reference/retired-2026-09-21');
const source = `${snapshot}/_next/static/chunks/project-box-scene-D1H5MAgS.js`;
const target = new URL('../docs/assets/', import.meta.url);
await mkdir(target, { recursive: true });
let scene = await readFile(source, 'utf8');
const replaceOnce = (from, to) => {
  if (scene.split(from).length !== 2) throw new Error(`Unexpected source: ${from}`);
  scene = scene.replace(from, to);
};
replaceOnce('function rd(e,t,n,r,i)', `Object.assign(nd,${JSON.stringify(icons)});function rd(e,t,n,r,i)`);
replaceOnce('M R I D U L   N A R N A U L I A       /       S E L E C T E D   W O R K', 'Y E O N G   C H O I       /       D F I R   ·   A I');
replaceOnce('Oe=_e.findIndex(e=>e.id===`hive`)', 'Oe=_e.findIndex(e=>e.accent===`rainbow`)');
await writeFile(new URL('archive-scene.js', target), scene);
await copyFile(`${snapshot}/_next/static/chunks/project-texture-data-ys3L3FN8.js`, new URL('textures.js', target));
const layout = (await readFile(`${snapshot}/_next/static/css/page.DNC6xVsA.css`, 'utf8')).replace(/url\(\/logos\/[^)]+\)/g, 'none');
const mobile = (await readFile(`${snapshot}/_next/static/css/mobile-archive.7Rfd9lcf.css`, 'utf8')).replace(/@font-face\{[^}]*\}/g, '');
await writeFile(new URL('reference-layout.css', target), layout);
await writeFile(new URL('reference-mobile.css', target), mobile);
