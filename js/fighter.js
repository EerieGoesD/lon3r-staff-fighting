'use strict';
// One fighter: movement, attacks, hit reactions. Logic runs at a fixed 60 ticks per second.
// Positions are in game units; the screen shows them SC times bigger (see characters.js).

const W = 384, H = 216, GROUND_PX = 190;
const WALK = 1.35, BACK = 1.0, JUMP = 3.8, GRAV = 0.24, WALL_L = 12, WALL_R = W / SC - 12, PUSH_W = 18;
const NOPAD = { left: false, right: false, down: false, jump: false, punch: false, kick: false, special: false };

// Boxes are in local up-coordinates: x forward from the centre, y up from the feet.
const ATTACKS = {
  punch: { total: 16, active: [4, 8], box: { x: 8, y: 34, w: 18, h: 12 }, damage: 7, stun: 14, push: 2.2 },
  kick:  { total: 18, active: [5, 9], box: { x: 10, y: 14, w: 24, h: 16 }, damage: 11, stun: 18, push: 3.0 },
};
// HMSI swings the keyboard: a thrust and an overhead smash that also reaches crouching opponents.
const KEYBOARD_ATTACKS = {
  punch: { total: 16, active: [5, 9], box: { x: 8, y: 30, w: 34, h: 14 }, damage: 8, stun: 14, push: 2.4 },
  kick:  { total: 20, active: [7, 11], box: { x: 4, y: 0, w: 32, h: 44 }, damage: 12, stun: 18, push: 3.2 },
};
HMSI.attacks = KEYBOARD_ATTACKS;

// A simple computer opponent for phones: closes in, swings when near, blocks now and then.
function cpuPad(f, opp) {
  const ai = f.ai || (f.ai = { t: 0, act: 'wait', hold: 0 });
  const pad = { left: false, right: false, down: false, jump: false, punch: false, kick: false, special: false };
  if (f.state === 'ko' || f.state === 'win') return pad;
  const d = Math.abs(opp.x - f.x);
  const toward = opp.x > f.x ? 'right' : 'left', away = toward === 'right' ? 'left' : 'right';
  if (--ai.t <= 0) {
    ai.t = 8 + Math.floor(Math.random() * 9);
    const r = Math.random();
    const threat = opp.attack || opp.state === 'special';
    if (!f.specialUsed && d > 55 && r < 0.1) ai.act = 'special';
    else if (threat && d < 50 && r < 0.45) { ai.act = 'block'; ai.hold = 22; }
    else if (d < 36) ai.act = r < 0.5 ? 'punch' : r < 0.8 ? 'kick' : 'back';
    else if (d < 48) ai.act = r < 0.45 ? 'kick' : 'approach';
    else ai.act = r < 0.1 ? 'jump' : r < 0.2 ? 'wait' : 'approach';
  }
  switch (ai.act) {
    case 'approach': pad[toward] = true; break;
    case 'back': pad[away] = true; break;
    case 'block': pad[away] = true; if (--ai.hold <= 0) ai.act = 'wait'; break;
    case 'jump': pad.jump = true; pad[toward] = true; ai.act = 'approach'; break;
    case 'punch': pad.punch = true; ai.act = 'wait'; break;
    case 'kick': pad.kick = true; ai.act = 'wait'; break;
    case 'special': pad.special = true; ai.act = 'wait'; break;
  }
  return pad;
}

const toScreenX = x => x * SC;
const toScreenY = h => GROUND_PX - h * SC;

class Fighter {
  constructor(ch, keys, side) {
    this.ch = ch;
    this.keys = keys;
    this.side = side;
    this.reset();
  }

  reset() {
    this.x = this.side === 0 ? 56 : 136;
    this.facing = this.side === 0 ? 1 : -1;
    this.h = 0; this.vx = 0; this.vy = 0; this.landed = false;
    this.prevX = this.x; this.prevH = 0;
    this.hp = 100; this.hpShown = 100;
    this.state = 'idle'; this.t = 0; this.walkT = 0; this.walkDir = 1;
    this.attack = null; this.hitDone = false; this.stun = 0; this.low = false;
    this.blocking = false; this.flash = 0; this.buf = null;
    this.specialUsed = false; this.sp = null; this.slamFx = false; this.ai = null;
    this.pad = NOPAD;
  }

  setState(s) { this.state = s; this.t = 0; }
  get airborne() { return this.h > 0 || this.vy > 0; }
  get beam() { return this.ch.special === 'beam'; }
  get charging() { return this.state === 'special' && this.beam && this.t < SPECIAL.fire; }
  get firing() { return this.state === 'special' && this.beam && this.t >= SPECIAL.fire && this.t < SPECIAL.beamEnd; }
  attacks() { return this.ch.attacks || ATTACKS; }

  // Called every tick, even during hit freeze, so button presses are never lost.
  readInput(control, opp) {
    this.pad = !control ? NOPAD : this.cpu ? cpuPad(this, opp) : readPad(this.keys);
    if (this.pad.special && !this.specialUsed) this.buf = { name: 'special', t: 8 };
    else if (this.pad.punch) this.buf = { name: 'punch', t: 8 };
    else if (this.pad.kick) this.buf = { name: 'kick', t: 8 };
    else if (this.buf && --this.buf.t <= 0) this.buf = null;
  }

