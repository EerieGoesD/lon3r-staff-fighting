'use strict';
// Pixel puppet characters. A character is a set of colours plus a head map cut out of the
// reference pictures (scratchpad/faces.py). Bodies are built from thick pixel lines (limbs)
// so every pose is a handful of angles, which lets animations interpolate smoothly at any
// refresh rate. Everything is authored facing right: local x = forward, local y = up from
// the feet. Body geometry is in game units; it is drawn SC times bigger on screen.

const SC = 2;
const OUTLINE = '#0a0314';

// Generated from the reference pictures (scratchpad/faces.py).
const CRIPTA_FACE = {
  anchor: 13, tip: [28, 26],
  palette: {"a": "#7b3728", "b": "#522720", "c": "#9f3333", "d": "#d72f4c", "e": "#c75334", "f": "#ca6237", "g": "#d06e3c", "h": "#ce6b3c", "i": "#b95634", "j": "#9c5031", "k": "#d08b53", "l": "#130509", "m": "#1e0c0f", "n": "#6d201e", "o": "#411015", "p": "#471917", "q": "#020101"},
  map: [
    '..............a...............',
    '............bcdeef............',
    '...........addeeggggg.........',
    '..........cddeehgggggg........',
    '.........cddeedggfffggg.......',
    '........cddeijiffghfffg.......',
    '.......kddecbbllmbigghig......',
    '......kjdenmmlbblllbhgihf.....',
    '.....kkddbmopqbmqmplljfhg.....',
    '....kkjcpllomqqlqbbmlmajj.....',
    '....aabomncioqqqqlqqlmmlll....',
    '...acninddhhblqqqqqlmjplll....',
    '...cnojcddfhiollqqloihnljm....',
    '..ocibpcddfhffjnombieiblll....',
    '..ocaoicddehffggggiihhaqqq....',
    '...camacdeegggggghiaaeaqqq....',
    '...aiiaddeihggggggijjnmqqq....',
    '...jaaadeeefggggggginompll....',
    '....kmldeiihggggijjiiponp.....',
    '....jbldeeifggiaabobanb.......',
    '....jnpdeehggggghffajk........',
    '....cdccehggghfecnnjbkk.......',
    '....ndebneggghhfiannnmjkk.....',
    '...cddiammahghgggfcnn.pakk....',
    '...adeifnmqojggghijnnp..bkk...',
    '....dechjolqqbjiiicnnop..ajj..',
    '....ehihhnolqqqmpannnbm....nc.',
    '.....higgjnoqqqqqmbpmp........',
    '.....figghanoqqqqqqqo.........',
    '......fggginbommqqloa.........',
    '.......ggggjnpppmlbb..........',
    '........gghfnnpolpno..........',
    '.........gffanolonb...........',
    '.......gggfjnoqonnb...........',
  ],
};

const HMSI_FACE = {
  anchor: 14, tip: [28, 29],
  palette: {"a": "#723331", "b": "#9f1720", "c": "#7d1316", "d": "#560a0b", "e": "#770d0e", "f": "#38282a", "g": "#e4ab65", "h": "#93604c", "i": "#5d2c2b", "j": "#8a4d3f", "k": "#1a080b", "l": "#33151d", "m": "#8d3637", "n": "#cf7c5f", "o": "#e29671", "p": "#010101", "q": "#d38c6c", "r": "#e59e76", "s": "#c36456"},
  map: [
    '..............................',
    '...............abcc...........',
    '...........accdbececcc........',
    '........aafbceceedeccee.......',
    '........abccddddddeedecd......',
    '......ghicdddeeecebceceed.....',
    '.....gibbedecbbcbebcbcbee.....',
    '.....jibceeeecddcccdbebbbe....',
    '....gjbbeeekekldaijmcdecbe....',
    '....gmbedkkkkkhnnnoojiidbdc...',
    '...gabcdkppplhjanjaqrqsaedd...',
    '...gabekppkliffhllkkiqosjdi...',
    '...gabeppldllkflhfpklknnohha..',
    '..gicbdpldkklmfkfkpjfkfnrnsj..',
    '..ggmelaikklmsikpppfkpflilli..',
    '..ghbdajsiisqrakpppppkllfkkk..',
    '..gjbdhjjqmnornlkpppkfnjkhlp..',
    '...jbdsnansnorrsilkkfnohkkp...',
    '...gclsjaosnnorrqnhhsqoqlpp...',
    '...gidhsansnnqrrrrrssasslpp...',
    '...gmciqqnnnnqrrrrrqhsmilkk...',
    '....hckhrasnnqrrrnjiljifmil...',
    '....jekkfksnnorrjiajhnilhj....',
    '...jbedpilsnqrrrqhaaiailm.....',
    '...acbdlsjmnrrrrrrooqas.......',
    '....mcelnnisorrrqqsijsiq......',
    '...acbdbooaisorroonpkaaiq.....',
    '...jicdsrrsilshhrroahmm.ihr...',
    '....medsrrqmflplhjiiqhmj..aa..',
    '.....iiqorrsafppkppkajha...da.',
    '.....lmqqrrqjalppppppff.......',
    '......mjsorrnmalpppppa........',
    '.......hsrrrosaiillkfj........',
    '........orrrrojaailikf........',
    '.........rrrooqjaliip.........',
    '.........qrrrqqsiiafp.........',
  ],
};

