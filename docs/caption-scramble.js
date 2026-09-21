// DOM adaptation of the reference portfolio's matrix-text effect.
// Preserve its 75 ms glyph cadence and per-letter reveal timing without React.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%+/?<>';
const CADENCE = 75;

export function createCaptionScramble(root) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [
    { element: root.querySelector('.caption-number'), duration: 420 },
    { element: root.querySelector('.caption-title'), duration: 520 },
    { element: root.querySelector('.caption-arrow'), duration: 520 },
  ];
  let timer = null;
  let generation = 0;
  let currentKey = null;
  let frames = [];

  function finish() {
    window.clearTimeout(timer);
    timer = null;
    for (const { wrapper, letters } of frames) {
      for (const letter of letters) {
        letter.dataset.phase = 'settled';
        letter.dataset.glyph = letter.dataset.character;
      }
      wrapper.dataset.scrambling = 'idle';
    }
  }

  function build(target, text) {
    const wrapper = document.createElement('span');
    wrapper.className = 'about-matrix';
    wrapper.dataset.scrambling = 'idle';
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = text;
    const visual = document.createElement('span');
    visual.className = 'matrix-visual';
    visual.setAttribute('aria-hidden', 'true');
    const letters = [];
    for (const part of text.split(/(\s+)/)) {
      if (/^\s+$/.test(part)) { visual.append(part); continue; }
      const word = document.createElement('span');
      word.className = 'matrix-word';
      for (const character of Array.from(part)) {
        const letter = document.createElement('span');
        letter.className = 'matrix-letter';
        letter.textContent = character;
        letter.dataset.character = character;
        letter.dataset.glyph = character;
        letter.dataset.phase = 'settled';
        word.append(letter);
        letters.push(letter);
      }
      visual.append(word);
    }
    wrapper.append(accessible, visual);
    target.element.replaceChildren(wrapper);
    return { ...target, wrapper, letters };
  }

  function set(number, title, { animate = true } = {}) {
    const key = JSON.stringify([number, title]);
    if (key === currentKey) return; // A stationary pointer must not restart the reveal.
    currentKey = key;
    finish();
    frames = targets.map((target, index) => build(target, [number, title, '↗'][index]));
    if (!animate || motion.matches || document.hidden) return;

    const sequence = ++generation;
    const started = performance.now();
    for (const { wrapper, letters } of frames) {
      wrapper.dataset.scrambling = 'active';
      letters.forEach((letter, index) => {
        letter.dataset.phase = 'queued';
        letter.dataset.glyph = GLYPHS[(index * 13 + sequence * 7) % GLYPHS.length];
      });
    }

    function tick() {
      const elapsed = performance.now() - started;
      const step = Math.floor(elapsed / CADENCE);
      let active = false;
      for (const { duration, letters, wrapper } of frames) {
        const shuffleWindow = Math.max(180, Math.min(240, duration * .42));
        letters.forEach((letter, index) => {
          const reveal = duration * (.34 + (letters.length > 1 ? index / (letters.length - 1) : 0) * .55)
            + index * 17 % 5 * duration * .012;
          const phase = elapsed >= reveal ? 'settled' : elapsed >= reveal - shuffleWindow ? 'shuffling' : 'queued';
          const glyph = phase === 'settled' ? letter.dataset.character
            : GLYPHS[(index * 13 + sequence * 7 + step * (11 + index % 7 * 2)) % GLYPHS.length];
          if (letter.dataset.phase !== phase) letter.dataset.phase = phase;
          if (letter.dataset.glyph !== glyph) letter.dataset.glyph = glyph;
        });
        wrapper.dataset.scrambling = elapsed >= duration ? 'idle' : 'active';
        active ||= elapsed < duration;
      }
      if (active) timer = window.setTimeout(tick, CADENCE);
      else finish();
    }
    tick();
  }

  const onMotion = () => { if (motion.matches) finish(); };
  const onVisibility = () => { if (document.hidden) finish(); };
  motion.addEventListener('change', onMotion);
  document.addEventListener('visibilitychange', onVisibility);
  return {
    set,
    finish,
    destroy() {
      finish();
      motion.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
