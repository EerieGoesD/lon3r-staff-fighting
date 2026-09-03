'use strict';
// On-screen controls for phones: a d-pad on the left, three buttons on the right.
// They feed the same key codes as player 1's keyboard.
const Touch = (() => {
  function init() {
    const root = document.getElementById('touch');
    root.hidden = false;

    root.querySelectorAll('.btn').forEach(el => {
      const code = el.dataset.key;
      const down = e => {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* not needed */ }
        el.classList.add('active');
        Sound.unlock();
        Input.press(code);
      };
      const up = () => { el.classList.remove('active'); Input.release(code); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });

    const pad = root.querySelector('.pad');
    const active = new Map();   // pointerId -> Set of held codes
    function dirs(e) {
      const r = pad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const dead = r.width * 0.12;
      const s = new Set();
      if (dx < -dead) s.add('KeyA');
      if (dx > dead) s.add('KeyD');
      if (dy < -dead * 1.6) s.add('KeyW');
      if (dy > dead * 1.6) s.add('KeyS');
      return s;
    }
    function apply(id, s) {
      const prev = active.get(id) || new Set();
      for (const c of prev) if (!s.has(c)) Input.release(c);
      for (const c of s) if (!prev.has(c)) Input.press(c);
      active.set(id, s);
    }
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* not needed */ }
      Sound.unlock();
      apply(e.pointerId, dirs(e));
    });
    pad.addEventListener('pointermove', e => { if (active.has(e.pointerId)) apply(e.pointerId, dirs(e)); });
    const end = e => { apply(e.pointerId, new Set()); active.delete(e.pointerId); };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('contextmenu', e => e.preventDefault());

    // tapping the picture itself works as Enter (start, confirm, rematch)
    const screen = document.getElementById('screen');
    screen.addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlock(); Input.press('Enter'); });
    screen.addEventListener('pointerup', () => Input.release('Enter'));
    screen.addEventListener('pointercancel', () => Input.release('Enter'));
  }
  return { init };
})();