const CRIPTA = {
  id: 'cripta', name: 'CRIPTA', voice: 'ihih', attackSound: null,
  special: 'beam', specialSound: 'eerie', accent: '#ff2fb0', portraitBg: '#3a0a2e', portrait: 'assets/portrait-cripta.png',
  skin: '#d99a62', top: '#121116', topDark: '#0a090c', print: null, sleeve: 'skin',
  pants: '#15141a', pantsLight: '#23222a', legT: [9, 8], armT: 6, torsoScale: 1.15,
  shoes: 'allstar', boots: '#101014', tattoos: true, joints: false, hood: false, zipper: null, belt: null, chain: true,
  weapon: null, cigarette: true, pockets: true,
  headPalette: CRIPTA_FACE.palette, head: CRIPTA_FACE.map, headAnchor: CRIPTA_FACE.anchor, cigTip: CRIPTA_FACE.tip,
  walk: { torso: -5, bob: 1.0, arms: 0 },
};

const HMSI = {
  id: 'hmsi', name: 'HMSI', voice: null, attackSound: 'stab',
  special: 'plunge', specialSound: null, accent: '#ff7a1a', portraitBg: '#3a1a10', portrait: 'assets/portrait-hmsi.png',
  skin: '#d9a273', top: '#1b1a20', topDark: '#0f0e12', print: null, sleeve: 'top',
  pants: '#23222b', pantsLight: '#2e2d37', legT: [8, 7], armT: 5, torsoScale: 1.12,
  shoes: 'sneaker', boots: '#141418', tattoos: false, joints: false, hood: true, zipper: null, belt: '#d6d6de', chain: true,
  weapon: 'keyboard', cigarette: true, pockets: false,
  headPalette: HMSI_FACE.palette, head: HMSI_FACE.map, headAnchor: HMSI_FACE.anchor, cigTip: HMSI_FACE.tip,
  walk: { torso: -6, bob: 1.6, arms: 18 },
};

const CHARACTERS = [CRIPTA, HMSI];

// ---------- geometry ----------
const L = { thigh: 13, shin: 12, upper: 10, fore: 9, torso: 18 };
const rad = d => d * Math.PI / 180;
// Angle measured from straight down, positive toward forward. Returns a unit vector in up-coordinates.
const dirOf = a => [Math.sin(rad(a)), -Math.cos(rad(a))];

const BASE = {
  hipX: 0, hipY: 26, torso: 4, headX: 0, headY: 0, headRot: 0, ground: true, hold: 0, kb: 90, pockets: 0,
  armB: [45, 105], armF: [60, 95],
  legB: [-18, 10], legF: [16, -10],
};
const P = over => Object.assign({}, BASE, over);
const lerp = (a, b, k) => a + (b - a) * k;

function mix(a, b, k) {
  const out = {};
  for (const key in a) {
    const va = a[key], vb = b[key] === undefined ? va : b[key];
    if (Array.isArray(va)) out[key] = [lerp(va[0], vb[0], k), lerp(va[1], vb[1], k)];
    else if (typeof va === 'number') out[key] = lerp(va, vb, k);
    else out[key] = k < 0.5 ? va : vb;
  }
  return out;
}

