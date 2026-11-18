/* كوين تجارب طويق التفاعلية (Challenge Coin): وجهه شعار سيف، وظهره جبل طويق */
const COIN_PAL = { gold: ['#fff1a8', '#f0c445', '#c28a22', '#6d4510', '#a8741a', '#ffe596', '#4a2d08'], silver: ['#ffffff', '#dfe6ea', '#9aa7ad', '#556167', '#7f8b91', '#f3f7f9', '#323c41'], bronze: ['#ffd7b3', '#dc9158', '#a65d34', '#58301a', '#8a4c2a', '#f0b184', '#3f1f0e'] };
const COIN_LOGO = 'img/saif-logo-hd.png', COIN_MT = 'img/tuwaiq-mountain-hd.png';
const TRX = s => (window.SAIF_TR ? SAIF_TR(s) : s);
const COIN_LV = [null, ['سهل', 'EASY'], ['متوسط', 'MEDIUM'], ['صعب', 'HARD']];
const COIN_TIER = { gold: ['الذهبي', 'GOLD', 3], silver: ['الفضي', 'SILVER', 2], bronze: ['البرونزي', 'BRONZE', 1] };
const coinEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const coinSerial = (g, score, n) => String(n || (1000 + (Array.from(g.id + score).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9000, 7)))).padStart(4, '0');

/* وجه من وجهي الكوين كـ SVG */
/* نص الإطار: كل حرف يُوضع بزاوية خاصة (بدل textPath) ليظهر كاملًا في كل المتصفحات */
function coinRim(str, P) {
  const W = c => c === ' ' ? .55 : c === '•' ? .6 : /[IJ1]/.test(c) ? .45 : /[WM&]/.test(c) ? 1.05 : .8, ch = [...str], tot = ch.reduce((a, c) => a + W(c), 0);
  let acc = 0;
  return `<g font-size="11.5" font-weight="800" fill="${P[3]}" stroke="${P[5]}" stroke-width=".25" paint-order="stroke" text-anchor="middle">` + ch.map(c => {
    const a = -90 + (acc + W(c) / 2) / tot * 360; acc += W(c);
    return c === ' ' ? '' : `<text x="100" y="19" transform="rotate(${a.toFixed(2)} 100 100)">${c === '&' ? '&amp;' : c}</text>`;
  }).join('') + '</g>';
}

function coinFace(g, tk, face, o = {}) {
  const P = COIN_PAL[tk] || COIN_PAL.gold, T = COIN_TIER[tk] || COIN_TIER.gold, u = 'c' + face + Math.random().toString(36).slice(2, 7);
  const th = o.scr === 2 ? ['#9a4a3b', '#c0644f', '#5a2a21'] : ['#1d6086', '#3a8db5', '#0e3150'];
  const rim = face === 'f' ? 'SAIF  •  SECURITY & INNOVATION FAIR  •  2026  •  TUWAIQ ACADEMY  •' : `TUWAIQ INTERACTIVE EXPERIENCES  •  ${T[1]} LEVEL  •  2026  •`;
  const stars = Array.from({ length: 3 }, (_, i) => `<path d="M0-6.2 1.9-1.9 6.4-1.6 3-1.1 4.1 3.5 0 1.2-4.1 3.5-3-1.1-6.4-1.6-1.9-1.9Z" transform="translate(${(i - 1) * 15} 0)" fill="${i < T[2] ? P[0] : 'rgba(0,0,0,.35)'}" ${i < T[2] ? `filter="url(#${u}g)"` : ''}/>`).join('');
  const mt = o.mtData || COIN_MT;
  const lg = o.logoData || COIN_LOGO;
  const content = face === 'f'
    ? `<image href="${lg}" x="38" y="52" width="124" height="70" preserveAspectRatio="xMidYMid meet" filter="url(#${u}g)"/><g transform="translate(100 146)">${stars}</g>`
    : `<image href="${mt}" x="40" y="58" width="120" height="61" preserveAspectRatio="xMidYMid meet" filter="url(#${u}g)"/><g transform="translate(100 139)">${stars}</g>${o.lv ? `<text x="100" y="48" text-anchor="middle" font-size="7" font-weight="800" letter-spacing="2.2" fill="${P[1]}" font-family="Tajawal,system-ui,sans-serif">${COIN_LV[o.lv] ? COIN_LV[o.lv][1] : ''}</text>` : ''}<text x="100" y="157" text-anchor="middle" font-size="7.5" font-weight="700" letter-spacing="1.5" fill="${P[1]}" font-family="monospace">No. ${coinSerial(g, o.score || 0, o.n)}</text>`;
  return `<svg class="cf" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${o.style ? ' style="' + o.style + '"' : ''}>${o.defs || ''}<defs>
    <linearGradient id="${u}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset=".35" stop-color="${P[1]}"/><stop offset=".7" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></linearGradient>
    <linearGradient id="${u}n" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${P[1]}"/><stop offset=".5" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient>
    <radialGradient id="${u}e" cx=".3" cy=".25" r="1"><stop offset="0" stop-color="${th[1]}"/><stop offset=".6" stop-color="${th[0]}"/><stop offset="1" stop-color="${th[2]}"/></radialGradient>
    <radialGradient id="${u}x" cx=".3" cy=".22" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="${u}g" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feFlood flood-color="${P[0]}" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in" result="c"/><feDropShadow in="c" dx="0" dy="1.3" stdDeviation=".35" flood-color="#000" flood-opacity=".55"/></filter>
    <filter id="${u}s"><feDropShadow dx="0" dy=".9" stdDeviation=".5" flood-color="#000" flood-opacity=".7"/></filter>
    <path id="${u}p" d="M100,100 m-81,0 a81,81 0 1,1 162,0 a81,81 0 1,1 -162,0"/></defs>
    <g font-family="Tajawal,system-ui,sans-serif">
    <circle cx="100" cy="100" r="99" fill="url(#${u}m)" stroke="${P[4]}" stroke-width="2"/>
    <circle cx="100" cy="100" r="95.5" fill="none" stroke="${P[3]}" stroke-opacity=".55" stroke-width="4.4" stroke-dasharray="1.5 2.3"/>
    <circle cx="100" cy="100" r="91" fill="none" stroke="${P[3]}" stroke-width="1.4"/><circle cx="100" cy="100" r="89.8" fill="none" stroke="${P[5]}" stroke-opacity=".8" stroke-width=".8"/>
    ${coinRim(rim, P)}
    <circle cx="100" cy="100" r="72.5" fill="url(#${u}n)" stroke="${P[3]}" stroke-width="1.4"/><circle cx="100" cy="100" r="67.5" fill="${P[3]}"/>
    <circle cx="100" cy="100" r="66" fill="url(#${u}e)"/><circle cx="100" cy="100" r="66" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2.4"/>
    ${content}
    <circle cx="100" cy="100" r="99" fill="url(#${u}x)" pointer-events="none"/></g></svg>`;
}

