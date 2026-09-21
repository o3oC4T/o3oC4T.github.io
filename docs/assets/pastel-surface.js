import { theme } from '../theme.js';

const rgb = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
const palette = theme.holographic.map(rgb);

// A small deterministic canvas texture, uploaded once per card. No image download
// or per-frame texture generation is needed; the physical material adds iridescence.
export function paintPastelSurface(context, index, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 540;
  const pixels = canvas.getContext('2d');
  const image = pixels.createImageData(canvas.width, canvas.height);
  const tint = rgb(theme.colors[accent] || theme.accent);
  const phase = index * 1.13;

  for (let y = 0; y < canvas.height; y++) {
    const v = y / canvas.height;
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width;
      const warp = u * .84 + v * .25
        + .15 * Math.sin(v * 8.4 + u * 3.2 + phase)
        + .055 * Math.sin(u * 14 - v * 6.5 + phase);
      const wave = (warp * 1.9 + .10 * Math.sin(v * 13 + u * 4 + phase) + index * .16 + 4) % 1;
      const position = wave * palette.length;
      const band = Math.floor(position);
      const fraction = position - band;
      const blend = fraction * fraction * (3 - 2 * fraction);
      const from = palette[band];
      const to = palette[(band + 1) % palette.length];
      const sheen = .075 * Math.pow(1 - Math.abs(Math.sin(wave * Math.PI * 8)), 12);
      const grain = (((Math.imul(x ^ Math.imul(y, 374761393), 1274126177) >>> 0) & 255) / 255 - .5) * 1.4;
      const offset = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const color = (from[channel] + (to[channel] - from[channel]) * blend) * .79 + tint[channel] * .21;
        image.data[offset + channel] = Math.min(255, color + (255 - color) * sheen + grain);
      }
      image.data[offset + 3] = 255;
    }
  }
  pixels.putImageData(image, 0, 0);
  context.drawImage(canvas, 0, 0, 1024, 720);
}
