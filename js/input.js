'use strict';
// Keyboard state. isDown = held right now, pressed = went down since the last logic tick.
const Input = (() => {
  const down = new Set();
  const pressedNow = new Set();
  const swallow = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

  window.addEventListener('keydown', e => {
    if (!down.has(e.code)) pressedNow.add(e.code);
    down.add(e.code);
    if (swallow.has(e.code)) e.preventDefault();
    Sound.unlock();
  });
  window.addEventListener('keyup', e => down.delete(e.code));
  window.addEventListener('blur', () => down.clear());

  return {
    isDown: code => down.has(code),
    pressed: code => pressedNow.has(code),
    anyPressed: () => pressedNow.size > 0,
    press: code => { if (!down.has(code)) pressedNow.add(code); down.add(code); },
    release: code => down.delete(code),
    endTick: () => pressedNow.clear(),
  };
})();

const KEYS = [
  { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyF', kick: 'KeyG', special: 'KeyH' },
  { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyK', kick: 'KeyL', special: 'Semicolon' },
];

function readPad(keys) {
  return {
    left: Input.isDown(keys.left),
    right: Input.isDown(keys.right),
    down: Input.isDown(keys.down),
    jump: Input.pressed(keys.up),
    punch: Input.pressed(keys.punch),
    kick: Input.pressed(keys.kick),
    special: Input.pressed(keys.special),
  };
}
