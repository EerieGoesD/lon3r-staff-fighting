'use strict';
// Screens: title -> select -> vs -> fight (rounds, KO, result).

const G = {
  scene: 'title', t: 0,
  sel: [0, 1], locked: [false, false],
  chars: [CHARACTERS[0], CHARACTERS[1]],
  fighters: [],
  round: 1, wins: [0, 0], phase: 'intro', timer: 99, timerTick: 0, roundWinner: -1,
  hitstop: 0, shake: 0, shakeAmp: 2, flash: 0, particles: [], waves: [],
  armed: false, touch: false, cpu: false, portraits: {},
};

function goScene(name) {
  G.scene = name;
  G.t = 0;
  if (SCENES[name].enter) SCENES[name].enter();
}

function text(ctx, str, x, y, size, color, align = 'center', fx = null) {
  ctx.font = size + 'px "Press Start 2P"';
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (fx === 'neon') {
    ctx.fillStyle = '#3ee8ff'; ctx.fillText(str, x - 1, y);
    ctx.fillStyle = '#ff2fb0'; ctx.fillText(str, x + 1, y + 1);
  } else if (fx === 'shadow') {
    ctx.fillStyle = '#12052a'; ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function frame(ctx, x, y, w, h, thick, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, thick);
  ctx.fillRect(x, y + h - thick, w, thick);
  ctx.fillRect(x, y, thick, h);
  ctx.fillRect(x + w - thick, y, thick, h);
}

function shake(ticks, amp) {
  if (ticks > G.shake) G.shake = ticks;
  if (amp > G.shakeAmp || G.shake === ticks) G.shakeAmp = amp;
}

// ---------- particles / hit sparks (screen coordinates) ----------
function spark(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, g: 0.3, life: 10 + Math.random() * 8, color });
  }
  G.particles.push({ x, y, vx: 0, vy: 0, g: 0, life: 5, color: '#ffffff', star: true });
}

// energy drifting into the head while charging the beam
function energy(f) {
  const [sx, sy] = f.screenPos(1);
  const headY = sy - 112;
  const k = f.t / SPECIAL.fire;
  const r = 50 * (1 - k * k) + 10;
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    const x = sx + Math.cos(a) * r * 1.3, y = sy - Math.random() * 20 + Math.sin(a) * r * 0.3;
    const dx = sx - x, dy = headY - y, d = Math.hypot(dx, dy) || 1;
    const sp = 2.5 + k * 3;
    G.particles.push({ x, y, vx: dx / d * sp, vy: dy / d * sp, g: 0, life: Math.round(d / sp), color: i ? '#ff2a4a' : '#ffffff' });
  }
}

// dust kicked up when the keyboard hits the floor
function dust(x, y, count) {
  for (let i = 0; i < count; i++) {
    const s = 1.5 + Math.random() * 4, dir = Math.random() < 0.5 ? -1 : 1;
    G.particles.push({ x, y, vx: dir * s, vy: -Math.random() * 3.5, g: 0.18, life: 14 + Math.random() * 12, color: i % 3 ? '#8a6bd6' : '#ffffff' });
  }
}

function smoke(x, y) {
  G.particles.push({ x, y, vx: (Math.random() - 0.5) * 0.3, vy: -0.5 - Math.random() * 0.3, g: -0.01, life: 40 + Math.random() * 20, color: '#8d8a99', soft: true });
}

function updateParticles() {
  for (const p of G.particles) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--;
    if (p.soft) p.vx += (Math.random() - 0.5) * 0.15;
  }
  G.particles = G.particles.filter(p => p.life > 0);
  for (const w of G.waves) w.t++;
  G.waves = G.waves.filter(w => w.t < 18);
}