function keyframes(frames, t) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    if (t <= frames[i][0]) {
      const [t0, p0] = frames[i - 1], [t1, p1] = frames[i];
      return mix(p0, p1, (t - t0) / (t1 - t0));
    }
  }
  return frames[frames.length - 1][1];
}

// ---------- special moves (ticks) ----------
// Beam: the yell has two words, the second starts at 1.76 s (tick 106) and that is when it fires.
const SPECIAL = {
  special: true, fire: 106, beamEnd: 180, total: 198,
  box: { x: 10, y: 22, w: 200, h: 20 }, damage: 24, chip: 6, stun: 30, push: 5,
};
// Plunge: crouch, leap at the opponent and slam the keyboard down.
const PLUNGE = {
  special: true, windup: 24, recover: 30, damage: 24, chip: 6, stun: 30, push: 4.5,
  airBox: { x: 2, y: 0, w: 30, h: 44 }, slamBox: { x: -8, y: 0, w: 48, h: 26 },
};

// ---------- poses (t is in logic ticks, may be fractional; f is the fighter when available) ----------
const PUNCH_HIT = P({ torso: 10, armF: [96, -2], armB: [40, 110], hipX: 3, headX: 1, legF: [26, -12], legB: [-24, 8] });
const KICK_HIT = P({ torso: -14, legF: [92, -4], legB: [-14, 2], hipY: 27, hipX: 2, armF: [-10, 40], armB: [-40, 60], headX: -1 });
const CHARGE = P({ hipY: 18, torso: -6, headY: 1, armF: [25, -40], armB: [-25, 40], legF: [40, -50], legB: [-40, 50] });
const GATHER = P({ hipY: 20, torso: -12, headX: -1, armF: [-70, 20], armB: [-62, 10], legF: [42, -50], legB: [-38, 46] });
const FIRE = P({ hipY: 20, torso: 12, headX: 1, armF: [92, -4], armB: [88, 0], legF: [36, -16], legB: [-42, 22] });
const DEFAULT_WALK = { torso: 6, bob: 0.8, arms: 10 };

const POSES = {
  idle: t => {
    const b = Math.sin(t * 0.11);
    return P({ hipY: 26 + b * 0.6, armF: [60 + b * 3, 95 - b * 4], armB: [45 + b * 2, 105], headY: b * 0.5 });
  },
  walk: (t, f) => {
    const w = (f && f.ch.walk) || DEFAULT_WALK;
    const p = t * 0.17, s = Math.sin(p), c = Math.cos(p);
    return P({
      torso: w.torso, hipY: 25.5 + Math.abs(c) * w.bob, headY: Math.abs(c) * 0.4,
      legF: [22 * s, -30 * Math.max(0, -s) - 6], legB: [-22 * s, -30 * Math.max(0, s) - 6],
      armF: [60 - w.arms * s, 95], armB: [45 + w.arms * s, 105],
    });
  },
  crouch: () => P({ hipY: 12, torso: 12, headY: -1, legF: [78, -78], legB: [-66, 62], armF: [55, 100], armB: [40, 110] }),
  jump: () => P({ ground: false, hipY: 26, torso: -2, legF: [38, -70], legB: [-8, -50], armF: [75, 55], armB: [-25, 35] }),
  block: () => P({ torso: -3, headX: -1, armF: [30, 130], armB: [35, 115], legF: [12, -8], legB: [-16, 10] }),
  punch: t => keyframes([
    [0, BASE],
    [3, P({ torso: 0, armF: [10, 125], armB: [50, 100], hipX: -1 })],
    [5, PUNCH_HIT],
    [9, PUNCH_HIT],
    [16, BASE]], t),
  kick: t => keyframes([
    [0, BASE],
    [3, P({ torso: -6, legF: [50, -110], legB: [-6, 4], hipY: 27, armF: [30, 100], armB: [-20, 60] })],
    [5, KICK_HIT],
    [9, KICK_HIT],
    [16, BASE]], t),
  hit: t => keyframes([
    [0, P({ torso: -14, headX: -3, headY: -1, armF: [-15, 40], armB: [-35, 50], legF: [24, -10], legB: [-10, 4], hipX: -2 })],
    [6, P({ torso: -10, headX: -2, armF: [-10, 50], armB: [-30, 60], legF: [24, -10], legB: [-12, 6], hipX: -2 })],
    [14, BASE]], t),
  ko: t => keyframes([
    [0, P({ torso: -18, headX: -3, armF: [-20, 30], armB: [-40, 40], legF: [26, -8], legB: [-10, 2] })],
    [10, P({ ground: false, torso: -50, hipY: 20, hipX: -4, headX: -2, armF: [-60, 20], armB: [-80, 20], legF: [40, -10], legB: [10, -30] })],
    [20, P({ ground: false, torso: -88, hipY: 7, hipX: -6, headRot: 1, headX: -1, armF: [-95, -20], armB: [-100, 0], legF: [86, 0], legB: [80, -6] })],
    [26, P({ ground: false, torso: -90, hipY: 7, hipX: -6, headRot: 1, headX: -1, armF: [-100, -20], armB: [-100, 0], legF: [88, 0], legB: [82, -6] })]], t),
  win: t => {
    const b = Math.sin(t * 0.15);
    return P({ torso: -4, hipY: 26 + Math.max(0, b) * 2, armF: [172, 8 + b * 6], armB: [168, 12 - b * 6], headY: 1 });
  },
  special: t => {
    const p = keyframes([
      [0, BASE],
      [8, CHARGE],
      [SPECIAL.fire - 22, CHARGE],
      [SPECIAL.fire - 10, GATHER],
      [SPECIAL.fire - 1, GATHER],
      [SPECIAL.fire + 2, FIRE],
      [SPECIAL.beamEnd, FIRE],
      [SPECIAL.total, BASE]], t);
    if (t > 8 && t < SPECIAL.fire) {
      // trembling while charging
      const j = (Math.floor(t / 2) % 2) ? 0.6 : -0.6;
      p.hipX += j; p.headX += j;
    }
    return p;
  },
};

