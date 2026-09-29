const circles = [
  { size: 26, opacity: .36 },
  { size: 21, opacity: .26 },
  { size: 16, opacity: .17 },
  { size: 11, opacity: .10 },
];

// Four reusable circles. Animate only while moving or during the short fade-out.
export function createCursorTrail(getAccent) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let layer, dots = [], points = [], frame = 0, previousTime = 0, lastMovement = 0;
  let position, target, activeTouch = null, blocked = false;

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    position = undefined;
    if (layer) layer.hidden = true;
  }

  function sync() {
    if (!layer || layer.hidden) return;
    const source = `/assets/cursor-${getAccent(target)}.svg?v=20260930-cursor36`;
    for (const dot of dots) if (dot.getAttribute('src') !== source) dot.src = source;
  }

  function animate(now) {
    frame = 0;
    const age = now - lastMovement;
    if (age >= 360 || document.hidden || reducedMotion.matches) { hide(); return; }
    const delta = Math.min((now - previousTime) / 1000, .05);
    previousTime = now;
    const follow = 1 - Math.exp(-24 * delta);
    const fade = Math.max(0, 1 - Math.max(0, age - 80) / 280);
    let leader = position;
    points.forEach((point, index) => {
      point.x += (leader.x - point.x) * follow;
      point.y += (leader.y - point.y) * follow;
      const { size, opacity } = circles[index];
      dots[index].style.transform = `translate3d(${point.x - size / 2}px, ${point.y - size / 2}px, 0)`;
      dots[index].style.opacity = String(opacity * fade);
      leader = point;
    });
    frame = requestAnimationFrame(animate);
  }

  function move(x, y, element) {
    if (reducedMotion.matches || document.hidden) return;
    const host = document.querySelector('dialog[open]') || document.body;
    if (layer && layer.parentElement !== host) hide();
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'cursor-trail';
      layer.setAttribute('aria-hidden', 'true');
      dots = circles.map(({ size }) => {
        const dot = document.createElement('img');
        dot.alt = '';
        dot.draggable = false;
        dot.width = dot.height = size;
        dot.style.width = dot.style.height = `${size}px`;
        layer.append(dot);
        return dot;
      });
    }
    if (layer.parentElement !== host) host.append(layer);
    const first = !position;
    position = { x, y };
    target = element;
    lastMovement = performance.now();
    if (first) {
      points = circles.map(() => ({ x, y }));
      dots.forEach(dot => { dot.style.opacity = '0'; });
    }
    layer.hidden = false;
    sync();
    if (!frame) {
      previousTime = lastMovement;
      frame = requestAnimationFrame(animate);
    }
  }

  function mouse(event) {
    if (event.pointerType !== 'mouse') return;
    move(event.clientX, event.clientY, event.target);
  }
  // Touch pointerout also fires when native scrolling takes over; touchmove
  // continues, so only a mouse leaving the viewport should clear the trail.
  function leave(event) { if (event.pointerType === 'mouse' && !event.relatedTarget) hide(); }
  function start(event) {
    hide();
    if (event.touches.length !== 1) { blocked = true; activeTouch = null; return; }
    if (blocked) return;
    activeTouch = event.touches[0].identifier;
  }
  function touch(event) {
    if (blocked || activeTouch === null) return;
    const point = [...event.touches].find(point => point.identifier === activeTouch);
    if (point) move(point.clientX, point.clientY, point.target);
  }
  function end(event) {
    if (!event.touches.length) { blocked = false; activeTouch = null; }
  }
  function cancel(event) { blocked = event.touches.length > 0; activeTouch = null; hide(); }
  function visibility() { if (document.hidden) hide(); }
  const options = { passive: true, capture: true };
  const listeners = { pointermove: mouse, pointerout: leave, touchstart: start, touchmove: touch, touchend: end, touchcancel: cancel };
  for (const [type, listener] of Object.entries(listeners)) document.addEventListener(type, listener, options);
  document.addEventListener('visibilitychange', visibility);
  reducedMotion.addEventListener('change', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  window.addEventListener('resize', hide);
  return {
    sync, hide,
    destroy() {
      hide();
      for (const [type, listener] of Object.entries(listeners)) document.removeEventListener(type, listener, options);
      document.removeEventListener('visibilitychange', visibility);
      reducedMotion.removeEventListener('change', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('resize', hide);
      layer?.remove();
    },
  };
}