function drawParticles(ctx) {
  for (const p of G.particles) {
    ctx.fillStyle = p.color;
    if (p.star) {
      const r = (6 - p.life) * 2;
      ctx.fillRect(p.x - r, p.y - 2, r * 2 + 2, 4);
      ctx.fillRect(p.x - 2, p.y - r, 4, r * 2 + 2);
    } else if (p.soft) {
      ctx.globalAlpha = Math.min(0.6, p.life / 40);
      const s = p.life > 30 ? 2 : 3;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      ctx.globalAlpha = 1;
    } else {
      const s = p.life > 6 ? 3 : 2;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
  }
  for (const w of G.waves) {
    ctx.globalAlpha = 1 - w.t / 18;
    ctx.fillStyle = w.t % 2 ? '#ffffff' : '#ff7a1a';
    pixelEllipse(ctx, w.x, w.y, 10 + w.t * 6, 3 + w.t * 1.2);
    ctx.globalAlpha = 1;
  }
}

// ---------- special move visuals ----------
function pixelEllipse(ctx, cx, cy, rx, ry) {
  const n = Math.max(12, Math.round(rx));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 2, 1);
  }
}

function drawCharge(ctx, f, alpha) {
  const t = f.t + alpha;
  const [sx, sy] = f.screenPos(alpha);
  const headY = sy - 112;
  const k = Math.min(1, t / SPECIAL.fire), ease = k * k;
  const r = 50 * (1 - ease) + 8;
  ctx.save();
  // ring of light on the floor closing in
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 0.4);
  ctx.fillStyle = '#ff2a4a';
  pixelEllipse(ctx, sx, sy + 2, r * 1.3, r * 0.3);
  ctx.fillStyle = '#ffffff';
  pixelEllipse(ctx, sx, sy + 2, r * 1.3 - 3, r * 0.3 - 1);
  // columns of light around the body, converging on the head
  const bottom = sy - ease * (sy - headY - 16);
  const top = headY - 46 + ease * 30;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + t * 0.05;
    const x = Math.round(sx + Math.cos(a) * r * 1.2);
    const depth = Math.sin(a);   // columns behind the body are dimmer
    ctx.globalAlpha = (0.3 + 0.3 * (depth + 1) / 2) * (0.7 + 0.3 * Math.sin(t * 0.5 + i));
    ctx.fillStyle = i % 2 ? '#ff2a4a' : '#ffffff';
    ctx.fillRect(x - 1, Math.round(top), 3, Math.round(bottom - top));
  }
  // glow on the head at the end of the charge
  if (k > 0.6) {
    ctx.globalAlpha = (k - 0.6) / 0.4 * 0.7;
    ctx.fillStyle = '#ffffff';
    const g = 18 + Math.sin(t * 0.6) * 3;
    pixelEllipse(ctx, sx, headY, g, g);
    pixelEllipse(ctx, sx, headY, g - 4, g - 4);
  }
  ctx.restore();
}

function lightning(ctx, x0, y0, x1, y1, jag, color) {
  ctx.fillStyle = color;
  const n = 10;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const nx = x0 + (x1 - x0) * i / n, ny = y0 + (y1 - y0) * i / n + (i === n ? 0 : (Math.random() - 0.5) * jag);
    const steps = Math.ceil(Math.abs(nx - px) / 2) || 1;
    for (let s = 0; s <= steps; s++) ctx.fillRect(Math.round(px + (nx - px) * s / steps), Math.round(py + (ny - py) * s / steps), 2, 2);
    px = nx; py = ny;
  }
}

