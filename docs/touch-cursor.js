// Same photo as the native cursor, shown only during/recently after a touch.
// Passive touch events keep native scrolling and pinch-to-zoom intact.
export function createTouchCursor(getAccent) {
  let marker, active = null, blocked = false, visible = false, timer = 0;
  let x = 0, y = 0, target;
  function sync() {
    if (!visible) return;
    if (!marker) {
      marker = document.createElement('img');
      marker.className = 'profile-touch-cursor';
      marker.alt = '';
      marker.setAttribute('aria-hidden', 'true');
      marker.draggable = false;
      marker.width = marker.height = 36;
    }
    // A body overlay cannot render above a modal dialog's top layer.
    const host = document.querySelector('dialog[open]') || document.body;
    if (marker.parentElement !== host) host.append(marker);
    const source = `/assets/cursor-${getAccent(target)}.svg?v=20260930-cursor36`;
    if (marker.getAttribute('src') !== source) marker.src = source;
    const left = Math.max(0, Math.min(innerWidth - 36, x - 18));
    const top = Math.max(0, Math.min(innerHeight - 36, y - 18));
    marker.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    marker.dataset.visible = 'true';
  }
  function hide() {
    clearTimeout(timer); timer = 0;
    visible = false; active = null;
    if (marker) marker.dataset.visible = 'false';
  }
  function show(touch) {
    clearTimeout(timer); timer = 0;
    x = touch.clientX; y = touch.clientY; target = touch.target;
    visible = true; sync();
  }
  function start(event) {
    if (event.touches.length !== 1) { blocked = true; hide(); return; }
    if (blocked) return;
    active = event.touches[0].identifier;
    show(event.touches[0]);
  }
  function move(event) {
    if (blocked || active === null) return;
    const touch = [...event.touches].find(touch => touch.identifier === active);
    if (touch) show(touch);
  }
  function end(event) {
    if (blocked) { if (!event.touches.length) blocked = false; return; }
    const touch = [...event.changedTouches].find(touch => touch.identifier === active);
    if (!touch) return;
    active = null;
    show(touch);
    timer = setTimeout(hide, 650);
  }
  function cancel(event) { blocked = event.touches.length > 0; hide(); }
  function mouse(event) { if (event.pointerType === 'mouse' && visible) hide(); }
  function visibility() { if (document.hidden) hide(); }
  // Mobile address-bar resizing should not end an active scrolling gesture.
  function resize() { if (active !== null) sync(); else hide(); }
  const options = { passive: true, capture: true };
  const listeners = { touchstart: start, touchmove: move, touchend: end, touchcancel: cancel, pointermove: mouse, pointerdown: mouse };
  for (const [type, listener] of Object.entries(listeners)) document.addEventListener(type, listener, options);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  window.addEventListener('resize', resize);
  return {
    sync, hide,
    destroy() {
      hide();
      for (const [type, listener] of Object.entries(listeners)) document.removeEventListener(type, listener, options);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('resize', resize);
      marker?.remove();
    },
  };
}