// Cripta stands and walks with his hands in his pockets.
const POCKETS = P({ pockets: 1, torso: -4, headX: -1, armF: [12, 4], armB: [6, 6], legF: [12, -6], legB: [-14, 6] });
CRIPTA.poses = {
  idle: t => {
    const b = Math.sin(t * 0.09);
    return P({ pockets: 1, torso: -4 + b * 0.8, hipY: 26 + b * 0.4, headX: -1, headY: b * 0.5, armF: [12 + b, 4], armB: [6 + b, 6], legF: [12, -6], legB: [-14, 6] });
  },
  walk: t => {
    const p = t * 0.17, s = Math.sin(p), c = Math.cos(p);
    return P({
      pockets: 1, torso: -6, headX: -1, hipY: 25.5 + Math.abs(c) * 1.0, headY: Math.abs(c) * 0.4,
      legF: [22 * s, -30 * Math.max(0, -s) - 6], legB: [-22 * s, -30 * Math.max(0, s) - 6],
      armF: [12 + 3 * s, 4], armB: [6 - 3 * s, 6],
    });
  },
  win: t => {
    const b = Math.sin(t * 0.1);
    return P({ pockets: 1, torso: -9 + b, headX: -3, headY: 1, hipY: 26, armF: [12, 4], armB: [6, 6], legF: [14, -6], legB: [-16, 6] });
  },
  special: t => {
    const p = POSES.special(t);
    if (t < 8) return mix(POCKETS, p, t / 8);
    return p;
  },
};

