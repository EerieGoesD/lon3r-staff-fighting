'use strict';
// Sprite rig: draws a character from cut-out body parts instead of the code-drawn puppet.
// The parts and their joints come from assets/<id>/rig.json (see scratchpad/cutout.py).
// It is fed the same pose angles as the puppet, so every animation works unchanged.

const Rig = (() => {
  const rigs = {};

  // rig.json is loaded through a script tag on file://, so the data is passed in directly
  function define(id, meta, dir) {
    const parts = {};
    for (const name in meta.parts) {
      const p = Object.assign({}, meta.parts[name]);
      p.img = new Image();
      p.img.src = dir + name + '.png';
      p.variants = {};
      parts[name] = p;
    }
    rigs[id] = { meta, parts, ready: false };
    return rigs[id];
  }

  // A recoloured copy of a part: 'dark' for the far arm, 'white' for the hit flash.
  function variant(part, kind) {
    if (part.variants[kind]) return part.variants[kind];
    const c = document.createElement('canvas');
    c.width = part.w; c.height = part.h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(part.img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = kind === 'white' ? '#ffffff' : 'rgba(0,0,0,0.45)';
    g.fillRect(0, 0, part.w, part.h);
    part.variants[kind] = c;
    return c;
  }

  function rot(v, deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
  }

  // Draws one part with its pivot at (x, y), rotated by deg (positive = backwards).
  function piece(ctx, part, x, y, deg, kind) {
    const img = kind ? variant(part, kind) : part.img;
    if (!part.img.complete || !part.img.naturalWidth) return;
    ctx.save();
    ctx.translate(x, y);
    if (deg) ctx.rotate(deg * Math.PI / 180);   // canvas y points down, so positive turns the part backwards
    ctx.drawImage(img, Math.round(-part.px), Math.round(-part.py));
    ctx.restore();
  }

  // pose uses the same fields as the puppet: torso, armF/armB [shoulder, elbow], legF/legB, hipY...
  function draw(ctx, ch, pose, ox, oy, facing, flash) {
    const rig = rigs[ch.rig];
    if (!rig) return false;
    const m = rig.meta, P = rig.parts, J = m.joints, R = m.rest;
    const kind = flash ? 'white' : null;

    ctx.save();
    ctx.translate(Math.round(ox), Math.round(oy));
    ctx.scale(facing, 1);

    // the hip sits above the feet; the pose's own hip height nudges it (crouch, jump, plunge)
    const lift = (pose.hipY - 26) * SC;
    const hip = [pose.hipX * SC, -J.hipAboveFeet - lift];

    const put = (name, jx, jy, deg, k) => piece(ctx, P[name], jx, jy, deg, k);
    const leg = (tag, a, k) => {
      const th = -a[0], sh = -a[1];
      put('thigh' + tag, hip[0], hip[1], th, k);
      const d = rot(J.hipToKnee, th);
      put('shin' + tag, hip[0] + d[0], hip[1] + d[1], th + sh, k);
    };
    const arm = (a, k) => {
      const up = R.armU - a[0];
      const [sx, sy] = rot(J.hipToShoulder, -pose.torso);
      put('armU', hip[0] + sx, hip[1] + sy, up, k);
      const d = rot(J.shoulderToElbow, up);
      put('armF', hip[0] + sx + d[0], hip[1] + sy + d[1], R.armF - a[1] + up - R.armU, k);
    };

    // only the near arm is drawn: in this side view the far arm is hidden by the body,
    // which is how the source sprite is drawn too
    leg('B', pose.legB, kind || 'dark');
    put('torso', hip[0], hip[1], -pose.torso, kind);
    const n = rot(J.hipToNeck, -pose.torso);
    put('head', hip[0] + n[0] + pose.headX * SC, hip[1] + n[1] - pose.headY * SC,
        -pose.torso - (pose.headRot ? 90 : 0), kind);
    leg('F', pose.legF, kind);
    arm(pose.armF, kind);
    ctx.restore();
    return true;
  }

  function has(ch) { return !!(ch.rig && rigs[ch.rig]); }

  return { define, draw, has };
})();
