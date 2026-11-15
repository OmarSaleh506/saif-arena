/* عملة ساحة سيف: وجهها الشعار، وظهرها التجربة التي خاضها اللاعب */
const COIN_PAL = { gold: ['#fff3b0', '#f2c94c', '#c8932a', '#7a4e12', '#b57d1c', '#ffe38a', '#6b440e'], silver: ['#ffffff', '#e3e9ec', '#a2aeb3', '#5d686d', '#8d999e', '#f4f8fa', '#3e494e'], bronze: ['#ffdcbc', '#e0995e', '#ab6238', '#5a2f18', '#8e4f2b', '#f3b98d', '#4a2411'] };
const COIN_LOGO = typeof LOGO !== 'undefined' ? LOGO : 'img/saif-logo.png';
const coinEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function coinHTML(g, tk, cls = '', wrap = true) {
  const layers = Array.from({ length: 15 }, (_, i) => `<div class="layer" style="transform:translateZ(calc(${((i - 7) * 1.1).toFixed(1)}px*var(--s)))"></div>`).join('');
  const lvl = g.city ? g.level : 'تحدي';
  const c = `<div class="cn t-${tk} ${cls}">${layers}<div class="edge"></div>
    <div class="face front"><img class="logo" src="${COIN_LOGO}" alt="سيف"><div class="shine"></div></div>
    <div class="face back"><div class="bi">${typeof I === 'function' ? I(g.icon) : ''}</div><div class="bl a">${coinEsc(lvl)}</div><div class="bl b ${(g.badge || g.title).length > 15 ? "l" : ""}">${coinEsc(g.badge || g.title)}</div><div class="shine"></div></div></div>`;
  return wrap ? `<div class="cn-wrap">${c}</div>` : c;
}
function coinSound() {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const ctx = new A(), t = ctx.currentTime;
    [[1318, 0], [1760, .09], [2093, .2]].forEach(([f, d]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.16, t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .5); o.connect(g); g.connect(ctx.destination); o.start(t + d); o.stop(t + d + .55); });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {}
}
function coinCelebrate(stage, tk) {
  if (!stage) return; coinSound();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.insertAdjacentHTML('beforeend', '<i class="ring"></i>' + Array.from({ length: 16 }, (_, i) => `<i class="sp" style="--a:${i * 22.5}deg;--r:${120 + (i % 3) * 38}px;--d:${(1.1 + (i % 4) * .05).toFixed(2)}s"></i>`).join(''));
  if (reduce) return;
  const p = COIN_PAL[tk] || COIN_PAL.gold, host = document.createElement('div'); host.className = 'cn-rain';
  host.style.cssText = `--g1:${p[0]};--g2:${p[1]};--g3:${p[2]};--rim:${p[4]}`;
  const n = tk === 'gold' ? 34 : tk === 'silver' ? 22 : 12;
  for (let i = 0; i < n; i++) { const c = document.createElement('i'); const sz = 24 + Math.random() * 20; c.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;--t:${(2.2 + Math.random() * 1.6).toFixed(2)}s;--dl:${(0.9 + Math.random() * 1.1).toFixed(2)}s;--dx:${((Math.random() - .5) * 160) | 0}px;--r:${(Math.random() * 540) | 0}deg`; host.appendChild(c); }
  document.body.appendChild(host); setTimeout(() => host.remove(), 5200);
}
/* رسم العملة صورة PNG (وجه وظهر) للتحميل على الجوال */
async function coinPng(g, tk, score) {
  const P = COIN_PAL[tk] || COIN_PAL.gold, W = 1600, H = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  try { await document.fonts.load('800 40px Tajawal'); } catch (e) {}
  const bg = x.createRadialGradient(W / 2, 300, 50, W / 2, H / 2, 900); bg.addColorStop(0, '#14403d'); bg.addColorStop(1, '#081A19'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const img = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const logo = await img(COIN_LOGO);
  const svgI = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent((ICONS[g.icon] || '').replace('<svg', '<svg width="240" height="240"').replace(/currentColor/g, P[6])));
  const lg = document.createElement('canvas'); lg.width = 400; lg.height = 400; const lx = lg.getContext('2d');
  if (logo) { const w = 400, h = w * logo.height / logo.width; lx.drawImage(logo, 0, (400 - h) / 2, w, h); lx.globalCompositeOperation = 'source-in'; lx.fillStyle = P[6]; lx.fillRect(0, 0, 400, 400); }
  const coin = (cx, cy, r, back) => {
    x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 40; x.shadowOffsetY = 24; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = P[2]; x.fill(); x.restore();
    const gr = x.createRadialGradient(cx - r * .35, cy - r * .4, r * .05, cx, cy, r); gr.addColorStop(0, P[0]); gr.addColorStop(.38, P[1]); gr.addColorStop(.72, P[2]); gr.addColorStop(1, P[3]);
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = gr; x.fill();
    x.lineWidth = r * .045; x.strokeStyle = P[4]; x.beginPath(); x.arc(cx, cy, r - r * .03, 0, 7); x.stroke(); x.lineWidth = r * .02; x.strokeStyle = P[5]; x.beginPath(); x.arc(cx, cy, r - r * .08, 0, 7); x.stroke();
    x.save(); x.strokeStyle = 'rgba(90,50,8,.5)'; x.lineWidth = r * .012; for (let i = 0; i < 120; i++) { const a = i / 120 * 6.2832; x.beginPath(); x.moveTo(cx + Math.cos(a) * (r * .88), cy + Math.sin(a) * (r * .88)); x.lineTo(cx + Math.cos(a) * (r * .94), cy + Math.sin(a) * (r * .94)); x.stroke(); } x.restore();
    x.lineWidth = r * .02; x.strokeStyle = 'rgba(90,50,8,.5)'; x.beginPath(); x.arc(cx, cy, r * .74, 0, 7); x.stroke();
    x.textAlign = 'center'; x.fillStyle = P[6];
    if (!back) { x.drawImage(lg, cx - r * .56, cy - r * .56, r * 1.12, r * 1.12); }
    else {
      if (svgI) x.drawImage(svgI, cx - r * .27, cy - r * .5, r * .54, r * .54);
      x.font = `800 ${r * .1}px Tajawal`; x.globalAlpha = .8; x.fillText(g.city ? g.level : 'تحدي', cx, cy + r * .2); x.globalAlpha = 1;
      let fs = r * .13; x.font = `800 ${fs}px Tajawal`; while (x.measureText(g.badge).width > r * 1.0 && fs > 14) { fs -= 2; x.font = `800 ${fs}px Tajawal`; } x.fillText(g.badge, cx, cy + r * .4);
    }
    const sh = x.createLinearGradient(cx - r, cy - r, cx + r * .2, cy + r * .2); sh.addColorStop(0, 'rgba(255,255,255,.4)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); x.beginPath(); x.arc(cx, cy, r * .96, 0, 7); x.fillStyle = sh; x.fill();
  };
  coin(430, 510, 290, false); coin(1170, 510, 290, true);
  x.fillStyle = '#F4F2EA'; x.textAlign = 'center'; x.font = '800 58px Tajawal'; x.fillText('عملة ساحة سيف', W / 2, 90);
  x.font = '700 38px Tajawal'; x.fillStyle = '#E8C77A'; x.fillText(`${g.badge} · المستوى ${({ gold: 'الذهبي', silver: 'الفضي', bronze: 'البرونزي' })[tk]}${score ? ' · ' + score + ' نقطة' : ''}`, W / 2, 140);
  x.font = '600 30px Tajawal'; x.fillStyle = '#C7D3D1'; x.fillText('SAIF 2026', W / 2, H - 50);
  return cv;
}
