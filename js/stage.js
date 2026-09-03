'use strict';
// The Miami sunset stage. The static parts are drawn once into a cache; only the sea shimmer
// and the floor grid move.

const Stage = (() => {
  const HZ = 150;       // horizon
  const FLOOR = 166;    // where the floor grid starts
  let cache = null;

  function pixelLine(ctx, x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function rng(seed) {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  function palm(c, bx, tx, ty, lean) {
    c.fillStyle = '#0b0220';
    // trunk
    const n = 30;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const x = Math.round(bx + (tx - bx) * k + Math.sin(k * Math.PI) * lean);
      const y = Math.round(GROUND_PX + 4 + (ty - GROUND_PX - 4) * k);
      c.fillRect(x - 2, y, 5 - Math.round(k * 2), 3);
    }
    // fronds: thick drooping strokes fanning out from the crown
    for (let i = 0; i < 9; i++) {
      const a = (-174 + i * 23) * Math.PI / 180;
      const p0 = [tx, ty - 1];
      const p1 = [Math.round(tx + Math.cos(a) * 14), Math.round(ty - 4 + Math.sin(a) * 6)];
      const p2 = [Math.round(p1[0] + Math.cos(a) * 11), Math.round(p1[1] + 6 + Math.abs(Math.sin(a)) * 3)];
      const p3 = [Math.round(p2[0] + Math.cos(a) * 6), Math.round(p2[1] + 10)];
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        pixelLine(c, p0[0] + ox, p0[1] + oy, p1[0] + ox, p1[1] + oy);
        pixelLine(c, p1[0] + ox, p1[1] + oy, p2[0] + ox, p2[1] + oy);
      }
      for (const [ox, oy] of [[0, 0], [1, 0]]) pixelLine(c, p2[0] + ox, p2[1] + oy, p3[0] + ox, p3[1] + oy);
    }
    c.fillRect(tx - 4, ty - 4, 9, 7);
  }

  function build(ctx) {
    cache = document.createElement('canvas');
    cache.width = W; cache.height = H;
    const c = cache.getContext('2d');
    const cx = W / 2;

    // sky bands
    const bands = ['#0d0323', '#1a0640', '#2e0a5e', '#4b0f6f', '#731876', '#9e1f7a', '#c9297a', '#ef3a6e', '#ff6a55', '#ff9a4a', '#ffc44f'];
    const bh = HZ / bands.length;
    bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1); });

    // stars
    const r = rng(7);
    for (let i = 0; i < 60; i++) {
      c.fillStyle = i % 4 ? '#8a6bd6' : '#ffffff';
      c.fillRect(Math.floor(r() * W), Math.floor(r() * 60), 1, 1);
    }

    // sun with the classic cut stripes, setting into the sea
    const cy = 122, R = 44;
    for (let y = cy - R; y <= cy + R; y++) {
      const dy = y - cy, half = Math.floor(Math.sqrt(R * R - dy * dy));
      if (dy > 2 && ((dy - 2) % 8) < Math.min(5, 1 + (dy >> 3))) continue;
      const k = (dy + R) / (2 * R);
      c.fillStyle = k < 0.35 ? '#fff1a0' : k < 0.6 ? '#ffd35c' : k < 0.8 ? '#ff8f5a' : '#ff4f8f';
      c.fillRect(cx - half, y, half * 2 + 1, 1);
    }

    // skyline on both sides
    const cr = rng(3);
    for (let x = 0; x < W;) {
      const w = 8 + Math.floor(cr() * 16), h = 10 + Math.floor(cr() * 38);
      if (x > 118 && x < 262) { x += 4; continue; }
      c.fillStyle = '#1a0838';
      c.fillRect(x, HZ - h, w, h);
      for (let wy = HZ - h + 2; wy < HZ - 2; wy += 3)
        for (let wx = x + 1; wx < x + w - 1; wx += 3)
          if (cr() < 0.3) { c.fillStyle = cr() < 0.5 ? '#ffd35c' : '#3ee8ff'; c.fillRect(wx, wy, 1, 1); }
      x += w + 1 + Math.floor(cr() * 3);
    }

    // sea
    c.fillStyle = '#2a0b4d';
    c.fillRect(0, HZ, W, FLOOR - HZ);
    const sr = rng(5);
    for (let y = HZ + 1; y < FLOOR; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const nearSun = Math.abs(x - cx) < 34 + (y - HZ) * 1.8;
        if (sr() < (nearSun ? 0.45 : 0.18)) {
          c.fillStyle = nearSun ? '#ff6f9f' : '#5a1a8a';
          c.fillRect(x, y, 1 + Math.floor(sr() * 3), 1);
        }
      }
    }

    // floor with rays toward the vanishing point
    c.fillStyle = '#120626';
    c.fillRect(0, FLOOR, W, H - FLOOR);
    c.fillStyle = '#7a1c74';
    for (let k = -9; k <= 9; k++) {
      pixelLine(c, cx + k * 3, FLOOR + 1, cx + k * 42, H - 1);
    }
    c.fillStyle = '#3ee8ff';
    c.fillRect(0, FLOOR, W, 1);

    palm(c, 36, 64, 64, 12);
    palm(c, 350, 322, 68, -12);
  }

  function draw(ctx, t) {
    if (!cache) build(ctx);
    ctx.drawImage(cache, 0, 0);
    // sea shimmer
    ctx.fillStyle = '#ff9fc4';
    for (let i = 0; i < 7; i++) {
      const y = HZ + 2 + i * 2 + ((i * 7 + (t >> 2)) % 2);
      const x = W / 2 + Math.round(Math.sin(t * 0.03 + i) * (12 + i * 6));
      ctx.fillRect(x - 2, y, 4, 1);
    }
    // floor grid scrolling toward the viewer
    const phase = (t % 40) / 40;
    ctx.fillStyle = '#ff2fb0';
    for (let i = 0; i < 8; i++) {
      const k = (i + phase) / 8;
      const y = FLOOR + Math.round(k * k * (H - FLOOR));
      if (y > FLOOR + 1) ctx.fillRect(0, y, W, 1);
    }
  }

  return { draw };
})();
