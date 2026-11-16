/* منطق الخادم المشترك لساحة سيف (مستقل عن التخزين). يستعمله api.mjs مع Netlify Blobs. */
const GAMES = ['puzzle', 'network', 'b1', 'b2', 'b3', 'b4', 'b5', 'vuln', 'defend', 'forensic', 'deepfake', 'ml', 'pattern'];
const TIERS = ['gold', 'silver', 'bronze'];
const ADMIN_OPS = new Set(['hide', 'close', 'cfg', 'reset']);
const dayOf = ts => new Date(ts + 3 * 3600e3).toISOString().slice(0, 10);   // توقيت الرياض

export function cleanName(n) {
  if (n == null) return null;
  const s = String(n).replace(/[\u0000-\u001f\u007f<>]/g, '').split(' ').filter(Boolean).join(' ');
  return s.length < 2 || s.length > 24 ? null : s;
}
export function cleanPhone(p) {
  if (p == null) return null;
  const raw = String(p);
  let s = raw.replace(/[٠-٩]/g, c => c.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, c => c.charCodeAt(0) - 0x6F0).replace(/\D/g, '');
  if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('966') && s.length === 12 && s[3] === '5') return '0' + s.slice(3);
  if (s.length === 10 && s.startsWith('05')) return s;
  if (s.length === 9 && s[0] === '5') return '0' + s;
  const t = raw.trimStart();
  if (t.startsWith('+') || t.startsWith('00')) return s.length >= 9 && s.length <= 15 ? '+' + s : null;
  return null;
}

export const emptyData = () => ({ rounds: [], cfg: { publicUrl: '', closedDays: {}, crowd: false } });

function view(d, admin) {
  return {
    rounds: d.rounds.map(r => admin ? r : { ...r, phone: '' }),
    cfg: d.cfg, now: Date.now(),
  };
}

function applyOp(d, op, admin, now) {
  if (!op || typeof op !== 'object') return 'bad';
  if (ADMIN_OPS.has(op.t) && !admin) return 'forbidden';
  switch (op.t) {
    case 'add': {
      const r = op.round || {};
      if (!/^[0-9a-f]{18}$/.test(r.id || '') || !GAMES.includes(r.game) || ![1, 2].includes(+r.screen) || !TIERS.includes(r.tier)) return 'bad';
      const max = Math.round(+r.max), score = Math.round(+r.score);
      if (!(max >= 1 && max <= 2000) || !(score >= 0 && score <= max)) return 'bad';
      if (d.rounds.some(x => x.id === r.id)) return 'dup';
      d.rounds.push({ id: r.id, day: dayOf(now), ts: now, name: '', phone: '', game: r.game, screen: +r.screen, score, max, tier: r.tier, lv: [1, 2, 3].includes(+r.lv) ? +r.lv : 1, hidden: false });
      return 'ok';
    }
    case 'ident': {
      const r = d.rounds.find(x => x.id === op.id), n = cleanName(op.name), p = cleanPhone(op.phone);
      if (!r || !n || !p || r.name) return 'bad';
      if (d.cfg.closedDays[r.day]) return 'closed';
      r.name = n; r.phone = p; return 'ok';
    }
    case 'hide': { const r = d.rounds.find(x => x.id === op.id); if (!r) return 'bad'; r.hidden = !!op.hidden; return 'ok'; }
    case 'close': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(op.day || '')) return 'bad';
      if (op.close) d.cfg.closedDays[op.day] = now; else delete d.cfg.closedDays[op.day];
      return 'ok';
    }
    case 'cfg': {
      if (typeof op.publicUrl === 'string') { const u = op.publicUrl.trim(); if (u && !/^https?:\/\/\S+$/i.test(u)) return 'bad'; d.cfg.publicUrl = u.replace(/\/$/, ''); }
      if (typeof op.crowd === 'boolean') d.cfg.crowd = op.crowd;
      return 'ok';
    }
    case 'reset': d.rounds = []; d.cfg.closedDays = {}; return 'ok';
    default: return 'bad';
  }
}

/** db: { load(): Promise<data>, update(fn): Promise<any> } */
export async function handle(db, { method, path, body, pin }, env = {}) {
  const adminPin = String(env.ADMIN_PIN || '2026'), admin = pin === adminPin;
  const json = (status, b) => ({ status, body: b });
  if (path === '/ping') return json(200, { ok: true, mode: 'remote' });
  if (path === '/auth' && method === 'POST') return admin || (body && body.pin === adminPin) ? json(200, { ok: true }) : json(401, { ok: false });
  if (path === '/data' && method === 'GET') return json(200, view(await db.load(), admin));
  if (path === '/ops' && method === 'POST') {
    const ops = body && Array.isArray(body.ops) ? body.ops.slice(0, 50) : null;
    if (!ops) return json(400, { ok: false });
    const results = await db.update(d => { const now = Date.now(); return ops.map(op => applyOp(d, op, admin, now)); });
    return json(200, { ok: true, results });
  }
  return json(404, { ok: false });
}
