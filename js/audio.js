'use strict';
// Sound: sampled voice lines plus tiny synthesized effects. Music: looping tracks.
const Sound = (() => {
  let ctx = null;
  const buffers = {};   // name -> AudioBuffer (Web Audio path)
  const pool = {};      // name -> [<audio>] (fallback when the page is opened straight from disk)
  const playing = {};   // name -> last started source, so a new yell can cut the previous one

  function context() {
    if (ctx === null) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = false; }
    }
    return ctx || null;
  }

  // Browsers only allow sound after a key press; call this from the input handler.
  function unlock() {
    const c = context();
    if (c && c.state === 'suspended') c.resume();
    Music.resume();
  }

  async function load(name, url) {
    const c = context();
    if (c) {
      try {
        const res = await fetch(url);
        buffers[name] = await c.decodeAudioData(await res.arrayBuffer());
        return;
      } catch (e) { /* file:// blocks fetch, fall back to <audio> */ }
    }
    const a = new Audio(url);
    a.preload = 'auto';
    pool[name] = [a, a.cloneNode(), a.cloneNode()];
  }

  // solo: stop the previous instance of the same sound first.
  function play(name, vol = 1, solo = false) {
    const c = context();
    if (c && buffers[name]) {
      if (solo && playing[name]) { try { playing[name].stop(); } catch (e) { /* already ended */ } }
      const src = c.createBufferSource();
      src.buffer = buffers[name];
      const g = c.createGain();
      g.gain.value = vol;
      src.connect(g); g.connect(c.destination);
      src.start();
      playing[name] = src;
      return;
    }
    const list = pool[name];
    if (!list) return;
    let a = list.find(x => x.paused || x.ended);
    if (solo) { list.forEach(x => { x.pause(); x.currentTime = 0; }); a = list[0]; }
    if (!a) a = list[0];
    a.volume = vol;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  function stop(name) {
    if (playing[name]) { try { playing[name].stop(); } catch (e) { /* already ended */ } playing[name] = null; }
    const list = pool[name];
    if (list) list.forEach(x => { x.pause(); x.currentTime = 0; });
  }

  function tone(type, f0, f1, dur, vol, delay = 0) {
    const c = context(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(dur, vol) {
    const c = context(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource(), g = c.createGain(), t = c.currentTime;
    s.buffer = noiseBuf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(g); g.connect(c.destination);
    s.start(t); s.stop(t + dur + 0.02);
  }

  // a stabbed synth chord, like hitting a keyboard
  const CHORDS = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6]];
  function chord(notes, dur, vol) {
    for (const f of notes) { tone('sawtooth', f, f, dur, vol); tone('square', f * 2, f * 2, dur * 0.7, vol * 0.4); }
  }

  const sfx = {
    move:    () => tone('square', 700, 700, 0.04, 0.08),
    confirm: () => tone('square', 440, 880, 0.12, 0.10),
    back:    () => tone('square', 500, 250, 0.10, 0.08),
    whiff:   () => noise(0.06, 0.06),
    stab:    () => chord(CHORDS[Math.floor(Math.random() * CHORDS.length)], 0.16, 0.07),
    hit:     () => { noise(0.09, 0.30); tone('square', 180, 50, 0.13, 0.22); },
    block:   () => tone('square', 320, 240, 0.07, 0.14),
    jump:    () => tone('triangle', 250, 600, 0.10, 0.08),
    ko:      () => { tone('sawtooth', 320, 40, 0.7, 0.25); noise(0.35, 0.25); },
    round:   () => tone('square', 660, 660, 0.08, 0.10),
    fight:   () => tone('square', 520, 1040, 0.20, 0.12),
    beam:    () => { noise(0.9, 0.35); tone('sawtooth', 90, 700, 0.6, 0.18); tone('square', 60, 30, 0.9, 0.12); },
    riser:   () => { tone('sawtooth', 110, 880, 0.4, 0.12); tone('square', 55, 440, 0.4, 0.08); },
    whoosh:  () => noise(0.25, 0.12),
    slam:    () => { noise(0.4, 0.4); tone('square', 120, 30, 0.35, 0.3); chord([110, 130.8, 164.8], 0.5, 0.1); },
  };

  return { unlock, load, play, stop, sfx };
})();

const Music = (() => {
  const tracks = {};
  let current = null;

  function load(name, url, vol) {
    const a = new Audio(url);
    a.loop = true;
    a.preload = 'auto';
    a.volume = vol;
    tracks[name] = a;
  }

  function play(name) {
    if (current === name) return;
    stop();
    current = name;
    const a = tracks[name];
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => { /* blocked until the first key press, resume() retries */ });
  }

  function stop() {
    if (current && tracks[current]) tracks[current].pause();
    current = null;
  }

  function resume() {
    const a = current && tracks[current];
    if (a && a.paused) a.play().catch(() => {});
  }

  return { load, play, stop, resume };
})();
