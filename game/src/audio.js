// Copper Ladle — original sounds, all synthesized with WebAudio.
// No audio files are loaded; every beep, sizzle and jingle is generated.

let ctx = null;
let master = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
  if (m) stopMusic(); else startMusic();
}
export function isMuted() { return muted; }

function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.15, filterFreq = 4000, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = filterFreq; filt.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.15); },
  add() { tone(520, 0.07, 'triangle', 0.18); tone(780, 0.09, 'triangle', 0.14, 0.05); },
  chop() { noiseBurst(0.08, 0.2, 1800); tone(180, 0.06, 'square', 0.08); },
  place() { tone(300, 0.08, 'sine', 0.18, 0, 180); noiseBurst(0.05, 0.08, 900); },
  sizzle() { noiseBurst(0.35, 0.1, 5200); },
  ding() { tone(880, 0.25, 'sine', 0.2); tone(1318, 0.3, 'sine', 0.15, 0.08); },
  serve() {
    tone(523, 0.12, 'triangle', 0.2); tone(659, 0.12, 'triangle', 0.2, 0.09);
    tone(784, 0.18, 'triangle', 0.22, 0.18); tone(1046, 0.25, 'triangle', 0.18, 0.27);
    noiseBurst(0.15, 0.1, 6000, 0.05);
  },
  coin() { tone(987, 0.09, 'square', 0.08); tone(1318, 0.16, 'square', 0.08, 0.07); },
  buzz() { tone(140, 0.25, 'sawtooth', 0.16, 0, 90); },
  burn() { tone(220, 0.3, 'sawtooth', 0.14, 0, 110); noiseBurst(0.2, 0.12, 700); },
  expire() { tone(392, 0.15, 'triangle', 0.16); tone(311, 0.2, 'triangle', 0.16, 0.12); tone(233, 0.3, 'triangle', 0.16, 0.24); },
  start() { tone(523, 0.1, 'triangle', 0.2); tone(659, 0.1, 'triangle', 0.2, 0.09); tone(784, 0.2, 'triangle', 0.22, 0.18); },
  over() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.18, i * 0.16));
    tone(1318, 0.5, 'triangle', 0.16, 0.68);
  },
};

// ---- Tiny background music: a cheerful 8-step loop, bass + pluck. ----
const BASS = [130.8, 0, 164.8, 0, 196.0, 0, 164.8, 0];
const LEAD = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 880.0, 698.5];

export function startMusic() {
  if (!ctx || muted || musicTimer) return;
  musicTimer = setInterval(() => {
    if (!ctx || muted) return;
    const step = musicStep % 8;
    const b = BASS[step];
    if (b) tone(b, 0.22, 'sine', 0.12);
    if (step % 2 === 0) tone(LEAD[step], 0.16, 'triangle', 0.05);
    musicStep++;
  }, 240);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
