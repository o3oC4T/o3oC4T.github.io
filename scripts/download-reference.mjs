import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Save the public files delivered to a browser, maintaining their URL paths.
const origin = 'https://mridul.design';
// Keep a future reference capture separate from the personalized public site.
const destination = path.resolve('reference/download');
const queue = ['/'];
const seen = new Set(queue);
const downloaded = [];
const failed = [];
let totalBytes = 0;

function add(value, parent) {
  if (!value || /[$<>{}\\\s]/.test(value) || value.startsWith('//')) return;
  let url;
  try { url = new URL(value.startsWith('_next/') ? '/' + value : value, new URL(parent, origin)); } catch { return; }
  if (url.origin !== origin || !/\.(?:js|css|woff2?|ttf|png|jpe?g|webp|gif|svg|mp4|webm|json|lottie|wasm|pdf)$/i.test(url.pathname)) return;
  const key = url.pathname;
  if (key.startsWith('/cdn-cgi/')) return;
  if (seen.has(key)) return;
  seen.add(key);
  if (/\.(js|css|woff2?|wasm)$/.test(key)) queue.unshift(key);
  else queue.push(key);
}

function discover(text, parent) {
  for (const match of text.matchAll(/(?:["'`]|url\(\s*)(\/(?:_next|media|fonts|lottie)\/[^"'`\s)<>]+|\.?\.?\/[^"'`\s)<>]+|_next\/[^"'`\s)<>]+|\/icon\.svg)["'`)\s]/g)) {
    add(match[1], parent);
  }
  // CSS font and image URLs may be quoted or unquoted.
  for (const match of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(match[1], parent);
  // The coin gallery's filenames are composed at runtime.
  if (text.includes('/media/ggt-coin/')) {
    for (const match of text.matchAll(/[`"'](06f658_[^`"']+\.(?:png|jpg|gif))[`"']/g)) add('/media/ggt-coin/' + match[1], parent);
  }
}

async function download(resource) {
  const filename = path.join(destination, resource === '/' ? 'index.html' : decodeURIComponent(resource));
  try {
    let buffer;
    try {
      await stat(filename);
      buffer = await readFile(filename);
    } catch {
      const response = await fetch(origin + resource, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if (resource !== '/' && /text\/html/.test(response.headers.get('content-type') || '')) throw new Error('HTML instead of asset');
      if (Number(response.headers.get('content-length')) > 95 * 1024 * 1024) throw new Error('Asset exceeds 95 MiB');
      buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 95 * 1024 * 1024) throw new Error('Asset exceeds 95 MiB');
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, buffer);
    }
    if (resource === '/' || /\.(js|css|json)$/.test(resource)) discover(buffer.toString('utf8'), resource);
    totalBytes += buffer.length;
    downloaded.push({ path: resource, bytes: buffer.length });
    if (downloaded.length % 30 === 0) console.log(`${downloaded.length} files, ${(totalBytes / 1048576).toFixed(1)} MiB, ${queue.length} remaining`);
  } catch (error) {
    failed.push({ path: resource, error: error.message });
    console.log(`FAILED ${resource}: ${error.message}`);
  }
}

while (queue.length) {
  const batch = queue.splice(0, 4);
  await Promise.all(batch.map(download));
}
await mkdir('reference', { recursive: true });
await writeFile('reference/download-manifest.json', JSON.stringify({ origin, capturedAt: new Date().toISOString(), totalBytes, downloaded, failed }, null, 2));
console.log(JSON.stringify({ files: downloaded.length, megabytes: +(totalBytes / 1048576).toFixed(1), failed }, null, 2));