  startAttack(name) {
    this.attack = { name, t: 0 };
    this.hitDone = false;
    this.buf = null;
    if (!this.airborne) { this.setState('attack'); this.vx = 0; }
    if (this.ch.voice) Sound.play(this.ch.voice, 1, true);
    else if (this.ch.attackSound) Sound.sfx[this.ch.attackSound]();
    else Sound.sfx.whiff();
  }

  startSpecial() {
    this.buf = null;
    this.attack = null;
    this.specialUsed = true;
    this.vx = 0;
    this.hitDone = false;
    this.setState('special');
    if (this.beam) {
      this.sp = null;
      Sound.play(this.ch.specialSound, 1, true);
    } else {
      this.sp = { phase: 'windup', t: 0 };
      Sound.sfx.riser();
    }
  }

  updateSpecial(opp) {
    if (this.beam) {
      this.vx = 0;
      if (this.t === SPECIAL.fire) this.hitDone = false;
      if (this.t >= SPECIAL.total) this.setState('idle');
      return;
    }
    const sp = this.sp;
    sp.t++;
    if (sp.phase === 'windup') {
      this.vx = 0;
      if (sp.t >= PLUNGE.windup) {
        sp.phase = 'air'; sp.t = 0;
        if (opp.x !== this.x) this.facing = opp.x < this.x ? -1 : 1;
        this.vy = 4.0;
        this.h = Math.max(this.h, 0.01);
        const air = 2 * this.vy / GRAV;
        const target = opp.x - this.facing * 14;
        this.vx = Math.max(-5.5, Math.min(5.5, (target - this.x) / air));
        this.hitDone = false;
        Sound.sfx.whoosh();
      }
    } else if (sp.phase === 'air') {
      if (this.landed) {
        this.vx = 0;
        sp.phase = 'slam'; sp.t = 0;
        this.slamFx = true;
        Sound.sfx.slam();
      }
    } else {
      this.vx = 0;
      if (sp.t >= PLUNGE.recover) { this.sp = null; this.setState('idle'); }
    }
  }

  update(opp) {
    this.prevX = this.x; this.prevH = this.h;
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.hpShown > this.hp) this.hpShown = Math.max(this.hp, this.hpShown - 0.5);

    const pad = this.pad;
    if (!this.airborne && !this.attack && (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch') && opp.x !== this.x) {
      this.facing = opp.x < this.x ? -1 : 1;
    }
    const fwd = this.facing === 1 ? pad.right : pad.left;
    const back = this.facing === 1 ? pad.left : pad.right;
    this.blocking = false;

    if (this.attack && ++this.attack.t >= this.attacks()[this.attack.name].total) {
      this.attack = null;
      if (this.state === 'attack') this.setState('idle');
    }

    switch (this.state) {
      case 'idle': case 'walk': case 'crouch':
        if (this.buf) {
          if (this.buf.name === 'special') this.startSpecial();
          else this.startAttack(this.buf.name);
          break;
        }
        if (pad.jump) {
          this.setState('jump');
          this.vy = JUMP;
          this.vx = fwd ? 1.6 * this.facing : back ? -1.6 * this.facing : 0;
          Sound.sfx.jump();
          break;
        }
        if (pad.down) {
          if (this.state !== 'crouch') this.setState('crouch');
          this.vx = 0;
          this.blocking = back;
          break;
        }
        if (fwd) {
          if (this.state !== 'walk') this.setState('walk');
          this.walkDir = 1; this.walkT += 1;
          this.vx = WALK * this.facing;
        } else if (back) {
          if (this.state !== 'walk') this.setState('walk');
          this.walkDir = -1; this.walkT -= 1;
          this.vx = -BACK * this.facing;
          this.blocking = true;
        } else {
          if (this.state !== 'idle') this.setState('idle');
          this.vx = 0;
        }
        break;
      case 'jump':
        if (this.buf && this.buf.name !== 'special' && !this.attack) this.startAttack(this.buf.name);
        break;
      case 'attack':
        this.vx *= 0.8;
        break;
      case 'special':
        this.updateSpecial(opp);
        break;
      case 'hit':
        this.vx *= 0.86;
        if (this.t >= this.stun && !this.airborne) this.setState('idle');
        break;
      case 'blockstun':
        this.vx *= 0.8;
        this.blocking = true;
        if (this.t >= this.stun) this.setState('idle');
        break;
      case 'ko':
        this.vx *= 0.9;
        break;
      case 'win':
        this.vx = 0;
        break;
    }

    this.landed = false;
    if (this.airborne) {
      this.vy -= GRAV;
      this.h += this.vy;
      if (this.h <= 0) {
        this.h = 0; this.vy = 0; this.landed = true;
        if (this.state === 'jump') { this.attack = null; this.setState('idle'); }
      }
    }
    this.x += this.vx;
    if (this.x < WALL_L) { this.x = WALL_L; if (this.airborne) this.vx = 0; }
    if (this.x > WALL_R) { this.x = WALL_R; if (this.airborne) this.vx = 0; }
  }