// HMSI fights with the keyboard: swing, overhead smash, and the plunge. kb = keyboard angle.
const KB_READY = P({ hold: 1, kb: 165, armF: [40, 100], armB: [30, 90] });
const KB_BACK = P({ hold: 1, kb: 205, torso: -6, hipX: -1, armF: [20, 118], armB: [30, 90] });
const KB_SWING = P({ hold: 1, kb: 88, torso: 12, armF: [82, -12], armB: [30, 70], hipX: 4, headX: 1, legF: [28, -12], legB: [-26, 8] });
const KB_UP = P({ hold: 2, kb: 178, torso: -10, armF: [170, 8], armB: [165, 12], hipY: 25, headY: 1 });
const KB_SMASH = P({ hold: 2, kb: 40, torso: 22, armF: [60, -10], armB: [55, -8], hipY: 18, hipX: 2, headY: -1, legF: [45, -40], legB: [-40, 20] });
const KB_CROUCH = P({ hold: 2, kb: 182, hipY: 15, torso: -6, legF: [55, -75], legB: [-55, 65], armF: [170, 8], armB: [165, 10], headY: 1 });
const KB_AIR = P({ hold: 2, kb: 200, ground: false, hipY: 26, torso: 14, legF: [30, -70], legB: [-15, -50], armF: [160, 5], armB: [155, 8] });
const KB_SLAM = P({ hold: 2, kb: 35, hipY: 13, torso: 26, legF: [60, -80], legB: [-55, 60], armF: [58, -12], armB: [52, -8], headY: -1 });

HMSI.poses = {
  punch: t => keyframes([
    [0, KB_READY],
    [3, KB_BACK],
    [5, KB_SWING],
    [9, KB_SWING],
    [16, KB_READY]], t),
  kick: t => keyframes([
    [0, KB_READY],
    [4, KB_UP],
    [7, KB_SMASH],
    [11, KB_SMASH],
    [20, KB_READY]], t),
  special: (t, f) => {
    const sp = f && f.sp;
    if (!sp) return KB_READY;
    if (sp.phase === 'windup') return keyframes([[0, KB_READY], [10, KB_CROUCH], [PLUNGE.windup, KB_CROUCH]], sp.t);
    if (sp.phase === 'air') return KB_AIR;
    return keyframes([[0, KB_SLAM], [PLUNGE.recover * 0.6, KB_SLAM], [PLUNGE.recover, KB_READY]], sp.t);
  },
  win: t => {
    const b = Math.sin(t * 0.15);
    return P({ hold: 2, kb: 180, torso: -6, hipY: 26 + Math.max(0, b) * 2, armF: [170, 8 + b * 4], armB: [165, 10 - b * 4], headY: 1 });
  },
};

// ---------- solve a pose into joint positions ----------
function limb(root, l1, l2, a1, a2) {
  const d1 = dirOf(a1), d2 = dirOf(a1 + a2);
  const mid = [root[0] + d1[0] * l1, root[1] + d1[1] * l1];
  return [mid, [mid[0] + d2[0] * l2, mid[1] + d2[1] * l2]];
}

function solvePose(pose) {
  const hip = [pose.hipX, pose.hipY];
  const td = [Math.sin(rad(pose.torso)), Math.cos(rad(pose.torso))];   // torso direction, hip -> neck
  const fd = [td[1], -td[0]];                                           // torso forward direction
  const neck = [hip[0] + td[0] * L.torso, hip[1] + td[1] * L.torso];
  const shB = [neck[0] - fd[0] * 3 - td[0] * 2, neck[1] - fd[1] * 3 - td[1] * 2];
  const shF = [neck[0] + fd[0] * 3 - td[0] * 2, neck[1] + fd[1] * 3 - td[1] * 2];
  const hipB = [hip[0] - 3, hip[1]], hipF = [hip[0] + 3, hip[1]];
  const [elB, handB] = limb(shB, L.upper, L.fore, pose.armB[0], pose.armB[1]);
  const [elF, handF] = limb(shF, L.upper, L.fore, pose.armF[0], pose.armF[1]);
  const [knB, footB] = limb(hipB, L.thigh, L.shin, pose.legB[0], pose.legB[1]);
  const [knF, footF] = limb(hipF, L.thigh, L.shin, pose.legF[0], pose.legF[1]);
  const g = { pose, td, fd, hip, neck, shB, shF, hipB, hipF, elB, handB, elF, handF, knB, footB, knF, footF };
  if (pose.ground !== false) {
    // keep the lowest foot on the floor whatever the leg angles are
    const low = Math.min(footB[1], footF[1]) - 2;
    for (const k in g) if (Array.isArray(g[k]) && k !== 'td' && k !== 'fd') g[k][1] -= low;
  }
  return g;
}

// ---------- drawing ----------
function thickLine(ctx, x0, y0, x1, y1, t) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const half = Math.floor(t / 2);
  for (let i = 0; i <= n; i++) {
    ctx.fillRect(Math.round(x0 + dx * i / n) - half, Math.round(y0 + dy * i / n) - half, t, t);
  }
}

