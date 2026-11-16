/**
 * تخزين تجارب طويق التفاعلية (محلي في المتصفح). منطقه مأخوذ من خادم مدار:
 * أفضل نتيجة لكل اسم، تقرير اليوم، إنهاء اليوم، إخفاء جولة، تصدير CSV.
 * ملاحظة: البيانات محفوظة في هذا المتصفح/الجهاز فقط، ولا تُشارَك بين الأجهزة.
 */
const SaifStore = (() => {
  const K = { rounds: 'saif_rounds_v1', cfg: 'saif_cfg_v1', player: 'saif_player_v1', outbox: 'saif_outbox_v1' };
  /* وضع التشغيل: remote = خادم مشترك (Netlify Functions)، local = هذا المتصفح فقط */
  let mode = 'local', online = false;
  const API = (window.SAIF_API && window.SAIF_API !== 'local') ? window.SAIF_API.replace(/\/$/, '') : '/api';
  const pinNow = () => { try { return sessionStorage.getItem('saif_admin_pin') || ''; } catch (e) { return ''; } };
  const ADMIN_PIN = '2026';
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const riyadh = ts => new Date(ts + 3 * 3600e3);                  // توقيت الرياض UTC+3
  const dayOf = ts => riyadh(ts).toISOString().slice(0, 10);
  const today = () => dayOf(Date.now());
  const key = n => String(n || '').trim().toLowerCase();
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => b.toString(16).padStart(2, '0')).join('');

  const cfg = () => Object.assign({ publicUrl: '', closedDays: {}, crowd: false }, rd(K.cfg, {}));
  const saveCfg = c => wr(K.cfg, c);
  const rounds = () => rd(K.rounds, []);
  const saveRounds = r => wr(K.rounds, r);

  /* ---------- تنظيف المدخلات (كما في مدار) ---------- */
  function cleanName(n) {
    if (n == null) return null;
    const s = String(n).replace(/[\u0000-\u001f\u007f<>]/g, '').split(' ').filter(Boolean).join(' ');
    return s.length < 2 || s.length > 24 ? null : s;
  }
  function cleanPhone(p) {
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

  /* ---------- المزامنة مع الخادم المشترك ---------- */
  const outbox = () => rd(K.outbox, []);
  const push = op => { if (mode !== 'remote') return; const o = outbox(); o.push(op); wr(K.outbox, o); flush(); };
  let flushing = false;
  async function flush() {
    if (mode !== 'remote' || flushing) return;
    const ops = outbox(); if (!ops.length) return;
    flushing = true;
    try {
      const r = await fetch(API + '/ops', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-pin': pinNow() }, body: JSON.stringify({ ops }) });
      if (r.ok || r.status === 400 || r.status === 403) wr(K.outbox, outbox().slice(ops.length));
      online = r.ok || online;
    } catch (e) { online = false; }
    flushing = false;
  }
  async function sync() {
    if (mode !== 'remote') return false;
    await flush();
    if (outbox().length) return false;
    try {
      const r = await fetch(API + '/data', { headers: { 'x-admin-pin': pinNow() }, cache: 'no-store' });
      if (!r.ok) throw 0;
      const d = await r.json();
      wr(K.rounds, d.rounds || []); wr(K.cfg, d.cfg || {}); online = true; return true;
    } catch (e) { online = false; return false; }
  }
  async function init() {
    if (location.protocol === 'file:' || window.SAIF_API === 'local') return mode;
    try {
      const r = await fetch(API + '/ping', { cache: 'no-store' });
      const j = r.ok ? await r.json() : null;
      if (j && j.ok) { mode = 'remote'; online = true; await sync(); }
    } catch (e) {}
    return mode;
  }
  async function verifyPin(p) {
    if (mode !== 'remote') return p === ADMIN_PIN;
    try { const r = await fetch(API + '/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: p }) }); return r.ok; } catch (e) { return false; }
  }

  /* ---------- الجولات ---------- */
  const isNamed = r => !!r.name && !r.hidden;
  function bestPerName(rows) {
    const m = new Map();
    for (const r of rows) { const k = key(r.name), c = m.get(k); if (!c || r.score > c.score) m.set(k, r); }
    return [...m.values()].sort((a, b) => b.score - a.score || a.ts - b.ts);
  }
  /** تُسجَّل كل جولة منتهية دون اسم، ثم يُضاف الاسم والجوال عند الحفظ. */
  function addRound(o) {
    const all = rounds();
    const r = { id: newId(), day: today(), ts: Date.now(), name: '', phone: '', game: o.game, screen: o.screen, score: o.score, max: o.max, tier: o.tier, lv: o.lv || 1, hidden: false };
    all.push(r); saveRounds(all);
    push({ t: 'add', round: { id: r.id, game: r.game, screen: r.screen, score: r.score, max: r.max, tier: r.tier, lv: r.lv } });
    return r.id;
  }
  function saveIdentity(id, name, phone) {
    const n = cleanName(name), p = cleanPhone(phone);
    if (!n) return { ok: false, err: 'name' };
    if (!p) return { ok: false, err: 'phone' };
    const all = rounds(), r = all.find(x => x.id === id);
    if (!r) return { ok: false, err: 'missing' };
    if (cfg().closedDays[r.day]) return { ok: false, err: 'closed' };
    r.name = n; r.phone = p; saveRounds(all);
    push({ t: 'ident', id, name: n, phone: p });
    return { ok: true, name: n, phone: p, rank: rankOf(r) };
  }
  function rankOf(r) {
    const best = bestPerName(rounds().filter(x => x.day === r.day && isNamed(x)));
    const mine = best.find(b => key(b.name) === key(r.name));
    return mine ? best.filter(b => b.score > mine.score).length + 1 : best.length + 1;
  }
  /** الترتيب المتوقع لنتيجة لم تُحفظ بعد. */
  function projectedRank(score) {
    return bestPerName(rounds().filter(x => x.day === today() && isNamed(x))).filter(b => b.score > score).length + 1;
  }

  /** لوحة المتصدرين: أفضل جولة لكل مشارك اليوم، مع تصفية بالشاشة. */
  function board({ screen = 0, limit = 10, day = today() } = {}) {
    const rows = rounds().filter(r => isNamed(r) && (day === 'all' || r.day === day) && (!screen || r.screen === screen));
    return bestPerName(rows).slice(0, limit).map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, score: r.score, max: r.max, game: r.game, screen: r.screen, tier: r.tier, lv: r.lv || 1 }));
  }
  function stats(day = today()) {
    const all = rounds().filter(r => !r.hidden), t = all.filter(r => r.day === day);
    return { rounds: t.length, participants: new Set(t.filter(r => r.name).map(r => key(r.name))).size, roundsAll: all.length, closed: !!cfg().closedDays[day] };
  }

  /* ---------- تقارير الأدمن ---------- */
  const avg = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0;
  const pctOf = r => Math.round(100 * Math.min(r.score, r.max) / r.max);
  function summary(day = today()) {
    const all = rounds(), rows = all.filter(r => !r.hidden && (day === 'all' || r.day === day)), named = rows.filter(r => r.name);
    const hrs = {}; rows.forEach(r => { const h = riyadh(r.ts).getUTCHours(); hrs[h] = (hrs[h] || 0) + 1; });
    const gameStat = id => { const x = rows.filter(r => r.game === id); return { id, rounds: x.length, avgPct: avg(x.map(pctOf)), best: x.length ? Math.max(...x.map(r => r.score)) : 0 }; };
    const screenStat = n => { const x = rows.filter(r => r.screen === n); return { n, rounds: x.length, avgPct: avg(x.map(pctOf)) }; };
    return { day, days: [...new Set(all.map(r => r.day))].sort().reverse().slice(0, 14), rounds: rows.length, participants: new Set(named.map(r => key(r.name))).size,
      avgPct: avg(rows.map(pctOf)), bestScore: rows.length ? Math.max(...rows.map(r => r.score)) : 0, gold: rows.filter(r => r.tier === 'gold').length,
      byGame: GAMES.map(g => gameStat(g.id)), byScreen: [1, 2].map(screenStat),
      byHour: Object.keys(hrs).map(Number).sort((a, b) => a - b).map(h => ({ hour: h, rounds: hrs[h] })), config: cfg() };
  }
  function roundsList(day = today()) {
    return rounds().filter(r => day === 'all' || r.day === day).sort((a, b) => b.ts - a.ts).slice(0, 200);
  }
  function dayReport(day = today()) {
    const rows = rounds().filter(r => !r.hidden && r.day === day && r.name), best = bestPerName(rows), played = {};
    rows.forEach(r => { played[key(r.name)] = (played[key(r.name)] || 0) + 1; });
    const at = cfg().closedDays[day];
    return { day, closed: !!at, closedAt: at || null, participants: best.length, rounds: rows.length,
      rows: best.map((r, i) => ({ rank: i + 1, name: r.name, phone: r.phone, game: r.game, screen: r.screen, score: r.score, max: r.max, tier: r.tier, roundsPlayed: played[key(r.name)] })) };
  }
  function winners(top = 3) {
    const t = today(), c = cfg(), byDay = {};
    rounds().filter(r => isNamed(r)).forEach(r => (byDay[r.day] ||= []).push(r));
    return Object.keys(byDay).sort().reverse().slice(0, 14).map(d => ({ day: d, open: d === t && !c.closedDays[d], participants: new Set(byDay[d].map(r => key(r.name))).size, rounds: byDay[d].length,
      top: bestPerName(byDay[d]).slice(0, top).map((r, i) => ({ rank: i + 1, name: r.name, phone: r.phone, score: r.score, game: r.game, screen: r.screen })) }));
  }
  function setHidden(id, hidden) { const all = rounds(), r = all.find(x => x.id === id); if (!r) return false; r.hidden = hidden; saveRounds(all); push({ t: 'hide', id, hidden: !!hidden }); return true; }
  function closeDay(day, close) { const c = cfg(); if (close) c.closedDays[day] = Date.now(); else delete c.closedDays[day]; saveCfg(c); push({ t: 'close', day, close: !!close }); }
  function setPublicUrl(u) {
    u = String(u || '').trim();
    if (u && !/^https?:\/\/\S+$/i.test(u)) return false;
    const c = cfg(); c.publicUrl = u.replace(/\/$/, ''); saveCfg(c); push({ t: 'cfg', publicUrl: c.publicUrl }); return true;
  }
  function setCrowd(on) { const c = cfg(); c.crowd = !!on; saveCfg(c); push({ t: 'cfg', crowd: !!on }); }
  function resetAll() { try { localStorage.removeItem(K.rounds); localStorage.removeItem(K.cfg); } catch (e) {} push({ t: 'reset' }); }

  /* ---------- CSV (مع منع حقن الصيغ في Excel) ---------- */
  const E = s => '"' + String(s).replace(/"/g, '""') + '"';
  const safe = s => (s.length && '=+-@\t\r'.includes(s[0]) ? "'" + s : s);
  const gname = id => (GAMES.find(g => g.id === id) || { badge: id }).badge;
  const blob = t => new Blob(['﻿' + t], { type: 'text/csv;charset=utf-8' });
  function csvDay(day) {
    const rep = dayReport(day);
    return blob('اليوم,الترتيب,الاسم,الجوال,التجربة,الشاشة,أفضل نقاط,المستوى,عدد الجولات\n' + rep.rows.map(r => [day, r.rank, E(safe(r.name)), E(safe(r.phone)), E(gname(r.game)), r.screen, r.score, r.tier, r.roundsPlayed].join(',')).join('\n'));
  }
  function csvWinners() {
    const lines = winners(3).reverse().flatMap(w => w.top.map(x => [w.day, x.rank, E(safe(x.name)), E(safe(x.phone)), x.score, E(gname(x.game)), x.screen].join(',')));
    return blob('اليوم,المركز,الاسم,الجوال,النقاط,التجربة,الشاشة\n' + lines.join('\n'));
  }
  function csvAll() {
    return blob('التاريخ,الاسم,الجوال,التجربة,الشاشة,النقاط,المستوى\n' + rounds().filter(r => r.name).sort((a, b) => a.ts - b.ts).map(r => [r.day, E(safe(r.name)), E(safe(r.phone)), E(gname(r.game)), r.screen, r.score, r.tier].join(',')).join('\n'));
  }

  /* ---------- اللاعب الحالي (تعبئة تلقائية خارج وضع الكيوسك) ---------- */
  const player = () => rd(K.player, { name: '', phone: '' });
  const savePlayer = (name, phone) => wr(K.player, { name, phone });

  return { ADMIN_PIN, today, dayOf, cleanName, cleanPhone, addRound, saveIdentity, projectedRank, board, stats, summary, roundsList, dayReport, winners,
    setHidden, closeDay, setPublicUrl, setCrowd, resetAll, init, sync, verifyPin, mode: () => mode, online: () => online, csvDay, csvWinners, csvAll, config: cfg, player, savePlayer };
})();
