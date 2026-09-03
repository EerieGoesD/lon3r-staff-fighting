'use strict';
// Fixed 60 Hz game logic, rendering at the monitor's refresh rate with interpolation.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  function fit() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const scale = s >= 3 ? Math.floor(s) : s;   // whole-number scaling on big screens, fill small ones
    canvas.style.width = Math.round(W * scale) + 'px';
    canvas.style.height = Math.round(H * scale) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  // film grain: three pre-made noise frames cycled every tick
  const grain = [];
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const img = g.createImageData(W, H);
    for (let p = 0; p < img.data.length; p += 4) {
      const v = Math.random();
      img.data[p] = img.data[p + 1] = img.data[p + 2] = 255;
      img.data[p + 3] = v < 0.08 ? 40 : 0;
    }
    g.putImageData(img, 0, 0);
    grain.push(c);
  }

  const params = new URLSearchParams(location.search);

  // phones get on-screen controls and a computer opponent
  const touch = params.has('touch') || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  G.touch = touch;
  G.cpu = touch || params.has('cpu');
  if (touch) Touch.init();

  for (const ch of CHARACTERS) {
    const img = new Image();
    img.src = ch.portrait;
    G.portraits[ch.id] = img;
  }

  const TICK = 1000 / 60;
  let acc = 0, last = performance.now();

  function update() {
    G.t++;
    SCENES[G.scene].update();
    Input.endTick();
  }

  function render(alpha) {
    SCENES[G.scene].render(ctx, alpha);
    // occasional VHS tracking wobble
    if (Math.random() < 0.02) {
      const y = Math.floor(Math.random() * (H - 8)), h = 2 + Math.floor(Math.random() * 6);
      ctx.drawImage(canvas, 0, y, W, h, Math.random() < 0.5 ? -2 : 2, y, W, h);
    }
    ctx.globalAlpha = 0.5;
    ctx.drawImage(grain[G.t % 3], 0, 0);
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    let dt = now - last;
    last = now;
    if (dt > 100) dt = 100;
    acc += dt;
    while (acc >= TICK) { update(); acc -= TICK; }
    render(acc / TICK);
    requestAnimationFrame(loop);
  }

  function start() {
    const scene = params.get('scene');
    if (scene && SCENES[scene]) {
      if (scene === 'fight' || scene === 'vs') {
        const byId = id => CHARACTERS.find(c => c.id === id);
        G.chars = [byId(params.get('p1')) || CHARACTERS[0], byId(params.get('p2')) || CHARACTERS[1]];
      }
      goScene(scene);
      const ticks = parseInt(params.get('t') || '0', 10);
      for (let i = 0; i < ticks; i++) update();
      const pose = params.get('pose');   // e.g. pose=kick:8 puts player 1 into that attack frame
      if (pose && G.fighters.length) {
        const [name, at] = pose.split(':');
        const f = G.fighters[0];
        if (ATTACKS[name]) { f.attack = { name, t: parseInt(at || '0', 10) }; f.setState('attack'); }
        else if (name === 'special') { f.startSpecial(); for (let i = parseInt(at || '0', 10); i > 0; i--) update(); }
        else if (POSES[name]) { f.setState(name); f.t = parseInt(at || '0', 10); }
      }
    }
    if (params.has('freeze')) { render(0); return; }   // one still frame, for screenshots
    Sound.load('ihih', 'assets/ihih.wav');
    Sound.load('eerie', 'assets/eerie.wav');
    Music.load('menu', 'assets/menu.mp3', 0.5);
    Music.load('fight', 'assets/fight.mp3', 0.45);
    // the opening scene is set directly, so run its enter() by hand to start its music
    if (SCENES[G.scene].enter) SCENES[G.scene].enter();
    requestAnimationFrame(t => { last = t; loop(t); });
  }

  const fontReady = document.fonts ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
  Promise.race([fontReady, new Promise(r => setTimeout(r, 1500))]).then(start, start);
})();
