/* قشرة ساحة سيف: الرئيسية (شاشتان) + لوحة المتصدرين الجانبية + النتيجة + تشغيل التجارب */
const app = document.getElementById('app');
const KIOSK = new URLSearchParams(location.search).has('kiosk');
/* وضع الجوال: يفتحه الزائر من QR الزحمة، ويُظهر التبديل بين المحورين */
const MOBILE = new URLSearchParams(location.search).has('m') || window.innerWidth < 700;

/* ---------- الشاشتان وأقسامهما ---------- */
const SCREENS = {
  1: { n: 1, tone: 'coral', icon: 'ShieldCheck', icons: ['Puzzle', 'Bug', 'Fingerprint', 'ShieldAlert'], name: 'درع سيف',
    topic: 'الأمن السيبراني', kicker: 'الشاشة 1 · الأمن السيبراني', title: 'احمِ الفضاء الرقمي',
    hook: 'فكّ الشيفرات، صُدّ الهجمات، واكشف المتسلل قبل أن يصل إلى الخادم.',
    sections: [
      { icon: 'Puzzle', title: 'فكّ الشيفرة', sub: 'ألغاز وشبكات تختبر ذكاءك قبل أن يسبقك المخترق', games: ['puzzle', 'network'] },
      { icon: 'Swords', title: 'في قلب المعركة', sub: 'اخترق تطبيقًا لتعرف نقاط ضعفه، ثم أغلقها وصُدّ الهجوم', games: ['vuln', 'defend'] },
      { icon: 'Search', title: 'غرفة التحقيق', sub: 'تتبّع الأدلة واكشف المتسلل المختبئ بين السجلات', games: ['forensic', 'b5'] },
    ] },
  2: { n: 2, tone: 'blue', icon: 'Bot', icons: ['Eye', 'Cpu', 'Plane', 'Radar'], name: 'عقل سيف',
    topic: 'الذكاء الاصطناعي والبيانات', kicker: 'الشاشة 2 · الذكاء الاصطناعي والبيانات', title: 'علّم الآلة وابنِ مدينة المستقبل',
    hook: 'اكشف المزيّف، درّب نموذجًا، وشغّل مدينة ذكية بالدرونز والروبوتات.',
    sections: [
      { icon: 'Eye', title: 'هل تثق بما ترى؟', sub: 'ميّز الحقيقي من المولّد بالذكاء الاصطناعي، وجِد الشاذ بين مئات النقاط', games: ['deepfake', 'pattern'] },
      { icon: 'Lightbulb', title: 'درّب عقلًا آليًا', sub: 'صنّف الرسائل وحلّل بيانات الزوار، وشاهد القرار يتحسّن', games: ['ml', 'b2'] },
      { icon: 'MapPin', title: 'مدينة المستقبل', sub: 'عيون ترى، درونز تطير، وروبوتات تحرس: ابنِ مدينتك الذكية', games: ['b1', 'b3', 'b4'] },
    ] },
};
const SCREEN_OF = {};
Object.values(SCREENS).forEach(s => s.sections.forEach(sec => sec.games.forEach(id => { SCREEN_OF[id] = s.n; })));
const screenGames = n => SCREENS[n].sections.flatMap(s => s.games.map(G));
const mins = n => Math.max(1, Math.round(screenGames(n).reduce((a, g) => a + g.time, 0) / 60));

/* ---------- حالة العرض ---------- */
let view = { name: 'home', screen: 1 };
let boardFilter = 0, autoBack = null;
const playing = () => document.body.classList.contains('playing');

function parseHash() {
  const h = location.hash.replace('#', '');
  if (h === 'admin') return { name: 'admin' };
  const m = h.match(/^s([1-9])$/);
  return { name: 'home', screen: m ? Math.min(2, +m[1]) : view.screen || 1 };
}

