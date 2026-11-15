/* تجربة محلل البيانات: معرض ثلاثي الأبعاد كامل بقرارات تشغيلية مباشرة */
(() => {
  const loadScript = src => new Promise((res, rej) => { if (window.Expo3D) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
  const Q = [
    { text: 'كيف وصلت إلى المعرض؟', opts: ['سيارة', 'مترو', 'تاكسي'], sub: ['أوقفتها في المواقف', 'نزلت من محطة المترو', 'نزلت عند محطة التاكسي'], cam: ['car', 'metro', 'taxi'] },
    { text: 'متى ناوي تطلع؟', opts: ['8:30', '9:00', '9:30', '10:00', '10:30'], sub: ['', '', '', '', ''] },
    { text: 'من أي بوابة بتطلع؟', opts: ['الجنوبية', 'الغربية', 'الشرقية'], sub: ['المواجهة للمواقف', 'جهة المسرح', 'جهة القاعة A'], cam: ['g0', 'g1', 'g2'] },
  ];
  const BASE = [[70, 52, 26], [12, 20, 31, 61, 24], [92, 34, 22]], titles = ['وصول الزوار', 'وقت المغادرة المتوقع', 'بوابة المغادرة'], GN = ['الجنوبية', 'الغربية', 'الشرقية'];
  const clk = m => { const h = Math.floor(m / 60) % 12 || 12, mm = String(Math.floor(m % 60)).padStart(2, '0'); return `${h}:${mm}`; };

  RUN.b2 = async api => {
    let dead = false, E = null; onClean(() => { dead = true; try { E && E.destroy(); } catch (e) {} });
    api.el.innerHTML = `<div class="x3"><div class="x3c" id="x3c"></div><div class="x3load" id="x3l"><i></i>جارٍ بناء المعرض…</div><div id="x3u"></div></div>`;
    try {
      await loadScript('js/expo3d.js'); if (dead) return;
      const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('nogl');
      E = Expo3D.create($('#x3c'), {}); await new Promise(r => setTimeout(r, 350));
    } catch (e) { if (!dead) return RUN.b2_flat(api); return; }
    if (dead) return; $('#x3l').remove();
    const U = $('#x3u'), a = []; let d1 = null, d2 = null, phase = 'q', yourData = null;
    api.onTimeout = () => api.end({ timeout: true });
    E.camTo('intro', .01); E.autoOrbit(.05); E.setTOD(0);

    /* ---------- الأسئلة ---------- */
    function question() {
      const k = a.length, q = Q[k]; E.autoOrbit(0);
      if (k === 0) { E.setTOD(0); E.camTo('overview', 1.6); } else if (k === 1) { E.camTo('building', 1.8); E.setTOD(.2); } else { E.camTo('gates', 1.8); E.setTOD(.4); E.heat(null); }
      U.innerHTML = `<div class="dh"><h2>أنت جزء من <span class="grad">البيانات</span></h2><div class="pill" style="font-size:24px">سؤال ${k + 1} من 3</div></div>
        <div class="x3p x3q" style="top:300px;right:64px;width:640px"><div class="muted">شاركنا إجابتك، وتنضم لبيانات زوار المعرض اليوم</div><h3>${q.text}</h3>
          <div class="opts1">${q.opts.map((o, i) => `<button class="opt" data-q="${i}"><span>${k === 2 ? 'بوابة ' : ''}${o}</span><small>${q.sub[i] || ''}</small></button>`).join('')}</div>
          <div class="bar" style="margin-top:28px"><i style="width:${k / 3 * 100}%"></i></div></div>`;
      $$('[data-q]').forEach(b => {
        const i = +b.dataset.q, show = () => { if (q.cam) { if (k === 0) E.showHero(i); else E.camTo(q.cam[i], 1.2); } else if (k === 1) E.setTOD(.05 + i * .14); };
        b.onmouseenter = show; b.onfocus = show;
        b.onclick = () => { show(); a.push(i); setTimeout(() => (a.length < 3 ? question() : analyze()), 260); };
      });
    }

    /* ---------- التحليل والقرارات ---------- */
    function analyze() {
      phase = 'a'; E.showHero(-1); E.setTaxiStand(-1);
      const data = BASE.map((arr, k) => arr.map((n, i) => n + (a[k] === i ? 1 : 0))), total = data[0].reduce((x, y) => x + y, 0);
      yourData = data;
      const peak = data[1].indexOf(Math.max(...data[1])), low = data[2].indexOf(Math.min(...data[2])), topG = data[2].indexOf(Math.max(...data[2]));
      E.camTo('analysis', 2); E.setTOD(.1); E.heat(data[2], GN);
      const bars = data.map((arr, k) => { const mx = Math.max(...arr); return `<div class="x3p x3bar" style="position:static;padding:18px 22px;margin-bottom:14px;background:rgba(8,26,25,.9)"><h3 style="font-size:24px;margin:0 0 6px">${titles[k]}</h3>${arr.map((n, i) => `<div class="brow"><span>${Q[k].opts[i]}</span><i class="${a[k] === i ? 'me' : n === mx ? 'hi' : ''}" style="width:${Math.round(n / mx * 100)}%"></i><b>${n}${a[k] === i ? ' ·أنت' : ''}</b></div>`).join('')}</div>`; }).join('');
      const draw = () => {
        U.innerHTML = `<div class="dh"><h2>حلّل بيانات <span class="grad">${total} زائرًا</span></h2><div class="pill" style="font-size:24px">بلاغ 02 · قرارات التشغيل</div></div>
          <div class="abs" style="top:290px;right:48px;width:520px">${bars}<div class="muted" style="font-size:20px">الأخضر = إجابتك · الأزرق = الأعلى</div></div>
          <div class="x3p x3d" style="top:290px;left:48px;width:520px"><h3>متى نفتح البوابة الإضافية؟</h3>
            <div class="opts5">${Q[1].opts.map((o, k) => `<button class="opt ${d1 === k ? 'on' : ''}" data-d1="${k}">${o}</button>`).join('')}</div>
            <h3 style="margin-top:26px">وأين نضع محطة التاكسي؟</h3><div class="muted" style="font-size:20px;margin:-6px 0 12px">اختر هنا أو المس البوابة في المجسّم</div>
            <div class="opts1">${GN.map((o, k) => `<button class="opt ${d2 === k ? 'on' : ''}" data-d2="${k}">بوابة ${o} · ${data[2][k]} زائرًا</button>`).join('')}</div>
            <button class="btn" id="go" style="width:100%;margin-top:24px" ${d1 !== null && d2 !== null ? '' : 'disabled'}>شغّل المعرض ▶</button></div>`;
        $$('[data-d1]').forEach(b => { const k = +b.dataset.d1; b.onclick = () => { d1 = k; draw(); }; });
        $$('[data-d2]').forEach(b => { const k = +b.dataset.d2; b.onclick = () => { d2 = k; E.setTaxiStand(k); E.camTo('g' + k, 1.2); draw(); }; b.onmouseenter = () => E.camTo('g' + k, 1.2); });
        $('#go').onclick = () => run(data, peak, low, topG); $('.x3d').onmouseleave = () => E.camTo('analysis', 1.4);
      };
      E.onPick(gi => { d2 = gi; E.setTaxiStand(gi); draw(); });
      draw();
    }

    /* ---------- التشغيل المباشر ---------- */
    function run(data, peak, low, topG) {
      phase = 'r'; E.onPick(null); E.heat(null); E.controls(true); E.camTo('sim', 2);
      U.innerHTML = `<div class="x3p x3hud"><div class="x3hc"><div class="x3clock"><span id="x3t">8:30</span><small>مساءً</small></div><div id="x3s" class="x3tag">المعرض يغلق أبوابه…</div></div>
          <div class="x3hm">${GN.map((n, i) => `<div class="x3g"><span>${n}</span><div class="t"><i id="x3b${i}"></i></div><b id="x3n${i}">0</b></div>`).join('')}</div>
          <div class="x3hr"><div class="x3sp"><button class="opt on" data-sp="1">×1</button><button class="opt" data-sp="2">×2</button></div><button class="opt" id="x3auto" hidden style="min-height:48px;font-size:20px">كاميرا تلقائية</button><div class="muted" style="font-size:19px">الدائرة الذهبية = أنت</div></div></div>`;
      $$('[data-sp]').forEach(b => b.onclick = () => { E.simSpeed(+b.dataset.sp); $$('[data-sp]').forEach(x => x.classList.toggle('on', x === b)); });
      let opened = false, manual = false, cur = 'sim'; E.onUser(() => { if (!manual) { manual = true; const x = $('#x3auto'); if (x) x.hidden = false; } });
      $('#x3auto').onclick = () => { manual = false; cur = ''; $('#x3auto').hidden = true; };
      E.startSim(data, d1, d2, {
        autoTOD: true, you: [a[0], a[1], a[2]],
        onOpen() { opened = true; $('#x3s').textContent = 'فُتحت البوابة الإضافية ✓'; toast('فُتحت البوابة الإضافية'); },
        onTick(s) {
          if (!$('#x3t')) return; $('#x3t').textContent = clk(s.clock); const mx = 28;
          s.q.forEach((n, i) => { const f = Math.min(1, n / mx), el = $('#x3b' + i); if (el) { el.style.width = Math.max(4, f * 100) + '%'; el.style.background = f > .6 ? '#ff5c3a' : f > .3 ? '#E8C77A' : '#52d6a2'; $('#x3n' + i).textContent = n; } });
          if (!manual) { const mq = Math.max(...s.q), gi = s.q.indexOf(mq), want = mq >= 10 ? 'q' + gi : 'sim'; if (want !== cur) { cur = want; E.camTo(want, 1.8); } }
          if (!opened) { const mxq = Math.max(...s.q); $('#x3s').textContent = mxq > 14 ? 'ازدحام عند البوابة!' : s.t > 4 ? 'الزوار يغادرون…' : 'المعرض يغلق أبوابه…'; }
        },
        onDone(s) { finish(s, peak, low, topG); },
      });
    }

    function finish(s, peak, low, topG) {
      const ok1 = d1 === peak - 1, ok2 = d2 === low;
      E.autoOrbit(.04); E.controls(true);
      const early = d1 !== null && d1 < peak - 1;
      const t1 = ok1 ? 'فتحت البوابة قبل الذروة بنصف ساعة' : early ? 'فتحتها مبكرًا: لا ازدحام، لكن بتكلفة تشغيل أعلى' : 'الأفضل قبل الذروة بنصف ساعة';
      const t2 = ok2 ? 'وزّعت الضغط على البوابة الأهدأ' : d2 === topG ? 'اخترت أزحم بوابة للتاكسي' : 'فيه بوابة أهدأ للتاكسي';
      const calm = s.maxQ <= 20;
      U.innerHTML = `<div class="x3p" style="top:260px;left:50%;width:1040px;margin-left:-520px;text-align:center"><div class="x3tag">${calm ? 'تشغيل سلس' : 'ظهر ازدحام'}</div><h3 style="font-size:44px;margin:14px 0 4px">نتيجة قرارك على الأرض</h3>
        <div class="x3k"><div><b>${s.maxQ}</b><span>أطول طابور (زائر)</span></div><div><b>${Math.max(1, Math.round(s.maxWait * 5))}</b><span>أطول انتظار (دقيقة)</span></div><div><b>${Math.max(...s.perGate) === s.perGate[0] ? 'الجنوبية' : Math.max(...s.perGate) === s.perGate[1] ? 'الغربية' : 'الشرقية'}</b><span>أزحم بوابة</span></div></div>
        <div class="muted" style="margin:10px 0 18px">${t1} · ${t2}</div><button class="btn" id="x3done">عرض النتيجة</button></div>`;
      $('#x3done').onclick = () => { api.set((ok1 ? 450 : 150) + (ok2 ? 450 : 150) + Math.min(100, S.left)); api.end({ detail: `${t1} · ${t2} · أطول طابور ${s.maxQ} زائرًا` }); };
    }

    question();
  };
})();
