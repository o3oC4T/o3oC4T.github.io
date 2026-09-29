import { artStyles, glyphReference, renderTitleArt } from './title-art.js?v=20260930-ascii';

// One instance per open card; no animation work survives its disposal.
export function mountTitleArt(button) {
  if (!button) return () => {};
  const canvas = button.querySelector('canvas');
  const layer = button.querySelector('.terminal-art-layer');
  const context = canvas.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Read media preferences on change, not inside the animation loop.
  let reduced = motion.matches;
  const prefix = button.dataset.artPrefix;
  const title = button.dataset.artTitle;
  let styleIndex = artStyles.indexOf(button.dataset.artStyle);
  let frame = 0, interval = 0, disposed = false, visible = true, width = 0, height = 0;
  let elapsed = 0, last = 0, glitchStep = 0;
  let point = null;
  const channels = '. . : + # : . ░';

  function paint(seconds) {
    if (!context || !width || !height) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(button).color;
    context.font = '12px "JetBrains Mono", ui-monospace, monospace';
    context.textBaseline = 'top';
    for (let y = 2; y < height; y += 18) for (let x = 2; x < width; x += 14) {
      const wave = (2 + Math.sin(x * .024 + seconds * .7) + Math.cos(y * .06 - x * .012 - seconds * .5)) / 4;
      const near = point ? Math.max(0, 1 - Math.hypot(x - point.x, y - point.y) / 120) : 0;
      const energy = Math.min(1, wave * .7 + near * .65);
      const glyph = near > .55 ? '#' : channels[Math.floor(energy * (channels.length - 1))];
      if (glyph === ' ') continue;
      context.globalAlpha = .045 + wave * .08 + near * .3;
      context.fillText(glyph, x, y);
    }
    context.globalAlpha = 1;
  }

  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function canRun() { return Boolean(context) && !disposed && visible && !document.hidden && !reduced; }
  function loop(now) {
    frame = 0;
    if (!canRun()) { button.dataset.artMotion = 'paused'; return; }
    if (!last || now - last >= 50) {
      elapsed += last ? Math.min(.1, (now - last) / 1000) : .05;
      last = now;
      paint(elapsed);
    }
    frame = requestAnimationFrame(loop);
  }
  function sync() {
    stop();
    button.dataset.artMotion = canRun() ? 'running' : 'paused';
    if (canRun()) frame = requestAnimationFrame(loop);
    else if (visible && !document.hidden && !disposed) paint(1.7);
  }
  function resize() {
    if (disposed) return;
    const nextWidth = button.clientWidth, nextHeight = button.clientHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (nextWidth === width && nextHeight === height && canvas.width === Math.round(width * dpr)) return;
    width = nextWidth; height = nextHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(reduced ? 1.7 : elapsed);
  }
  function move(event) {
    if (reduced) return;
    const rect = button.getBoundingClientRect();
    point = { x: (event.clientX - rect.left) * width / rect.width, y: (event.clientY - rect.top) * height / rect.height };
  }
  function leave() { point = null; }
  function finishShuffle() {
    clearInterval(interval); interval = 0;
    layer.innerHTML = renderTitleArt(title, artStyles[styleIndex], prefix);
    button.dataset.artStyle = artStyles[styleIndex];
    button.dataset.artPhase = 'idle';
  }
  function shuffle() {
    if (interval || disposed) return;
    styleIndex = (styleIndex + 1) % artStyles.length;
    if (reduced) { finishShuffle(); return; }
    button.dataset.artPhase = 'glitch';
    glitchStep = 0;
    const tiles = [...layer.querySelectorAll('[data-art-cell]')];
    const noise = '░▒▓█▞▚';
    interval = setInterval(() => {
      tiles.forEach((tile, index) => tile.setAttribute('href', glyphReference(prefix, noise[(index * 7 + glitchStep * 11) % noise.length])));
      if (++glitchStep === 4) finishShuffle();
    }, 45);
  }
  function motionChange() { reduced = motion.matches; if (interval) finishShuffle(); sync(); }
  function visibilityChange() { if (document.hidden && interval) finishShuffle(); sync(); }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(button);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && interval) finishShuffle();
    sync();
  });
  intersectionObserver.observe(button);
  button.addEventListener('click', shuffle);
  button.addEventListener('pointermove', move, { passive: true });
  button.addEventListener('pointerdown', move, { passive: true });
  button.addEventListener('pointerleave', leave);
  motion.addEventListener('change', motionChange);
  document.addEventListener('visibilitychange', visibilityChange);
  resize(); sync();
  document.fonts.ready.then(() => { if (!disposed) paint(reduced ? 1.7 : elapsed); });
  return () => {
    disposed = true; stop(); clearInterval(interval);
    resizeObserver.disconnect(); intersectionObserver.disconnect();
    button.removeEventListener('click', shuffle);
    button.removeEventListener('pointermove', move);
    button.removeEventListener('pointerdown', move);
    button.removeEventListener('pointerleave', leave);
    motion.removeEventListener('change', motionChange);
    document.removeEventListener('visibilitychange', visibilityChange);
    button.dataset.artMotion = 'disposed';
  };
}