/* ---------- شارة النتيجة (من ساحة سيف الأصلية) ---------- */
function tier(r) { return r >= 0.85 ? ['gold', 'الذهبي', '#E8C77A', '#B8893A'] : r >= 0.6 ? ['silver', 'الفضي', '#DCE3E2', '#9AA9A7'] : ['bronze', 'البرونزي', '#E2A37E', '#A9603F']; }
const TIER_AR = { gold: 'الذهبي', silver: 'الفضي', bronze: 'البرونزي' };
function hex(icon, t) {
  return `<svg class="hex" viewBox="0 0 200 220" role="img" aria-label="شارة"><defs><linearGradient id="hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t[2]}"/><stop offset="1" stop-color="${t[3]}"/></linearGradient><linearGradient id="hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F4A48"/><stop offset="1" stop-color="#0E2726"/></linearGradient></defs>
  <path d="M100 6 L186 54 V156 L100 214 L14 156 V54 Z" fill="url(#hr)"/><path d="M100 22 L172 62 V150 L100 198 L28 150 V62 Z" fill="url(#hi)"/><path d="M100 30 L164 66 V146 L100 190 L36 146 V66 Z" fill="none" stroke="rgba(132,182,198,.35)" stroke-width="2"/>
  <g transform="translate(58 62) scale(3.5)" stroke="#F4F2EA" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner(icon)}</g>
  <text x="100" y="176" text-anchor="middle" font-family="Tajawal,sans-serif" font-weight="800" font-size="20" fill="${t[2]}" direction="ltr">SAIF 2026</text></svg>`;
}
function qrSvg(text) {
  try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: 'رمز QR لفتح ساحة سيف' }); } catch (e) { return ''; }
}
const siteUrl = () => SaifStore.config().publicUrl || (location.origin + location.pathname);
const playUrl = () => siteUrl().replace(/[?#].*$/, '') + '?m=1';
const medal = n => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M8 14l-2 8 6-3 6 3-2-8" fill="currentColor" opacity=".55"/><text x="12" y="12" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0C2423" font-family="Tajawal,sans-serif">${n}</text></svg>`;

/* ---------- مكوّنات مشتركة ---------- */
function header() {
  const fs = document.fullscreenEnabled ? `<button type="button" class="sa-chip" id="fs" aria-label="ملء الشاشة">${I('Monitor')}<span>ملء الشاشة</span></button>` : '';
  return `<header class="sa-top"><a class="sa-brand" href="#s${view.screen || 1}"><img src="${LOGO}" alt=""><span><b>ساحة سيف</b><small>${SCREENS[view.screen || 1].topic}</small></span></a><div class="sa-top-acts">${fs}</div></header>`;
}
const crowdBlock = () => (SaifStore.config().crowd && !MOBILE) ? `<div class="sa-crowd"><div class="sa-crowd-qr">${qrSvg(playUrl())}</div><div><b>${I('QrCode')} الدور طويل؟ العب من جوالك</b><small>امسح الرمز وسجّل نتيجتك، وتظهر هنا في الصدارة.</small></div></div>` : '';
function boardPanel(hl) {
  const rows = SaifStore.board({ limit: 10 }), st = SaifStore.stats();
  const g = id => (G(id) || { badge: '' }).badge;
  const list = rows.length ? rows.map(r => `<li class="sa-row r${r.rank}${hl && r.id === hl ? ' me' : ''}" style="--i:${r.rank}"><span class="sa-rk">${r.rank <= 3 ? medal(r.rank) : r.rank}</span><span class="sa-nm"><b>${esc(r.name)}</b><small>${esc(g(r.game))}</small></span><span class="sa-sc">${r.score}</span></li>`).join('')
    : `<li class="sa-empty"><span>${I('Trophy')}</span><b>الصدارة تنتظر بطلها</b><small>أنهِ أي تجربة وسجّل اسمك لتكون أول المتصدرين اليوم.</small></li>`;
  return `<section class="sa-board" aria-label="لوحة المتصدرين">
    <header><span class="sa-trophy">${I('Trophy')}</span><div><h2>متصدرو اليوم</h2><small>أفضل نتيجة لكل مشارك</small></div><span class="sa-live"><i></i>مباشر</span></header>
    <ol class="sa-rows">${list}</ol>
    ${crowdBlock()}
    <footer><span><b>${st.participants}</b> مشارك</span><span><b>${st.rounds}</b> جولة اليوم</span></footer></section>`;
}
let boardHL = null;
function refreshBoard() {
  const side = document.getElementById('side');
  if (!side || playing()) return;
  const rowsOld = side.querySelector('.sa-rows'), top = rowsOld ? rowsOld.scrollTop : 0;
  side.innerHTML = boardPanel(boardHL);
  const mini = document.getElementById('mini'); if (mini) mini.innerHTML = miniBoard();
  const r = side.querySelector('.sa-rows'); if (r) r.scrollTop = top;
}
function bindShell() {
  const fs = document.getElementById('fs');
  if (fs) fs.onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };
  const side = document.getElementById('side');
  if (side) side.onclick = e => { const b = e.target.closest('[data-bf]'); if (b) { boardFilter = +b.dataset.bf; refreshBoard(); } };
}

/* ---------- الرئيسية ---------- */
const LVL = { 'سهل': 'easy', 'متوسط': 'mid', 'سريع': 'fast', 'متقدم': 'hard' };
const gameCard = (g, i) => `<button type="button" class="sa-gcard" data-g="${g.id}" style="--i:${i}" aria-label="${esc(g.title)}">
  <span class="sa-pv" aria-hidden="true">${PV.html(g.id)}</span>
  <span class="sa-gico">${I(g.icon)}</span>
  <span class="sa-gbody"><b>${esc(g.title)}</b><span class="sa-gdesc">${esc(g.desc)}</span></span>
  <span class="sa-gmeta"><span class="sa-gtime">${I('Timer')} ${fmt(g.time)}</span><span class="sa-gplay">${I('Play')} اعرف كيف تلعب</span></span></button>`;

/* ---------- شرح التحدي قبل البدء ---------- */
let introTimer = null;
function closeIntro() {
  clearTimeout(introTimer);
  const el = document.getElementById('intro'); if (el) { el.remove(); document.body.classList.remove('modal-open'); }
  document.removeEventListener('keydown', introKey);
}
const introKey = e => { if (e.key === 'Escape') closeIntro(); };
function openIntro(id) {
  closeIntro();
  const g = G(id), h = HOWTO[id] || { goal: g.desc, steps: [], tip: '' }, tone = SCREENS[SCREEN_OF[id] || 1].tone;
  const el = document.createElement('div'); el.id = 'intro'; el.className = 'sa-intro ' + tone;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'intro-t');
  el.innerHTML = `<div class="sa-intro-card">
    <button type="button" class="sa-intro-x" id="intro-x" aria-label="إغلاق">${I('X')}</button>
    <div class="sa-intro-art"><div class="sa-pv big" aria-hidden="true">${PV.html(id)}</div>
      <div class="sa-intro-meta"><span>${I('Timer')} ${fmt(g.time)}</span></div></div>
    <div class="sa-intro-body">
      <small class="sa-intro-k">${I('Lightbulb')} شرح سريع قبل أن تبدأ</small>
      <h2 id="intro-t">${esc(g.title)}</h2>
      <p class="sa-intro-goal"><b>الهدف:</b> ${esc(h.goal)}</p>
      <ol class="sa-intro-steps">${h.steps.map((t, k) => `<li><b>${k + 1}</b><span>${esc(t)}</span></li>`).join('')}</ol>
      ${h.tip ? `<p class="sa-intro-tip">${I('Sparkles')}<span>${esc(h.tip)}</span></p>` : ''}
      <div class="sa-intro-acts"><button type="button" class="sa-btn" id="intro-go">${I('Play')} ابدأ التحدي</button><button type="button" class="sa-btn ghost" id="intro-back">رجوع</button></div>
    </div></div>`;
  document.body.appendChild(el); document.body.classList.add('modal-open'); PV.freeze(el);
  document.addEventListener('keydown', introKey);
  el.onpointerdown = e => { if (e.target === el) closeIntro(); };
  $('#intro-x', el).onclick = $('#intro-back', el).onclick = closeIntro;
  $('#intro-go', el).onclick = () => { closeIntro(); start(id); };
  $('#intro-go', el).focus();
  if (KIOSK) introTimer = setTimeout(closeIntro, 90000);
}

function miniBoard() {
  const rows = SaifStore.board({ limit: 3 });
  if (!rows.length) return `<span class="sa-mini-t">${I('Trophy')} الصدارة تنتظر بطلها</span>`;
  return `<span class="sa-mini-t">${I('Trophy')} المتصدرون</span>${rows.map(r => `<span class="sa-mini-r r${r.rank}"><b>${r.rank}</b>${esc(r.name)}<em>${r.score}</em></span>`).join('')}`;
}
const footer = () => `<footer class="sa-foot"><img src="${LOGO}" alt=""><span>ساحة سيف · SAIF 2026</span><small>الأمن السيبراني والذكاء الاصطناعي</small></footer>`;
function confetti(t) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = document.createElement('div'); host.className = 'sa-confetti'; document.body.appendChild(host);
  const cols = t[0] === 'gold' ? ['#E8C77A', '#F4F2EA', '#C9705F', '#84B6C6'] : ['#DCE3E2', '#84B6C6', '#F4F2EA'];
  for (let i = 0; i < 34; i++) {
    const c = document.createElement('i'); c.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};--dx:${(Math.random() - .5) * 220}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * .35}s;animation-duration:${1.6 + Math.random() * 1.2}s`;
    host.appendChild(c);
  }
  setTimeout(() => host.remove(), 3200);
}
function renderHome() {
  clearTimeout(autoBack); closeIntro();
  const sc = SCREENS[view.screen], st = SaifStore.stats(), N = screenGames(view.screen).length;
  let idx = 0;
  const sections = sc.sections.map((sec, k) => `<section class="sa-sec" aria-labelledby="sec${k}">
    <header><span class="sa-sico">${I(sec.icon)}</span><div><small>القسم ${k + 1}</small><h3 id="sec${k}">${sec.title}</h3><p>${sec.sub}</p></div><span class="sa-schip">${sec.games.length} تجارب · ${Math.max(1, Math.round(sec.games.reduce((a, id) => a + G(id).time, 0) / 60))} د</span></header>
    <div class="sa-grid">${sec.games.map(id => gameCard(G(id), idx++)).join('')}</div></section>`).join('');
  app.innerHTML = `${header()}<div class="sa-layout">
    <main class="sa-main ${sc.tone}" id="main">
      <section class="sa-hero"><span class="sa-eyebrow">${I(sc.icon)} ${sc.topic}</span>
        <h1><span class="grad">${sc.title}</span></h1>
        <p>${sc.hook}</p>
        <div class="sa-gchips"><i>${I('Play')} ${N} تجارب</i><i>${I('Timer')} نحو ${mins(view.screen)} دقيقة</i><i>${I('Trophy')} تنافس على الصدارة</i></div>
        ${st.closed ? `<p class="sa-banner">${I('Lock')} انتهت فعالية اليوم. يمكنك اللعب، لكن النتائج لن تُسجَّل في الصدارة.</p>` : ''}
        <ol class="sa-steps"><li><b>1</b><span>اختر تحديًا وتعرّف على طريقته</span></li><li><b>2</b><span>العب وسجّل أعلى نتيجة</span></li><li><b>3</b><span>اكتب اسمك وتصدّر اللوحة</span></li></ol></section>
      ${MOBILE ? `<nav class="sa-tabs" aria-label="المحاور">${[1, 2].map(n => `<a href="#s${n}" class="${SCREENS[n].tone}${view.screen === n ? ' on' : ''}">${I(SCREENS[n].icon)}<span>${SCREENS[n].topic}</span></a>`).join('')}</nav>` : ''}
      <div class="sa-mini" id="mini">${miniBoard()}</div>
      <div id="sections" class="sa-sections">${sections}</div>
    </main>
    <aside class="sa-side" id="side">${boardPanel(null)}</aside></div>${footer()}`;
  bindShell(); PV.freeze(app);
  $$('[data-g]', app).forEach(b => b.onclick = () => openIntro(b.dataset.g));
}

