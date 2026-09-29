import { readFile, writeFile } from 'node:fs/promises';
import { theme } from '../docs/theme.js';

const toHex = value => Math.round(value * 255).toString(16).padStart(2, '0');
function hslToHex(hue, saturation, lightness) {
  const channel = offset => {
    const k = (offset + hue / 30) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return '#' + [0, 8, 4].map(channel).map(toHex).join('');
}

export function recolorCss(css) {
  const exact = { '#c4f568': theme.accent, '#b4e566': theme.accent, '#080908': theme.background, '#0d100b': theme.surface };
  return css.replace(/#[\da-f]{3,8}\b/gi, hex => {
    let value = hex.toLowerCase();
    if (value.length === 4 || value.length === 5) value = '#' + [...value.slice(1)].map(c => c + c).join('');
    if (value.length !== 7 && value.length !== 9) return hex;
    const alpha = value.slice(7);
    const color = value.slice(0, 7);
    if (exact[color]) return exact[color] + alpha;
    const [r, g, b] = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), difference = max - min;
    if (!difference) return hex;
    const lightness = (max + min) / 2;
    const saturation = difference / (1 - Math.abs(2 * lightness - 1));
    const hue = ((max === r ? (g - b) / difference : max === g ? (b - r) / difference + 2 : (r - g) / difference + 4) * 60 + 360) % 360;
    if (hue < 55 || hue > 165) return hex;
    return hslToHex(lightness < .2 ? 280 : 328,
      lightness < .2 ? Math.min(saturation, .22) : Math.min(saturation * .8, .63),
      saturation > .5 && lightness > .35 && lightness < .8 ? Math.max(lightness, .76) : lightness) + alpha;
  }).replaceAll('--lime', '--accent').replace(/url\(\/cursor-(lime|purple|blue|orange|pink|red)\.png\)/g,
    (_, name) => `url(/assets/cursor-${({ lime: 'pink', purple: 'lilac', blue: 'sky', orange: 'peach', pink: 'pink', red: 'pink' })[name]}.svg)`)
    .replace(/url\(\/assets\/cursor-([a-z]+)\.svg(?:\?v=[\w-]+)?\) (?:7 6|5 3|13 13)/g,
      (_, name) => `url(/assets/cursor-${name}.svg?v=20260930-cat-cursor) 13 13`);
}

