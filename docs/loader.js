// Weighted initialization milestones, not elapsed time or downloaded bytes.
export const loadingStages = Object.freeze({
  interface: 10,
  renderer: 40,
  textures: 10,
  fonts: 10,
  icon: 5,
  surfaces: 10,
  frame: 15,
});

export function formatLoadingProgress(value) {
  const percent = Math.max(0, Math.min(100, Math.floor(Number(value) || 0)));
  const filled = '#'.repeat(Math.floor(percent / 5));
  const empty = '.'.repeat(20 - filled.length);
  return { percent, filled, empty };
}

export function createArchiveLoader(element) {
  const progress = element.querySelector('.loader-progress');
  const filled = element.querySelector('.loader-filled');
  const empty = element.querySelector('.loader-empty');
  const percentage = element.querySelector('.loader-percent');
  const completed = new Set();
  let dismissed = false, completionTimer;

  function mark(stage) {
    if (dismissed || completed.has(stage) || !Object.hasOwn(loadingStages, stage)) return;
    completed.add(stage);
    const value = [...completed].reduce((sum, name) => sum + loadingStages[name], 0);
    const display = formatLoadingProgress(value);
    filled.textContent = display.filled;
    empty.textContent = display.empty;
    percentage.textContent = `${display.percent}%`;
    progress.setAttribute('aria-valuenow', String(display.percent));
    progress.setAttribute('aria-valuetext', `${display.percent}%`);
  }

  function dismiss() {
    dismissed = true;
    clearTimeout(completionTimer);
    element.remove();
  }

  function complete(onComplete) {
    if (dismissed || completionTimer !== undefined) return;
    mark('frame');
    // Briefly show the completed bar before revealing the entrance animation.
    completionTimer = setTimeout(() => {
      dismiss();
      onComplete();
    }, 220);
  }

  return { mark, complete, dismiss };
}