function coinHTML(g, tk, cls = '', wrap = true, o = {}) {
  const layers = Array.from({ length: 15 }, (_, i) => `<div class="layer" style="transform:translateZ(calc(${((i - 7) * 1.1).toFixed(1)}px*var(--s)))"></div>`).join('');
  const c = `<div class="cn t-${tk} ${cls}">${layers}<div class="edge"></div>
    <div class="face front">${coinFace(g, tk, 'f', o)}<div class="shine"></div></div>
    <div class="face back">${coinFace(g, tk, 'b', o)}<div class="shine"></div></div></div>`;
  return wrap ? `<div class="cn-wrap">${c}</div>` : c;
}
function coinSound() {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const ctx = new A(), t = ctx.currentTime;
    [[1568, 0], [2093, .08], [2637, .17]].forEach(([f, d]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.15, t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .7); o.connect(g); g.connect(ctx.destination); o.start(t + d); o.stop(t + d + .75); });
    setTimeout(() => ctx.close(), 1600);
  } catch (e) {}
}
function coinCelebrate(stage, tk) {
  if (!stage) return; coinSound();
  stage.insertAdjacentHTML('afterbegin', '<i class="rays"></i>');
  stage.insertAdjacentHTML('beforeend', '<i class="ring"></i><i class="ring r2"></i>' + Array.from({ length: 18 }, (_, i) => `<i class="sp" style="--a:${i * 20}deg;--r:${115 + (i % 3) * 40}px;--d:${(1.05 + (i % 4) * .05).toFixed(2)}s"></i>`).join(''));
}
/* الكوين صورة PNG (وجه وظهر) للتحميل على الجوال */
async function coinPng(g, tk, score, o = {}) {
  const P = COIN_PAL[tk] || COIN_PAL.gold, T = COIN_TIER[tk] || COIN_TIER.gold, W = 1600, H = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const b64 = async (u, mime) => { try { const r = await fetch(u); const bl = await r.blob(); return await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(bl); }); } catch (e) { return ''; } };
  const [logoData, mtData, fAr, fLa] = await Promise.all([b64(COIN_LOGO), b64(COIN_MT), b64('fonts/tajawal-arabic-800-normal.woff2'), b64('fonts/tajawal-latin-800-normal.woff2')]);
  const defs = `<style>@font-face{font-family:Tajawal;font-weight:800;src:url(${fAr}) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF}@font-face{font-family:Tajawal;font-weight:800;src:url(${fLa}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}</style>`;
  try { await document.fonts.load('800 40px Tajawal'); } catch (e) {}
  const bg = x.createRadialGradient(W / 2, 300, 50, W / 2, H / 2, 900); bg.addColorStop(0, '#14403d'); bg.addColorStop(1, '#081A19'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const draw = (svg, cx, cy, r) => new Promise(res => { const i = new Image(); i.onload = () => { x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 36; x.shadowOffsetY = 22; x.fillStyle = '#000'; x.beginPath(); x.arc(cx, cy, r * .985, 0, 7); x.fill(); x.restore(); x.drawImage(i, cx - r, cy - r, r * 2, r * 2); res(); }; i.onerror = res; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="800" height="800" ')); });
  const oo = Object.assign({}, o, { score, logoData, mtData, defs });
  await draw(coinFace(g, tk, 'f', oo), 430, 510, 290); await draw(coinFace(g, tk, 'b', oo), 1170, 510, 290);
  x.fillStyle = '#F4F2EA'; x.textAlign = 'center'; x.font = '800 58px Tajawal'; x.fillText(TRX('كوين تجارب طويق التفاعلية'), W / 2, 90);
  x.font = '700 38px Tajawal'; x.fillStyle = '#E8C77A'; x.fillText(TRX(`${g.badge} · ${o.lv ? 'الصعوبة ' + COIN_LV[o.lv][0] + ' · ' : ''}المستوى ${T[0]}${score ? ' · ' + score + ' نقطة' : ''}`), W / 2, 140);
  x.font = '600 30px Tajawal'; x.fillStyle = '#C7D3D1'; x.fillText('SAIF 2026', W / 2, H - 50);
  return cv;
}
