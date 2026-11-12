/* أدوات مشتركة: مبنية على نفس أدوات ساحة سيف الأصلية (الألعاب تعتمد عليها بنفس الأسماء) */
const LOGO = 'img/saif-logo.png';
const I = n => `<span class="ic">${ICONS[n] || ''}</span>`;
const inner = n => (ICONS[n] || '').replace(/^<svg[^>]*>|<\/svg>$/g, '');
const stage = document.getElementById('stage');
const viewport = document.getElementById('viewport');
const $ = (s, el = stage) => el.querySelector(s);
const $$ = (s, el = stage) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* لوحة اللعب 1920×1080 تتمدد لتناسب النافذة (أي شاشة) */
let SCALE = 1;
function fit() {
  const vw = window.innerWidth, vh = window.innerHeight;
  SCALE = Math.min(vw / 1920, vh / 1080);
  stage.style.transform = `translate(${(vw - 1920 * SCALE) / 2}px,${(vh - 1080 * SCALE) / 2}px) scale(${SCALE})`;
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 150));
if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
fit();
const pt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE }; };

let S = { screen: 0, game: null, left: 0, score: 0 }, tick = null, cleanups = [];
const onClean = f => cleanups.push(f);
function stopAll() { clearInterval(tick); tick = null; cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; }
function toast(m) {
  const inGame = !viewport.hidden, t = document.createElement('div');
  t.className = inGame ? 'toast' : 'sa-toast'; t.textContent = m;
  (inGame ? stage : document.getElementById('toasts')).appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const topbar = (sub, hud) => `<div class="top"><div class="brand"><img src="${LOGO}" alt="سيف"><div><div class="nm">ساحة سيف</div><div class="sub">${esc(sub)}</div></div></div><div class="hud">${hud}</div></div>`;