function drawBeam(ctx, f, alpha) {
  const bt = f.t + alpha - SPECIAL.fire;
  const [sx, sy] = f.screenPos(alpha);
  const hx = sx + f.facing * 30, hy = sy - 66;
  const len = Math.min(W, 24 + bt * 70);
  const x0 = f.facing === 1 ? hx : hx - len;
  ctx.save();
  const fade = SPECIAL.beamEnd - SPECIAL.fire - bt;
  ctx.globalAlpha = fade < 12 ? Math.max(0, fade / 12) : 1;
  for (let x = 0; x < len; x += 4) {
    const wob = Math.sin(bt * 0.7 + x * 0.06) * 3;
    ctx.fillStyle = '#12030a'; ctx.fillRect(x0 + x, Math.round(hy - 22 + wob), 4, 44);
    ctx.fillStyle = '#c40f2e'; ctx.fillRect(x0 + x, Math.round(hy - 15 + wob), 4, 30);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + x, Math.round(hy - 6 + wob * 0.5), 4, 12);
  }
  // crackling arcs riding the beam
  for (let i = 0; i < 3; i++) {
    const a = x0 + Math.random() * len * 0.8, b = a + 30 + Math.random() * 60;
    const yo = (Math.random() - 0.5) * 30;
    lightning(ctx, a, hy + yo, Math.min(x0 + len, b), hy - yo, 14, i ? '#ffffff' : '#ff2a4a');
  }
  // orb at the hands
  const rr = 16 + Math.sin(bt * 0.8) * 3;
  for (let y = -rr; y <= rr; y++) {
    const half = Math.sqrt(rr * rr - y * y);
    ctx.fillStyle = '#12030a'; ctx.fillRect(Math.round(hx - half - 2), Math.round(hy + y), Math.round(half * 2 + 4), 1);
    ctx.fillStyle = '#c40f2e'; ctx.fillRect(Math.round(hx - half), Math.round(hy + y), Math.round(half * 2), 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(hx - half * 0.65), Math.round(hy + y), Math.round(half * 1.3), 1);
  }
  ctx.restore();
}

// orange energy around HMSI while he winds up the plunge
function windupGlow(ctx, f, alpha) {
  const sp = f.sp;
  if (!sp || sp.phase !== 'windup') return;
  const [sx, sy] = f.screenPos(alpha);
  const k = Math.min(1, (sp.t + alpha) / PLUNGE.windup);
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.35 * k;
  ctx.fillStyle = '#ff7a1a';
  pixelEllipse(ctx, sx, sy + 2, 30 + k * 10, 7 + k * 2);
  ctx.fillStyle = '#ffffff';
  pixelEllipse(ctx, sx, sy + 2, 24 + k * 10, 5 + k * 2);
  ctx.restore();
}

// ---------- fight helpers ----------
function startRound() {
  const [a, b] = G.fighters;
  a.reset(); b.reset();
  G.phase = 'intro'; G.t = 0; G.timer = 99; G.timerTick = 0; G.roundWinner = -1;
  G.particles = []; G.waves = []; G.hitstop = 0; G.shake = 0; G.flash = 0;
}

function checkHit(att, def) {
  const hb = att.hitbox();
  if (!hb) return;
  const hurt = def.hurtbox();
  if (!hurt || !boxesOverlap(hb, hurt)) return;
  att.hitDone = true;
  const dir = def.x < att.x ? -1 : 1;
  const cx = toScreenX((Math.max(hb.l, hurt.l) + Math.min(hb.r, hurt.r)) / 2);
  const cy = toScreenY((Math.max(hb.b, hurt.b) + Math.min(hb.t, hurt.t)) / 2);
  const a = att.attackData();
  const big = !!a.special;
  const canBlock = def.blocking && !def.airborne && (def.state === 'walk' || def.state === 'crouch' || def.state === 'idle');
  if (canBlock) {
    def.takeBlock(a, dir);
    G.hitstop = big ? 4 : 3;
    spark(cx, cy, '#3ee8ff', big ? 10 : 4);
  } else {
    const armored = def.state === 'special';
    def.takeHit(a, dir);
    if (!armored) {
      G.hitstop = def.hp <= 0 ? 12 : big ? 8 : 5;
      shake(def.hp <= 0 ? 14 : 6, big ? 4 : 2);
    }
    spark(cx, cy, '#ffe14a', big ? 16 : 8);
    spark(cx, cy, att.beam ? '#ff2a4a' : '#ff2fb0', big ? 8 : 4);
  }
}

