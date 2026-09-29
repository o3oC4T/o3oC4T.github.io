// Original bitmap letterforms rendered as joined vector outlines. No font,
// shaded Unicode glyphs, or repeated texture is involved in the title artwork.
const alphabet = {
  A: ['01110','11011','11011','11111','11011','11011','11011'],
  B: ['11110','11011','11011','11110','11011','11011','11110'],
  C: ['01111','11000','11000','11000','11000','11000','01111'],
  D: ['11110','11011','11011','11011','11011','11011','11110'],
  E: ['11111','11000','11000','11110','11000','11000','11111'],
  F: ['11111','11000','11000','11110','11000','11000','11000'],
  G: ['01111','11000','11000','11011','11011','11011','01111'],
  H: ['11011','11011','11011','11111','11011','11011','11011'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00011','00011','00011','11011','11011','01110'],
  K: ['11011','11011','11110','11100','11110','11011','11011'],
  L: ['11000','11000','11000','11000','11000','11000','11111'],
  M: ['11011','11111','11111','11011','11011','11011','11011'],
  N: ['10011','11011','11111','11111','11011','11011','11001'],
  O: ['01110','11011','11011','11011','11011','11011','01110'],
  P: ['11110','11011','11011','11110','11000','11000','11000'],
  Q: ['01110','11011','11011','11011','11111','01110','00011'],
  R: ['11110','11011','11011','11110','11110','11011','11011'],
  S: ['01111','11000','11000','01110','00011','00011','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['11011','11011','11011','11011','11011','11011','01110'],
  V: ['11011','11011','11011','11011','11011','01010','00100'],
  W: ['11011','11011','11011','11011','11111','11111','01010'],
  X: ['11011','11011','01010','00100','01010','11011','11011'],
  Y: ['11011','11011','01110','00100','00100','00100','00100'],
  Z: ['11111','00011','00110','00100','01100','11000','11111'],
  0: ['01110','11011','11011','11011','11011','11011','01110'],
  1: ['00100','01100','00100','00100','00100','00100','01110'],
  2: ['01110','11011','00011','00110','01100','11000','11111'],
  3: ['11110','00011','00011','01110','00011','00011','11110'],
  4: ['11011','11011','11011','11111','00011','00011','00011'],
  5: ['11111','11000','11000','11110','00011','00011','11110'],
  6: ['01110','11000','11000','11110','11011','11011','01110'],
  7: ['11111','00011','00110','00100','01100','01100','01100'],
  8: ['01110','11011','11011','01110','11011','11011','01110'],
  9: ['01110','11011','11011','01111','00011','00011','01110'],
  ' ': ['000','000','000','000','000','000','000'],
};

export function titleArt(title) {
  if (!title.trim()) throw new Error('A title is required');
  const letters = [...title.toUpperCase()].map(letter => {
    if (!alphabet[letter]) throw new Error(`Unsupported title character: ${letter}`);
    return alphabet[letter];
  });
  const columns = letters.reduce((total, letter) => total + letter[0].length + 1, -1);
  const pixels = Array.from({ length: 7 }, () => Array(columns).fill(false));
  let offset = 0;
  for (const letter of letters) {
    letter.forEach((row, y) => [...row].forEach((value, x) => {
      pixels[y][offset + x] = value === '1';
    }));
    offset += letter[0].length + 1;
  }
  // 6 × 10 letter cells retain the terminal-style proportions. One unit of
  // padding surrounds the complete face and its three-by-four-unit shadow.
  return { width: columns * 6 + 5, height: 76, path: outline(pixels) };
}

function outline(pixels) {
  const edges = [];
  const outgoing = new Map();
  const filled = (x, y) => pixels[y]?.[x] === true;
  const key = (x, y) => `${x},${y}`;
  const add = (x, y, nextX, nextY, direction) => {
    const edge = { x, y, nextX, nextY, direction, used: false };
    edges.push(edge);
    const start = key(x, y);
    if (!outgoing.has(start)) outgoing.set(start, []);
    outgoing.get(start).push(edge);
  };

  // Only the perimeter survives: adjoining cells never have separate painted
  // edges that could turn into hairline gaps at fractional scales.
  pixels.forEach((row, y) => row.forEach((value, x) => {
    if (!value) return;
    if (!filled(x, y - 1)) add(x, y, x + 1, y, 0);
    if (!filled(x + 1, y)) add(x + 1, y, x + 1, y + 1, 1);
    if (!filled(x, y + 1)) add(x + 1, y + 1, x, y + 1, 2);
    if (!filled(x - 1, y)) add(x, y + 1, x, y, 3);
  }));

  const contours = [];
  const turnPriority = [1, 0, 3, 2]; // right, straight, left, reverse
  for (const start of edges) {
    if (start.used) continue;
    let edge = start;
    const points = [];
    while (true) {
      edge.used = true;
      points.push([edge.x, edge.y]);
      if (edge.nextX === start.x && edge.nextY === start.y) break;
      const candidates = outgoing.get(key(edge.nextX, edge.nextY)).filter(candidate => !candidate.used);
      const rank = candidate => turnPriority.indexOf((candidate.direction - edge.direction + 4) % 4);
      candidates.sort((a, b) => rank(a) - rank(b));
      if (!candidates.length) throw new Error('Unclosed title outline');
      edge = candidates[0];
    }
    const corners = points.filter((_, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const next = points[(index + 1) % points.length];
      return previous[0] !== next[0] && previous[1] !== next[1];
    });
    contours.push(corners.map(([x, y], index) => `${index ? 'L' : 'M'}${x * 6 + 1},${y * 10 + 1}`).join('') + 'Z');
  }
  return contours.join('');
}