/* ---------- تشغيل تجربة ---------- */
function start(id) {
  closeIntro(); stopAll();
  const g = G(id); S.game = g; S.left = g.time; S.score = 0; S.screen = SCREEN_OF[id] || 1;
  document.body.classList.add('playing'); document.body.classList.remove('rot-ok');
  app.hidden = true; viewport.hidden = false; window.scrollTo(0, 0); fit();
  stage.innerHTML = `<div class="gridbg"></div>${topbar(g.city ? g.level + ' · ' + g.badge : g.title, `<div class="pill" id="tm">${I('Timer')}<b>${fmt(g.time)}</b></div><div class="pill">${I('Star')}<b id="sc">0</b></div><button class="pill" id="home">${I('House')} الرئيسية</button>`)}<div id="gm"></div>`;
  $('#home').onclick = leave;
  const api = {
    el: $('#gm'),
    add(n) { S.score = Math.max(0, S.score + n); $('#sc').textContent = S.score; },
    set(n) { S.score = Math.max(0, Math.round(n)); $('#sc').textContent = S.score; },
    end: o => result(o || {}), onTimeout: null,
  };
  tick = setInterval(() => {
    S.left--; const el = $('#tm'); if (el) { el.querySelector('b').textContent = fmt(Math.max(0, S.left)); el.classList.toggle('warn', S.left <= 10); }
    if (S.left <= 0) { clearInterval(tick); tick = null; api.onTimeout ? api.onTimeout() : result({ timeout: true }); }
  }, 1000);
  RUN[id](api, g);
}
function endCanvas() { stopAll(); stage.innerHTML = ''; viewport.hidden = true; app.hidden = false; document.body.classList.remove('playing'); }
function leave() { endCanvas(); view = { name: 'home', screen: SCREEN_OF[S.game && S.game.id] || view.screen || 1 }; location.hash = 's' + view.screen; render(); }