export function pastelScene(source) {
  // Do not rewrite the bundled Three.js library: only the portfolio renderer.
  const boundary = source.indexOf(',nd={ticket:');
  if (boundary < 0) throw new Error('Reference renderer boundary changed');
  let renderer = source.slice(boundary);
  const replace = (before, after) => {
    if (renderer.split(before).length !== 2) throw new Error(`Renderer patch mismatch: ${before}`);
    renderer = renderer.replace(before, after);
  };
  const colors = {
    '#080908': theme.background, '#20231e': '#29222d', '#11170c': '#19131e',
    '#849269': '#c4a4bd', '#9ec541': '#ffb6dc', '#e7ffb5': '#ffe1f1', '#c1ff52': '#ffafd9',
    '#b8d776': '#dfb2d4', '#090b08': '#100c14', '#bccd9b': '#e7b9d9', '#080c06': '#100c14',
    '#82a23f': '#e9a0cd', '#c4f568': theme.accent, '#c3df91': '#624563', '#82965f': '#775472',
    '#65734f': '#60445f', '#b8d985': '#624563', '#0c0d0c': '#100d13', '#e5e9d8': '#f7e5f7',
    '#111808': '#170f1b', '#f6f5e8': '#fff1fa', '#fffdec': '#f3eaff', '#dcebc4': '#dfdcff',
    '#c3f56b': '#ffacd6', '#d0f998': '#ffcde7',
  };
  renderer = renderer.replace(/#[\da-f]{6}\b/gi, value => colors[value.toLowerCase()] || value);

  const paletteStart = renderer.indexOf('xe={lime:');
  const paletteEnd = renderer.indexOf(',Se=', paletteStart);
  if (paletteStart < 0 || paletteEnd < 0) throw new Error('Reference palette changed');
  const material = color => `(()=>{let c=new Z(${JSON.stringify(color)});return{ink:new q(c.r,c.g,c.b).multiplyScalar(1.6).addScalar(.08),emission:c,rim:c.clone().lerp(new Z('#ffffff'),.18)}})()`;
  const entries = Object.entries({ base: theme.accent, ...theme.colors }).filter(([key]) => key !== 'rainbow');
  renderer = renderer.slice(0, paletteStart) + `xe={${entries.map(([key, color]) => `${key}:${material(color)}`).join(',')}}` + renderer.slice(paletteEnd);
  renderer = renderer.replaceAll('`lime`', '`base`').replaceAll('xe.lime', 'xe.base');
  renderer = renderer.replaceAll('hue:78', 'hue:328').replaceAll('H=78', 'H=328');
  renderer = renderer.replaceAll('96% 68%', '75% 84%');
  const cycle = renderer.match(/Ce=e=>\{let t=\(e%360[\s\S]*?},we=/)?.[0];
  if (!cycle) throw new Error('Reference rainbow cycle changed');
  replace(cycle, `Ce=e=>{let t=(e%360+360)%360,p=${JSON.stringify(theme.holographic)},a=t/360*p.length,i=Math.floor(a),n=new Z(p[i]).lerp(new Z(p[(i+1)%p.length]),a-i);return{hue:t,ink:new q(n.r,n.g,n.b).multiplyScalar(1.6).addScalar(.08),emission:n,rim:n.clone().lerp(new Z('#ffffff'),.18),css:'#'+n.getHexString()}},we=`);
  replace('let u=l.createLinearGradient(0,0,1024,720);u.addColorStop(0,`#1b2212`),u.addColorStop(.4,`#0e120b`),u.addColorStop(1,`#121a0c`),l.fillStyle=u,l.fillRect(0,0,1024,720),', 'paintPastelSurface(l,r,n),');
  replace('map:f,metalness:.5,roughness:.48,roughnessMap:D,bumpMap:D,bumpScale:.001,clearcoat:.25,clearcoatRoughness:.38', 'map:f,metalness:.24,roughness:.32,roughnessMap:D,bumpMap:D,bumpScale:.001,clearcoat:.85,clearcoatRoughness:.2,iridescence:1,iridescenceIOR:1.3,iridescenceThicknessRange:[150,460]');
  replace('diffuseColor.rgb = mix(diffuseColor.rgb, ink * inkTint, hoverTint);', 'diffuseColor.rgb = mix(diffuseColor.rgb, ink * inkTint, hoverTint * .12);');
  replace('diffuseColor.rgb = mix(diffuseColor.rgb, inkTint, symbolFill.a * inkReveal);', 'diffuseColor.rgb = mix(diffuseColor.rgb, inkTint * .16, symbolFill.a * inkReveal);');
  replace('vec3 base = vec3(.0018, .0021, .0017);', 'vec3 base = vec3(.0022, .0015, .0024);');
  replace('rgba(176,220,94,0.07)', 'rgba(255,173,218,0.07)');
  replace('rgba(130,177,61,0.025)', 'rgba(223,139,207,0.025)');
  replace('rgba(80,130,10,0)', 'rgba(138,79,137,0)');
  return `import { paintPastelSurface } from './pastel-surface.js?v=20260921-pastel';\n` + source.slice(0, boundary) + renderer;
}

export async function writeCursors() {
  const photo = (await readFile(new URL('../docs/assets/profile-cat.jpg', import.meta.url))).toString('base64');
  for (const [name, color] of Object.entries(theme.colors)) {
    // Embedded photo keeps the SVG self-contained in native cursor image mode.
    // One complete circle, a light tint, and a small rim; no arrow or cutout.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><defs><clipPath id="crop"><circle cx="13" cy="13" r="12"/></clipPath><linearGradient id="tint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${name === 'rainbow' ? theme.colors.sky : color}"/></linearGradient></defs><g clip-path="url(#crop)"><image x="1" y="1" width="24" height="24" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${photo}"/><circle cx="13" cy="13" r="12" fill="url(#tint)" opacity=".18"/></g><circle cx="13" cy="13" r="12.2" fill="none" stroke="#251324" stroke-width="1"/><circle cx="13" cy="13" r="11.7" fill="none" stroke="url(#tint)" stroke-opacity=".8" stroke-width=".8"/></svg>\n`;
    await writeFile(new URL(`../docs/assets/cursor-${name}.svg`, import.meta.url), svg);
  }
}

// A mechanical, idempotent migration for the handwritten interface stylesheet.
if (process.argv.includes('--apply-ui')) {
  const file = new URL('../docs/styles.css', import.meta.url);
  await writeFile(file, recolorCss(await readFile(file, 'utf8')));
}
