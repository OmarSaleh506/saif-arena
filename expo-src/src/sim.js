/* نموذج التشغيل: نقي (بدون three) ليُختبر في node ويُستخدم في المحرك */
import { mulberry } from './util.js';
export const P = { N: 240, W: 3.0, SVC: 0.8, LANES: 4, T0: 5, DT: 6, END: 62 };
export const waveT = i => P.T0 + i * P.DT;                      // زمن مركز الموجة (ثوانٍ حقيقية)
export const clockOf = t => 20 * 60 + 30 + Math.max(0, (t - P.T0) / P.DT) * 30;   // بالدقائق من منتصف الليل؟ (20:00 + ...)

export function makeAgents(data, seed = 7) {
  const rnd = mulberry(seed), N = P.N;
  const tot = a => a.reduce((x, y) => x + y, 0);
  const alloc = (arr) => { const t = tot(arr), out = []; arr.forEach((v, i) => { for (let k = 0; k < Math.round(v / t * N); k++) out.push(i); }); while (out.length < N) out.push(arr.indexOf(Math.max(...arr))); out.length = N; return out; };
  const mode = alloc(data[0]), wave = alloc(data[1]), gate = alloc(data[2]);
  const sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  sh(mode); sh(gate);
  return wave.map((w, i) => ({ id: i, mode: mode[i], gate0: gate[i], wave: w, t: waveT(w) + (rnd() + rnd() - 1) * P.W, rnd: rnd() }));
}

/* d1: دليل الوقت لفتح البوابة (0..4) أو -1 لعدم الفتح، d2: بوابة التاكسي */
export function runModel(agents, d1, d2, extraGate = 0, dt = 0.05) {
  const G = [0, 1, 2].map(() => ({ q: [], lanes: Array(8).fill(0), served: 0, maxQ: 0 }));
  const tOpen = d1 >= 0 ? waveT(d1) : 1e9;
  const A = agents.map(a => ({ ...a, g: a.mode === 2 ? d2 : a.gate0, arr: a.t, done: 0, start: 0 }));
  const order = A.slice().sort((x, y) => x.arr - y.arr); let oi = 0, wait = 0, maxWait = 0, n = 0, maxQ = 0;
  for (let t = 0; t < P.END; t += dt) {
    while (oi < order.length && order[oi].arr <= t) { const a = order[oi++]; G[a.g].q.push(a); }
    G.forEach((g, gi) => {
      const L = (gi === extraGate && t >= tOpen) ? 8 : 4;
      for (let l = 0; l < L && g.q.length; l++) if (g.lanes[l] <= t) { const a = g.q.shift(); a.start = t; a.done = t + P.SVC * (.85 + .3 * a.rnd); g.lanes[l] = a.done; g.served++; const w = t - a.arr; wait += w; n++; if (w > maxWait) maxWait = w; }
      if (g.q.length > g.maxQ) g.maxQ = g.q.length; if (g.q.length > maxQ) maxQ = g.q.length;
    });
  }
  const left = G.reduce((s, g) => s + g.q.length, 0);
  return { maxQ, maxWait, avgWait: wait / Math.max(1, n), left, perGate: G.map(g => g.maxQ) };
}