const rotatedHeads = new Map();
function rotatedHead(ch) {
  // lying on the back, head toward the rear: rotate the map so the top of the head points backward
  if (!rotatedHeads.has(ch)) {
    const hw = ch.head[0].length, hh = ch.head.length, out = [];
    for (let r = 0; r < hw; r++) {
      let row = '';
      for (let c = 0; c < hh; c++) row += ch.head[c][hw - 1 - r];
      out.push(row);
    }
    rotatedHeads.set(ch, out);
  }
  return rotatedHeads.get(ch);
}

// Head map at any scale, optionally mirrored. (x, y) is the top-left corner on screen.
function drawHead(ctx, ch, x, y, scale, facing) {
  const pal = ch.headPalette, hw = ch.head[0].length;
  for (let r = 0; r < ch.head.length; r++) for (let c = 0; c < hw; c++) {
    const k = ch.head[r][c];
    if (k === '.') continue;
    ctx.fillStyle = pal[k];
    const col = facing === -1 ? hw - 1 - c : c;
    ctx.fillRect(x + col * scale, y + r * scale, scale, scale);
  }
}

// Draws a solved pose with the feet at screen position (ox, oy). tint = solid colour for silhouettes and hit flashes.
function drawPuppet(ctx, ch, g, ox, oy, facing, tint) {
  const p = g.pose;
  ctx.save();
  ctx.translate(Math.round(ox), Math.round(oy));
  ctx.scale(facing, 1);
  const col = c => tint || c;
  const line = (a, b, t, c) => { ctx.fillStyle = col(c); thickLine(ctx, a[0] * SC, -a[1] * SC, b[0] * SC, -b[1] * SC, t * SC); };
  const rect = (x, y, w, h, c) => { ctx.fillStyle = col(c); ctx.fillRect(Math.round(x * SC), Math.round(-(y + h) * SC), w * SC, h * SC); };
  const px = (x, y, c) => { ctx.fillStyle = col(c); ctx.fillRect(x, -y - 1, 1, 1); };   // one screen pixel, up-coordinates
  const skin = ch.skin;
  const upperCol = ch.sleeve === 'skin' ? skin : ch.top;
  const foreCol = ch.sleeve === 'skin' || ch.forearm === 'skin' ? skin : ch.top;
  const along = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const pockets = p.pockets > 0.5;
  const holding = ch.weapon && p.hold > 0.5;

  function tattoo(a, b, ks) {
    if (!ch.tattoos || tint) return;
    ks.forEach((k, i) => {
      const q = along(a, b, k), x = Math.round(q[0]), y = Math.round(q[1]);
      if (i % 3 === 0) rect(x - 1, y, 3, 1, '#4a3550');
      else if (i % 3 === 1) { rect(x, y - 1, 1, 3, '#4a3550'); rect(x - 1, y, 3, 1, '#4a3550'); }
      else { rect(x - 1, y - 1, 2, 2, '#4a3550'); rect(x, y, 1, 1, skin); }
    });
  }
  function arm(sh, el, hand, hideHand, front) {
    if (front && !tint) {
      // a dark edge so the near arm reads as an arm where it crosses the body
      line(sh, el, ch.armT + 1, OUTLINE);
      line(el, hand, Math.max(5, ch.armT - 1) + 1, OUTLINE);
    }
    line(sh, el, ch.armT, upperCol);
    line(el, hand, Math.max(5, ch.armT - 1), foreCol);
    if (ch.sleeve === 'skin') tattoo(sh, el, [0.25, 0.5, 0.78]);
    tattoo(el, hand, [0.3, 0.6]);
    if (ch.joints) rect(el[0] - 1, el[1] - 1, 3, 3, ch.boots);
    if (!hideHand) rect(hand[0] - 2, hand[1] - 2, 5, 5, skin);
  }
  function leg(hp, kn, foot) {
    line(hp, kn, ch.legT[0], ch.pants);
    line(kn, foot, ch.legT[1], ch.pants);
    if (ch.pantsLight && !tint) {
      const q = along(hp, kn, 0.55);
      rect(Math.round(q[0]) - 1, Math.round(q[1]) - 2, 3, 3, ch.pantsLight);
    }
    if (ch.joints) rect(kn[0] - 1, kn[1] - 1, 3, 3, ch.boots);
    rect(foot[0] - 3, foot[1] - 3, 7, 5, ch.boots);
    if (ch.shoes === 'allstar' && !tint) {
      rect(foot[0] - 3, foot[1] - 3, 7, 1, '#e9e6de');   // rubber sole
      rect(foot[0] + 2, foot[1] - 2, 2, 2, '#e9e6de');   // toe cap
    } else if (ch.shoes === 'sneaker' && !tint) {
      rect(foot[0] - 3, foot[1] - 3, 7, 1, '#d8d8de');
    }
  }
  function torso() {
    // width profile from hip to neck, drawn as short bands perpendicular to the torso
    const prof = [12, 13, 14, 15, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15, 14, 12, 10, 8];
    for (let i = 0; i <= L.torso; i++) {
      const cx = g.hip[0] + g.td[0] * i, cy = g.hip[1] + g.td[1] * i, w = prof[i] * ch.torsoScale / 2;
      line([cx - g.fd[0] * w, cy - g.fd[1] * w], [cx + g.fd[0] * w, cy + g.fd[1] * w], 2, ch.top);
    }
    if (!tint) {
      if (ch.hood || ch.zipper) {
        // kangaroo pocket
        for (let i = 3; i <= 7; i++) {
          const cx = g.hip[0] + g.td[0] * i, cy = g.hip[1] + g.td[1] * i;
          line([cx - g.fd[0] * 5, cy - g.fd[1] * 5], [cx + g.fd[0] * 5, cy + g.fd[1] * 5], 1, ch.topDark);
        }
      }
      if (ch.zipper) {
        const a = [g.hip[0] + g.td[0] * 3 + g.fd[0], g.hip[1] + g.td[1] * 3 + g.fd[1]];
        const b = [g.neck[0] - g.td[0] * 2 + g.fd[0], g.neck[1] - g.td[1] * 2 + g.fd[1]];
        line(a, b, 1, ch.zipper);
      }
      if (ch.print) {
        const c = [g.hip[0] + g.td[0] * 10 + g.fd[0], g.hip[1] + g.td[1] * 10 + g.fd[1]];
        rect(Math.round(c[0]) - 3, Math.round(c[1]) - 2, 6, 4, ch.print);
      }
      if (ch.belt) {
        line([g.hip[0] - 6, g.hip[1] + 1], [g.hip[0] + 6, g.hip[1] + 1], 2, '#111114');
        for (let x = -5; x <= 5; x += 2) rect(g.hip[0] + x, g.hip[1] + 1, 1, 1, ch.belt);
      }
    }
    // neck
    line([g.neck[0] - g.td[0] * 2, g.neck[1] - g.td[1] * 2], [g.neck[0] + g.td[0] * 2, g.neck[1] + g.td[1] * 2], 6, skin);
  }
  function chain() {
    if (!ch.chain || tint) return;
    const h = g.hip;
    for (const [dx, dy] of [[4, -1], [6, -3], [7, -6], [7, -9], [6, -12]]) rect(h[0] + dx, h[1] + dy, 1, 1, '#c9c9d3');
  }
  function hood() {
    if (!ch.hood) return;
    const n = g.neck;
    line([n[0] - g.fd[0] * 7, n[1] - g.fd[1] * 7 - 1], [n[0] - g.fd[0] * 2, n[1] - g.fd[1] * 2 - 1], 7, ch.topDark);
  }
  function head() {
    const pal = ch.headPalette;
    const n = g.neck, hw = ch.head[0].length, hh = ch.head.length, anchor = ch.headAnchor;
    const nx = Math.round(n[0] * SC + p.headX * SC), ny = Math.round(n[1] * SC + p.headY * SC);
    if (p.headRot) {
      const map = rotatedHead(ch);   // hh wide, hw tall; the neck joins its right side
      const x0 = nx - hh + 2, y0 = ny + hw - anchor;
      for (let r = 0; r < hw; r++) for (let c = 0; c < hh; c++) {
        const k = map[r][c];
        if (k !== '.') px(x0 + c, y0 - r - 1, pal[k]);
      }
      return;
    }
    const x0 = nx - anchor, yBottom = ny - 2;
    for (let r = 0; r < hh; r++) for (let c = 0; c < hw; c++) {
      const k = ch.head[r][c];
      if (k !== '.') px(x0 + c, yBottom + (hh - 1 - r), pal[k]);
    }
  }
  // the synth: carried on the back, or swung by its end
  function keyboard(inHands) {
    let a, b, d, n;
    if (inHands) {
      d = dirOf(p.kb);
      n = [d[1], -d[0]];
      const grip = g.handF;
      a = [grip[0] - d[0] * 7, grip[1] - d[1] * 7];
      b = [grip[0] + d[0] * 25, grip[1] + d[1] * 25];
    } else {
      d = [-0.28, 0.96];
      n = [-d[1], d[0]];
      const c = [g.hip[0] - 6, g.hip[1] + 9];
      a = [c[0] - d[0] * 16, c[1] - d[1] * 16];
      b = [c[0] + d[0] * 16, c[1] + d[1] * 16];
    }
    line(a, b, 10, '#23232a');
    if (tint) return;
    const off = (pt, k) => [pt[0] + n[0] * k, pt[1] + n[1] * k];
    const a2 = along(a, b, 0.04), b2 = along(a, b, 0.96);
    line(off(a2, 2.5), off(b2, 2.5), 4, '#3b3b46');            // control panel
    line(off(a2, -2.5), off(b2, -2.5), 3, '#f4f2ee');           // keys
    for (let i = 0; i < 12; i++) {
      if (i % 3 === 2) continue;
      const q = along(off(a2, -2), off(b2, -2), (i + 0.5) / 12);
      rect(Math.round(q[0]), Math.round(q[1]), 1, 1, '#1a1a1f');
    }
    for (const k of [0.12, 0.24, 0.36, 0.48, 0.6]) {
      const q = along(off(a2, 2.5), off(b2, 2.5), k);
      rect(Math.round(q[0]), Math.round(q[1]), 1, 1, '#d6d6de');
    }
    const s = along(off(a2, 2.5), off(b2, 2.5), 0.8);
    rect(Math.round(s[0]) - 1, Math.round(s[1]) - 1, 3, 2, '#5fd35f');
    rect(Math.round(b[0] - d[0] * 2), Math.round(b[1] - d[1] * 2), 1, 1, '#ff3b3b');
    if (inHands && p.hold > 1.5) {
      // second hand on the grip
      const hb = [g.handF[0] - d[0] * 4, g.handF[1] - d[1] * 4];
      rect(hb[0] - 2, hb[1] - 2, 5, 5, skin);
    }
  }
  function strap() {
    if (!ch.weapon || holding) return;
    line([g.shF[0] + 1, g.shF[1] + 1], [g.hip[0] - 4, g.hip[1] + 2], 1, '#111114');
  }

  if (ch.weapon && !holding) keyboard(false);
  arm(g.shB, g.elB, g.handB, pockets);
  leg(g.hipB, g.knB, g.footB);
  torso();
  strap();
  hood();
  if (pockets) arm(g.shF, g.elF, g.handF, true, true);
  leg(g.hipF, g.knF, g.footF);
  chain();
  head();
  if (!pockets) arm(g.shF, g.elF, g.handF, false, true);
  if (holding) keyboard(true);
  ctx.restore();
}

function drawFighter(ctx, ch, pose, x, y, facing, flash) {
  const g = solvePose(pose);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawPuppet(ctx, ch, g, x + dx, y + dy, facing, OUTLINE);
  drawPuppet(ctx, ch, g, x, y, facing, flash || null);
}

// Screen position of the cigarette tip for a fighter standing at (ox, oy).
function cigaretteTip(ch, pose, ox, oy, facing) {
  if (pose.headRot || !ch.cigTip) return null;
  const g = solvePose(pose);
  const nx = Math.round(g.neck[0] * SC + pose.headX * SC), ny = Math.round(g.neck[1] * SC + pose.headY * SC);
  const hh = ch.head.length;
  const lx = nx - ch.headAnchor + ch.cigTip[0], ly = ny - 2 + (hh - 1 - ch.cigTip[1]);
  return [ox + lx * facing, oy - ly];
}