  // World boxes use up-coordinates: l/r on x, b/t = height above the floor.
  hurtbox() {
    if (this.state === 'ko' || this.state === 'win') return null;
    let bottom = 0, top = 56;
    if (this.state === 'crouch' || (this.state === 'blockstun' && this.low)) top = 32;
    if (this.state === 'jump') { bottom = 6; top = 50; }
    return { l: this.x - 9, r: this.x + 9, b: this.h + bottom, t: this.h + top };
  }

  // The attack that is currently able to hit, or null.
  attackData() {
    if (this.state === 'special') {
      if (this.beam) return this.firing ? SPECIAL : null;
      if (!this.sp) return null;
      if (this.sp.phase === 'air' && this.vy < 0 && this.h < 28) return Object.assign({}, PLUNGE, { box: PLUNGE.airBox });
      if (this.sp.phase === 'slam' && this.sp.t <= 6) return Object.assign({}, PLUNGE, { box: PLUNGE.slamBox });
      return null;
    }
    if (!this.attack) return null;
    const a = this.attacks()[this.attack.name];
    if (this.attack.t < a.active[0] || this.attack.t > a.active[1]) return null;
    return a;
  }

  hitbox() {
    if (this.hitDone) return null;
    const a = this.attackData();
    if (!a) return null;
    const bx = a.box;
    const l = this.facing === 1 ? this.x + bx.x : this.x - bx.x - bx.w;
    return { l, r: l + bx.w, b: this.h + bx.y, t: this.h + bx.y + bx.h };
  }

  takeHit(attack, dir) {
    this.hp = Math.max(0, this.hp - attack.damage);
    this.flash = 3;
    if (this.hp <= 0) {
      if (this.state === 'special' && this.ch.specialSound) Sound.stop(this.ch.specialSound);
      this.sp = null;
      this.attack = null; this.buf = null;
      this.vx = dir * attack.push;
      this.setState('ko');
      this.vy = this.airborne ? 0 : 2.4;
      this.h = Math.max(this.h, 0.01);
      Sound.sfx.ko();
      return;
    }
    if (this.state === 'special') {
      // charging, flying or firing: takes the damage but cannot be interrupted
      Sound.sfx.hit();
      return;
    }
    this.attack = null; this.buf = null;
    this.vx = dir * attack.push;
    if (this.airborne) this.vy = Math.max(this.vy, 1.8);
    this.stun = attack.stun;
    this.setState('hit');
    Sound.sfx.hit();
  }

  takeBlock(attack, dir) {
    this.low = this.state === 'crouch';
    if (attack.chip) { this.hp = Math.max(1, this.hp - attack.chip); this.flash = 2; }
    this.vx = dir * attack.push * 0.6;
    this.stun = attack.special ? 20 : 8;
    this.setState('blockstun');
    Sound.sfx.block();
  }

  poseFn(name) {
    return (this.ch.poses && this.ch.poses[name]) || POSES[name];
  }

  pose(alpha) {
    const t = this.t + alpha;
    if (this.attack) {
      let p = this.poseFn(this.attack.name)(this.attack.t + alpha, this);
      if (this.state === 'jump') {
        const j = POSES.jump(t, this);
        p = Object.assign({}, p, { ground: false, hipY: j.hipY, legF: j.legF, legB: j.legB });
      }
      return p;
    }
    switch (this.state) {
      case 'walk': return POSES.walk(this.walkT + alpha * this.walkDir, this);
      case 'blockstun': return this.low ? POSES.crouch(t, this) : POSES.block(t, this);
      case 'attack': return POSES.idle(t, this);
      default: return this.poseFn(this.state)(t, this);
    }
  }

  screenPos(alpha) {
    return [Math.round(toScreenX(lerp(this.prevX, this.x, alpha))), Math.round(toScreenY(lerp(this.prevH, this.h, alpha)))];
  }

  draw(ctx, alpha) {
    const [x, y] = this.screenPos(alpha);
    drawFighter(ctx, this.ch, this.pose(alpha), x, y, this.facing, this.flash > 0 ? '#ffffff' : null);
  }
}

function boxesOverlap(a, b) {
  return a.l < b.r && b.l < a.r && a.b < b.t && b.b < a.t;
}

// Keeps the two bodies from overlapping; the one against the wall pushes the other away.
function separate(a, b) {
  if (Math.abs(a.h - b.h) > 44) return;
  const dx = b.x - a.x;
  if (Math.abs(dx) >= PUSH_W) return;
  const dir = dx >= 0 ? 1 : -1;
  const push = (PUSH_W - Math.abs(dx)) / 2;
  a.x -= dir * push; b.x += dir * push;
  if (a.x < WALL_L) { b.x += WALL_L - a.x; a.x = WALL_L; }
  if (a.x > WALL_R) { b.x -= a.x - WALL_R; a.x = WALL_R; }
  if (b.x < WALL_L) { a.x += WALL_L - b.x; b.x = WALL_L; }
  if (b.x > WALL_R) { a.x -= b.x - WALL_R; b.x = WALL_R; }
}