function drawHud(ctx) {
  const [a, b] = G.fighters;
  const barW = W / 2 - 30;
  for (const f of [a, b]) {
    const left = f.side === 0;
    const x0 = left ? 14 : W - 14 - barW;
    ctx.fillStyle = '#1d0b33'; ctx.fillRect(x0, 9, barW, 7);
    const shown = Math.round(barW * f.hpShown / 100), hp = Math.round(barW * f.hp / 100);
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(left ? x0 : x0 + barW - shown, 10, shown, 5);
    ctx.fillStyle = f.hp > 30 ? '#ffe14a' : '#ff7a2f'; ctx.fillRect(left ? x0 : x0 + barW - hp, 10, hp, 5);
    frame(ctx, x0 - 1, 8, barW + 2, 9, 1, '#f4f2ee');
    text(ctx, f.ch.name, left ? x0 : x0 + barW, 19, 8, f.ch.accent, left ? 'left' : 'right', 'shadow');
    for (let i = 0; i < 2; i++) {
      const wx = left ? x0 + barW - 12 + i * 7 : x0 + 7 - i * 7;
      ctx.fillStyle = G.wins[f.side] > i ? '#ff2fb0' : '#2a1345';
      ctx.fillRect(wx, 20, 5, 5);
    }
    // special move availability
    const ready = !f.specialUsed;
    const blink = ready && (G.t >> 4) % 2 === 0;
    text(ctx, 'SP', left ? x0 : x0 + barW, 30, 8, ready ? (blink ? '#ffffff' : '#3ee8ff') : '#3a2a55', left ? 'left' : 'right', 'shadow');
  }
  text(ctx, String(G.timer).padStart(2, '0'), W / 2, 6, 16, G.timer <= 10 ? '#ff3b3b' : '#f4f2ee', 'center', 'shadow');
}

function bigText(ctx, str, y, color) {
  text(ctx, str, W / 2, y, 16, color, 'center', 'neon');
}