/* ---------- النتيجة ---------- */
function result(o) {
  endCanvas();
  const g = S.game, max = o.max || 1000, score = Math.min(S.score, max), t = tier(score / max);
  const roundId = SaifStore.addRound({ game: g.id, screen: SCREEN_OF[g.id] || 1, score, max, tier: t[0] });
  view = { name: 'result', screen: SCREEN_OF[g.id] || 1, res: { g, o, score, max, t, roundId, saved: null, rank: SaifStore.projectedRank(score) } };
  boardHL = null; render(); window.scrollTo(0, 0);
}
function renderResult() {
  const r = view.res, { g, o, score, t } = r, scr = view.screen, closed = SaifStore.stats().closed, pl = KIOSK ? { name: '', phone: '' } : SaifStore.player();
  const lIcons = ['Lock', 'Eye', 'ShieldAlert', 'Fingerprint'], first = !r.celebrated;
  const coinUrl = siteUrl().replace(/[?#].*$/, '').replace(/[^/]*$/, '') + `coin.html?g=${encodeURIComponent(g.id)}&t=${t[0]}&s=${score}`;
  const form = r.saved ? `<div class="sa-saved">${I('CircleCheck')}<span>تم تسجيلك باسم <b>${esc(r.saved.name)}</b> · المركز <b>#${r.rank}</b> اليوم</span></div>`
    : closed ? `<p class="sa-banner">${I('Lock')} انتهت فعالية اليوم، لا يمكن تسجيل أسماء جديدة في الصدارة.</p>`
    : `<form class="sa-form" id="idf" novalidate>
        <label>اسمك<input name="name" maxlength="24" autocomplete="${KIOSK ? 'off' : 'name'}" placeholder="كيف نناديك؟" value="${esc(pl.name)}" required></label>
        <label>رقم الجوال<input name="phone" inputmode="tel" dir="ltr" autocomplete="${KIOSK ? 'off' : 'tel'}" placeholder="05xxxxxxxx" value="${esc(pl.phone)}" required></label>
        <p class="sa-note">رقمك للتواصل بخصوص الفعالية والجوائز فقط، ولا يظهر في لوحة الصدارة.</p>
        <p class="sa-err" id="err" role="alert" hidden></p>
        <button type="submit" class="sa-btn">${I('Trophy')} سجّل اسمي في الصدارة</button></form>`;
  app.innerHTML = `${header()}<div class="sa-layout"><main class="sa-main"><section class="sa-result">
    <article class="sa-glass sa-score"><p class="sa-rhead">${o.timeout ? 'انتهى الوقت، وحصلت على عملة' : esc(o.head || 'أحسنت! حصلت على عملة')}</p>
      <div class="cn-stage ${first ? 'cn-drop' : ''}" id="cnst">${coinHTML(g, t[0], 'lg', true)}</div><h2>${esc(g.badge)}</h2><p class="sa-rlevel" style="color:${t[2]}">المستوى ${t[1]}${o.detail ? ' · ' + esc(o.detail) : ''}</p>
      <div class="sa-big"><b class="grad">${score}</b><span>نقطة</span></div><p class="sa-rank">${r.saved ? 'ترتيبك' : 'ترتيبك المتوقع'} <b>#${r.rank}</b> اليوم</p>
      <div id="idwrap">${form}</div>
      <div class="sa-acts"><button type="button" class="sa-btn" id="ag">${I('RotateCcw')} العب مرة أخرى</button><button type="button" class="sa-btn ghost" id="ot">${I('House')} تحدٍّ آخر</button></div>
      ${KIOSK ? '<p class="sa-muted" id="bk"></p>' : ''}</article>
    <article class="sa-glass sa-learn"><h3>ماذا <span class="grad">تعلّمت؟</span></h3>${g.learn.map((l, i) => `<div class="sa-lii"><span class="k">${I(lIcons[i % 4])}</span><div>${esc(l)}</div></div>`).join('')}</article>
    <article class="sa-glass sa-bag"><h3><span class="coral">${I('Award')}</span> خذ <span class="grad">عملتك</span> معك</h3>
      <div class="sa-qr">${qrSvg(coinUrl)}</div><p class="sa-cap">امسح الرمز بجوالك لتحمّل عملة «${esc(g.badge)}» كصورة</p></article>
  </section></main><aside class="sa-side" id="side">${boardPanel(boardHL)}</aside></div>${footer()}`;
  bindShell();
  if (first) { r.celebrated = true; coinCelebrate($('#cnst', app), t[0]); if (t[0] !== 'bronze') confetti(t); }
  const back = () => { view = { name: 'home', screen: scr }; location.hash = 's' + scr; render(); window.scrollTo(0, 0); };
  $('#ag', app).onclick = () => start(g.id);
  $('#ot', app).onclick = back;
  const f = $('#idf', app);
  if (f) f.onsubmit = e => {
    e.preventDefault();
    const nm = f.name.value, ph = f.phone.value, out = SaifStore.saveIdentity(r.roundId, nm, ph), er = $('#err', app);
    if (!out.ok) { er.hidden = false; er.textContent = out.err === 'name' ? 'اكتب اسمًا من حرفين إلى 24 حرفًا.' : out.err === 'phone' ? 'اكتب رقم جوال صحيحًا، مثل 0501234567.' : out.err === 'closed' ? 'انتهت فعالية اليوم.' : 'تعذّر الحفظ، حاول مرة أخرى.'; shake(f); return; }
    if (!KIOSK) SaifStore.savePlayer(out.name, out.phone);
    r.saved = out; r.rank = out.rank; boardHL = r.roundId; renderResult(); toast('تم حفظ اسمك في لوحة الصدارة');
  };
  if (KIOSK) {   // وضع الكيوسك: عودة تلقائية للرئيسية بعد 30 ثانية من عدم اللمس
    let n = 30; const upd = () => { const b = $('#bk', app); if (b) b.textContent = `يعود للرئيسية خلال ${n} ث`; }; upd();
    clearTimeout(autoBack);
    const loop = () => { n--; upd(); if (n <= 0) back(); else autoBack = setTimeout(loop, 1000); };
    autoBack = setTimeout(loop, 1000);
    app.onpointerdown = app.onkeydown = () => { n = 30; upd(); };
  }
}

/* ---------- التوجيه ---------- */
function render() {
  document.title = 'ساحة سيف'; app.hidden = playing(); app.onpointerdown = app.onkeydown = null;
  document.body.classList.toggle('is-admin', view.name === 'admin');
  if (view.name === 'result' && view.res) return renderResult();
  if (view.name === 'admin') { clearTimeout(autoBack); return AdminView.render(app); }
  renderHome();
}
function boot() {
  document.getElementById('rot').hidden = false;
  document.getElementById('rot-ok').onclick = () => document.body.classList.add('rot-ok');
  view = parseHash(); render();
  SaifStore.init().then(m => { if (m === 'remote' && !playing() && view.name !== 'result') { if (view.name === 'admin') render(); else refreshBoard(); } });
  window.addEventListener('hashchange', () => {
    if (playing()) return;
    const v = parseHash();
    view = v; render();
  });
  window.addEventListener('storage', () => { if (view.name !== 'admin') refreshBoard(); });
  setInterval(async () => { if (!playing() && view.name !== 'admin') { await SaifStore.sync(); refreshBoard(); } }, 5000);
}
