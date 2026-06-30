// Sonidos sintetizados con Web Audio (sin archivos externos).

let ctx;
function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
export function resume() { const a = ac(); if (a.state === "suspended") a.resume(); }

export function shoot() {
  const a = ac(), t = a.currentTime;
  const o = a.createOscillator(), g = a.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(440, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.07);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + 0.1);
  const buf = a.createBuffer(1, 1024, a.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < 1024; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / 1024);
  const n = a.createBufferSource(), ng = a.createGain();
  n.buffer = buf; ng.gain.setValueAtTime(0.05, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(ng).connect(a.destination); n.start(t);
}

export function reload() {
  const a = ac();
  [0, 0.18].forEach((d, i) => {
    const t = a.currentTime + d;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "square"; o.frequency.setValueAtTime(i ? 320 : 220, t);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.06);
  });
}

export function boom() {
  const a = ac(), t = a.currentTime;
  const buf = a.createBuffer(1, 8192, a.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < 8192; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / 8192);
  const n = a.createBufferSource(), g = a.createGain();
  n.buffer = buf; g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  n.connect(g).connect(a.destination); n.start(t);
}