// ---------- scenes ----------
const SCENES = {
  title: {
    enter() { Music.play('menu'); },
    update() {
      // the first key press only wakes the sound up, so the song starts here on the menu
      if (!G.armed) { if (Input.anyPressed()) G.armed = true; return; }
      if (Input.pressed('Enter') || Input.pressed('KeyF') || Input.pressed('KeyK') || Input.pressed('Space')) {
        Sound.sfx.confirm();
        goScene('select');
      }
    },
    render(ctx) {
      Stage.draw(ctx, G.t);
      ctx.fillStyle = 'rgba(6,2,15,0.55)';
      ctx.fillRect(0, 0, W, H);
      const flicker = Math.random() < 0.06 ? 0.6 : 1;
      ctx.globalAlpha = flicker;
      text(ctx, 'LON3R', W / 2, 46, 32, '#f4f2ee', 'center', 'neon');
      ctx.globalAlpha = 1;
      text(ctx, 'STAFF FIGHTING', W / 2, 90, 8, '#ffe14a', 'center', 'shadow');
      const prompt = G.armed ? (G.touch ? 'TAP TO PLAY' : 'PRESS ENTER') : (G.touch ? 'TAP TO START' : 'PRESS ANY KEY');
      if ((G.t >> 5) % 2 === 0) text(ctx, prompt, W / 2, 142, 8, '#f4f2ee', 'center', 'shadow');
      text(ctx, G.touch ? 'VS THE COMPUTER' : '2 PLAYERS  ONE KEYBOARD', W / 2, 196, 8, '#8a6bd6', 'center', 'shadow');
    },
  },

  select: {
    enter() { G.locked = [false, false]; Music.play('menu'); },
    update() {
      for (let p = 0; p < 2; p++) {
        if (p === 1 && G.cpu) {
          // the computer takes the other fighter and is ready when you are
          G.sel[1] = (G.sel[0] + 1) % CHARACTERS.length;
          G.locked[1] = G.locked[0];
          continue;
        }
        const k = KEYS[p];
        if (G.locked[p]) {
          if (Input.pressed(k.kick)) { G.locked[p] = false; Sound.sfx.back(); }
          continue;
        }
        if (Input.pressed(k.right)) { G.sel[p] = (G.sel[p] + 1) % CHARACTERS.length; Sound.sfx.move(); }
        if (Input.pressed(k.left)) { G.sel[p] = (G.sel[p] + CHARACTERS.length - 1) % CHARACTERS.length; Sound.sfx.move(); }
        if (Input.pressed(k.punch) || Input.pressed('Enter')) {
          G.locked[p] = true;
          Sound.sfx.confirm();
        }
      }
      if (Input.pressed('Escape')) goScene('title');
      if (G.locked[0] && G.locked[1]) {
        G.chars = [CHARACTERS[G.sel[0]], CHARACTERS[G.sel[1]]];
        goScene('vs');
      }
    },
    render(ctx) {
      ctx.fillStyle = '#12052a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#25104a';
      for (let y = 0; y < H; y += 12) ctx.fillRect(0, y, W, 1);
      for (let x = 0; x < W; x += 12) ctx.fillRect(x, 0, 1, H);

      text(ctx, 'SELECT CHARACTER', W / 2, 8, 8, '#f4f2ee', 'center', 'neon');

      // the two portraits face each other
      const pw = 120, ph = 140, py = 22;
      for (let p = 0; p < 2; p++) {
        const ch = CHARACTERS[G.sel[p]];
        const px = p === 0 ? 12 : W - 12 - pw;
        const img = G.portraits[ch.id];
        ctx.fillStyle = ch.portraitBg;
        ctx.fillRect(px, py, pw, ph);
        if (img && img.complete && img.naturalWidth) {
          ctx.save();
          if (p === 0) { ctx.translate(px + pw, py); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, pw, ph); }
          else ctx.drawImage(img, px, py, pw, ph);
          ctx.restore();
        }
        const col = p === 0 ? '#3ee8ff' : '#ff2fb0';
        frame(ctx, px - 1, py - 1, pw + 2, ph + 2, 1, G.locked[p] ? '#f4f2ee' : col);
        text(ctx, ch.name, px + pw / 2, py + ph + 4, 8, col, 'center', 'shadow');
        const tag = p === 1 && G.cpu ? 'CPU' : (p + 1) + 'P';
        text(ctx, G.locked[p] ? tag + ' READY' : tag, px + pw / 2, py + ph + 15, 8, G.locked[p] ? '#f4f2ee' : '#8a6bd6', 'center', 'shadow');
      }

      // pick boxes in the middle
      const boxW = 44, gap = 10;
      const startX = W / 2 - (CHARACTERS.length * boxW + (CHARACTERS.length - 1) * gap) / 2;
      const boxY = 62;
      CHARACTERS.forEach((ch, i) => {
        const x = startX + i * (boxW + gap);
        ctx.fillStyle = ch.portraitBg;
        ctx.fillRect(x, boxY, boxW, boxW);
        drawHead(ctx, ch, x + boxW / 2 - ch.headAnchor, boxY + boxW - ch.head.length - 2, 1, 1);
        frame(ctx, x, boxY, boxW, boxW, 1, '#3a1d5e');
        text(ctx, ch.name, x + boxW / 2, boxY + boxW + 6, 8, '#f4f2ee', 'center', 'shadow');
      });
      for (let p = 1; p >= 0; p--) {
        const x = startX + G.sel[p] * (boxW + gap);
        const off = p === 0 ? 2 : 5;
        const col = p === 0 ? '#3ee8ff' : '#ff2fb0';
        frame(ctx, x - off, boxY - off, boxW + off * 2, boxW + off * 2, 2, col);
        text(ctx, p === 1 && G.cpu ? 'CPU' : (p + 1) + 'P', p === 0 ? x - off : x + boxW + off, boxY - 12, 8, col, p === 0 ? 'left' : 'right', 'shadow');
      }
      if (G.touch) {
        text(ctx, 'DPAD PICK  PUNCH CONFIRM', W / 2, 200, 8, '#8a6bd6', 'center');
      } else {
        text(ctx, 'P1  WASD MOVE  F PUNCH  G KICK  H SPECIAL', W / 2, 194, 8, '#8a6bd6', 'center');
        text(ctx, 'P2  ARROWS     K PUNCH  L KICK  ; SPECIAL', W / 2, 205, 8, '#8a6bd6', 'center');
      }
    },
  },

  vs: {
    update() {
      if (G.t >= 80) goScene('fight');
    },
    render(ctx) {
      ctx.fillStyle = '#12052a';
      ctx.fillRect(0, 0, W, H);
      const [a, b] = G.chars;
      ctx.fillStyle = a.portraitBg; ctx.fillRect(0, 60, W / 2 - 10, 110);
      ctx.fillStyle = b.portraitBg; ctx.fillRect(W / 2 + 10, 60, W / 2 - 10, 110);
      drawFighter(ctx, a, POSES.idle(G.t), 96, 168, 1, null);
      drawFighter(ctx, b, POSES.idle(G.t), W - 96, 168, -1, null);
      text(ctx, a.name, 96, 178, 8, '#3ee8ff', 'center', 'shadow');
      text(ctx, b.name, W - 96, 178, 8, '#ff2fb0', 'center', 'shadow');
      if (G.t > 20) bigText(ctx, 'VS', 100, '#f4f2ee');
    },
  },

  fight: {
    enter() {
      G.fighters = [new Fighter(G.chars[0], KEYS[0], 0), new Fighter(G.chars[1], KEYS[1], 1)];
      G.fighters[1].cpu = G.cpu;
      G.round = 1; G.wins = [0, 0];
      startRound();
      Music.play('fight');
    },
    update() {
      const [a, b] = G.fighters;
      const control = G.phase === 'fight' || (G.phase === 'intro' && G.t >= 75);
      a.readInput(control, b); b.readInput(control, a);
      if (G.shake > 0) G.shake--;
      if (G.flash > 0) G.flash--;

      if (G.hitstop > 0) {
        G.hitstop--;
      } else {
        a.update(b); b.update(a);
        separate(a, b);
        if (control) { checkHit(a, b); checkHit(b, a); }
        for (const f of [a, b]) {
          if (f.charging) { shake(2, 1); if (f.t % 2 === 0) energy(f); }
          if (f.state === 'special' && f.beam && f.t === SPECIAL.fire) { G.flash = 4; shake(24, 4); Sound.sfx.beam(); }
          if (f.firing) shake(2, 1.5);
          if (f.slamFx) {
            f.slamFx = false;
            const [sx, sy] = f.screenPos(1);
            shake(20, 4); G.flash = 2;
            G.waves.push({ x: sx + f.facing * 26, y: sy + 2, t: 0 });
            dust(sx + f.facing * 26, sy, 18);
          }
          if (f.ch.cigarette && G.t % 14 === 0 && !f.airborne && (f.state === 'idle' || f.state === 'walk' || f.state === 'crouch' || f.state === 'attack' || f.state === 'win')) {
            const [sx, sy] = f.screenPos(1);
            const tip = cigaretteTip(f.ch, f.pose(1), sx, sy, f.facing);
            if (tip) smoke(tip[0], tip[1] - 1);
          }
        }
        updateParticles();
      }

      switch (G.phase) {
        case 'intro':
          if (G.t === 10) Sound.sfx.round();
          if (G.t === 70) Sound.sfx.fight();
          if (G.t >= 110) { G.phase = 'fight'; G.t = 0; }
          break;
        case 'fight':
          if (++G.timerTick >= 60) { G.timerTick = 0; if (G.timer > 0) G.timer--; }
          if (a.hp <= 0 || b.hp <= 0) {
            G.phase = 'ko'; G.t = 0;
            G.roundWinner = a.hp <= 0 && b.hp <= 0 ? -1 : a.hp <= 0 ? 1 : 0;
          } else if (G.timer <= 0) {
            G.phase = 'timeover'; G.t = 0;
            G.roundWinner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
          }
          if (G.roundWinner >= 0) G.wins[G.roundWinner]++;
          break;
        case 'ko': case 'timeover':
          if (G.t === 40 && G.roundWinner >= 0) {
            const w = G.fighters[G.roundWinner];
            w.attack = null; w.sp = null; w.setState('win');
          }
          if (G.t >= 170) {
            if (G.wins[0] >= 2 || G.wins[1] >= 2) { G.phase = 'result'; G.t = 0; }
            else { G.round++; startRound(); }
          }
          break;
        case 'result':
          if (Input.pressed('Enter') || Input.pressed('KeyF') || Input.pressed('KeyK')) { Sound.sfx.confirm(); G.round = 1; G.wins = [0, 0]; startRound(); }
          break;
      }
      if (Input.pressed('Escape')) goScene('select');
    },
    render(ctx, alpha) {
      const [a, b] = G.fighters;
      ctx.save();
      if (G.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 2 * G.shakeAmp), Math.round((Math.random() - 0.5) * 1.5 * G.shakeAmp));
      Stage.draw(ctx, G.t + G.round * 1000);
      const al = G.hitstop > 0 ? 0 : alpha;
      for (const f of [a, b]) {
        if (f.charging) drawCharge(ctx, f, al);
        if (f.state === 'special' && !f.beam) windupGlow(ctx, f, al);
      }
      // draw the attacker last so the hit lands on top; a flying plunge is always on top
      let order = a.attack && !b.attack ? [b, a] : [a, b];
      if (b.state === 'special' && !b.beam) order = [a, b];
      if (a.state === 'special' && !a.beam) order = [b, a];
      for (const f of order) f.draw(ctx, al);
      for (const f of [a, b]) if (f.firing) drawBeam(ctx, f, al);
      drawParticles(ctx);
      ctx.restore();
      if (G.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (G.flash / 5) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      drawHud(ctx);

      if (G.phase === 'intro') {
        if (G.t >= 10 && G.t < 70) bigText(ctx, 'ROUND ' + G.round, 46, '#f4f2ee');
        else if (G.t >= 70 && G.t < 105) bigText(ctx, 'FIGHT!', 46, '#ffe14a');
        if (G.t < 70) for (const f of [a, b]) text(ctx, (f.side + 1) + 'P', f.screenPos(1)[0], GROUND_PX - 140, 8, f.side === 0 ? '#3ee8ff' : '#ff2fb0', 'center', 'shadow');
      }
      if ((G.phase === 'ko' || G.phase === 'timeover') && G.t < 80) {
        bigText(ctx, G.phase === 'ko' ? 'K.O.' : 'TIME OVER', 46, G.phase === 'ko' ? '#ff3b3b' : '#f4f2ee');
      }
      if ((G.phase === 'ko' || G.phase === 'timeover') && G.t >= 80 && G.roundWinner < 0) bigText(ctx, 'DRAW', 46, '#f4f2ee');
      if (G.phase === 'result') {
        ctx.fillStyle = 'rgba(6,2,15,0.6)';
        ctx.fillRect(0, 44, W, 74);
        const w = G.wins[0] >= 2 ? a : b;
        bigText(ctx, w.ch.name + ' WINS', 56, w.ch.accent);
        if ((G.t >> 4) % 2 === 0) text(ctx, G.touch ? 'PUNCH: REMATCH' : 'ENTER: REMATCH', W / 2, 88, 8, '#f4f2ee', 'center', 'shadow');
        text(ctx, G.touch ? 'MENU: CHARACTER SELECT' : 'ESC: CHARACTER SELECT', W / 2, 102, 8, '#8a6bd6', 'center', 'shadow');
      }
    },
  },
};
