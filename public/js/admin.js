/* لوحة التحكم (#admin): نفس وظائف لوحة مدار مبنية على التخزين المحلي. الرمز الافتراضي 2026 */
const AdminView = (() => {
  let day = '', pin = '', timer = null, root = null, msg = '', gerr = '';
  const ok = () => { try { return sessionStorage.getItem('saif_admin') === '1'; } catch (e) { return false; } };
  const gname = id => (G(id) || { badge: id }).badge;
  const scName = n => (SCREENS[n] ? SCREENS[n].kicker.split(' · ')[1] : 'شاشة ' + n);
  const fmtTs = ts => new Date(ts).toLocaleTimeString('ar-u-ca-gregory-nu-latn', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
  const bar = (label, pct, extra) => `<div class="ad-bar"><span>${label}</span><i><s style="width:${Math.min(100, pct)}%"></s></i><b>${extra}</b></div>`;
  const tierDot = t => `<i class="ad-tier ${t}" title="${TIER_AR[t] || ''}"></i>`;

  function download(blob, name) {
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  function flash(t) { msg = t; const el = document.getElementById('ad-msg'); if (el) { el.textContent = t; el.hidden = !t; } setTimeout(() => { msg = ''; const e2 = document.getElementById('ad-msg'); if (e2) e2.hidden = true; }, 2600); }
  /* زر بخطوتين (بدل نافذة تأكيد المتصفح) */
  function twoStep(btn, label, fn) {
    let armed = false, t;
    const orig = btn.innerHTML;
    btn.onclick = () => {
      if (!armed) { armed = true; btn.classList.add('danger'); btn.textContent = label; t = setTimeout(() => { armed = false; btn.classList.remove('danger'); btn.innerHTML = orig; }, 4000); return; }
      clearTimeout(t); fn();
    };
  }

  function gate() {
    root.innerHTML = `${header()}<main class="ad-wrap"><section class="sa-glass ad-gate"><span class="ad-lock">${I('Lock')}</span><h1>لوحة التحكم</h1><p>أدخل رمز الدخول لعرض النتائج والتقارير.</p>
      <form id="gf" novalidate><label>رمز الدخول<input id="pin" type="password" inputmode="numeric" autocomplete="off" dir="ltr" autofocus></label>
      <p class="sa-err" role="alert" ${gerr ? '' : 'hidden'}>${gerr}</p><button class="sa-btn" type="submit">دخول</button></form></section></main>`;
    document.getElementById('gf').onsubmit = async e => {
      e.preventDefault(); const v = document.getElementById('pin').value;
      if (await SaifStore.verifyPin(v)) { try { sessionStorage.setItem('saif_admin', '1'); sessionStorage.setItem('saif_admin_pin', v); } catch (x) {} gerr = ''; await SaifStore.sync(); draw(); } else { gerr = 'الرمز غير صحيح.'; gate(); }
    };
  }

  function draw() {
    clearInterval(timer);
    if (!ok()) return gate();
    const s = SaifStore.summary(day || undefined), d = s.day, rep = d === 'all' ? null : SaifStore.dayReport(d), wins = SaifStore.winners(3), list = SaifStore.roundsList(d), cfg = SaifStore.config();
    const days = [...new Set([SaifStore.today(), ...s.days])];
    const maxG = Math.max(1, ...s.byGame.map(x => x.rounds)), maxH = Math.max(1, ...s.byHour.map(x => x.rounds));
    const base = location.origin + location.pathname, pubBase = (cfg.publicUrl || base).replace(/\/$/, '') + '/';
    root.innerHTML = `${header()}<main class="ad-wrap">
      <div class="ad-head"><div><h1>لوحة التحكم</h1><p class="sa-muted">${SaifStore.mode() === 'remote' ? `<span class="ad-pill ${SaifStore.online() ? 'open' : 'closed'}">${SaifStore.online() ? 'متصل بالخادم المشترك' : 'غير متصل · سيُعاد الإرسال'}</span> جميع الشاشات والجوالات في تقرير واحد.` : 'وضع محلي: البيانات محفوظة في هذا المتصفح فقط.'}</p></div>
        <div class="ad-acts"><label class="ad-sel">اليوم<select id="dsel">${days.map(x => `<option value="${x}" ${x === d ? 'selected' : ''}>${x}${x === SaifStore.today() ? ' (اليوم)' : ''}</option>`).join('')}<option value="all" ${d === 'all' ? 'selected' : ''}>كل الأيام</option></select></label>
          <button class="sa-btn ghost" id="ref">${I('RefreshCw')} تحديث</button><button class="sa-btn ghost" id="out">${I('LogIn')} خروج</button></div></div>
      <p class="ad-msg" id="ad-msg" role="status" ${msg ? '' : 'hidden'}>${msg}</p>
      <section class="ad-kpis">${[['الجولات', s.rounds], ['المشاركون المسجَّلون', s.participants], ['متوسط الأداء', s.avgPct + '%'], ['أعلى نتيجة', s.bestScore], ['شارات ذهبية', s.gold]].map(([t, v]) => `<div class="sa-glass ad-kpi"><b>${v}</b><span>${t}</span></div>`).join('')}</section>
      <div class="ad-cols">
        <section class="sa-glass ad-card"><h2>أداء التجارب</h2><p class="sa-muted">عدد الجولات ومتوسط النتيجة لكل تجربة.</p>${s.byGame.slice().sort((a, b) => b.rounds - a.rounds).map(x => bar(esc(gname(x.id)), 100 * x.rounds / maxG, `${x.rounds} · ${x.avgPct}%`)).join('')}</section>
        <section class="sa-glass ad-card"><h2>الشاشتان</h2>${s.byScreen.map(x => bar(esc(scName(x.n)), s.rounds ? 100 * x.rounds / s.rounds : 0, `${x.rounds} · ${x.avgPct}%`)).join('')}
          <h2 style="margin-top:1.4rem">الجولات حسب الساعة</h2>${s.byHour.length ? s.byHour.map(x => bar(String(x.hour).padStart(2, '0') + ':00', 100 * x.rounds / maxH, x.rounds)).join('') : '<p class="sa-muted">لا بيانات بعد.</p>'}</section>
      </div>
      <section class="sa-glass ad-card"><div class="ad-row"><div><h2>تقرير ${d === 'all' ? 'كل الأيام' : 'اليوم ' + d} ${rep ? (rep.closed ? '<span class="ad-pill closed">مغلق</span>' : '<span class="ad-pill open">مفتوح</span>') : ''}</h2><p class="sa-muted">أفضل نتيجة لكل مشارك مع رقم التواصل. الثلاثة الأوائل مظللون.</p></div>
        <div class="ad-acts">${rep ? `<button class="sa-btn ghost" id="csvd">${I('Mail')} تصدير CSV لليوم</button><button class="sa-btn ghost" id="endd">${rep.closed ? 'فتح اليوم من جديد' : 'إنهاء اليوم'}</button>` : ''}<button class="sa-btn ghost" id="csva">تصدير كل الجولات</button></div></div>
        ${rep ? `<div class="ad-tw"><table><thead><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>التجربة</th><th>النتيجة</th><th>الجولات</th></tr></thead><tbody>${rep.rows.length ? rep.rows.map(r => `<tr class="${r.rank <= 3 ? 't3' : ''}"><td>${r.rank}</td><td>${esc(r.name)}</td><td dir="ltr">${esc(r.phone)}</td><td>${esc(gname(r.game))}</td><td>${tierDot(r.tier)} ${r.score}</td><td>${r.roundsPlayed}</td></tr>`).join('') : '<tr><td colspan="6" class="sa-muted">لا مشاركين مسجَّلين بعد.</td></tr>'}</tbody></table></div>` : ''}</section>
      <section class="sa-glass ad-card"><div class="ad-row"><div><h2>الفائزون كل يوم</h2><p class="sa-muted">أول ثلاثة في كل يوم مع رقم التواصل.</p></div><div class="ad-acts"><button class="sa-btn ghost" id="csvw">تصدير CSV للفائزين</button></div></div>
        ${wins.length ? wins.map(w => `<div class="ad-win"><b>${w.day}</b> ${w.open ? '<span class="ad-pill open">مفتوح</span>' : ''}<span class="sa-muted">${w.participants} مشارك · ${w.rounds} جولة</span><ol>${w.top.map(x => `<li><span>${medal(x.rank)}</span><b>${esc(x.name)}</b><span dir="ltr" class="sa-muted">${esc(x.phone)}</span><em>${x.score}</em></li>`).join('')}</ol></div>`).join('') : '<p class="sa-muted">لا فائزين بعد.</p>'}</section>
      <section class="sa-glass ad-card"><h2>آخر الجولات</h2><p class="sa-muted">أخفِ أي جولة غير مرغوبة من لوحة الصدارة (تبقى في التقارير الداخلية).</p>
        <div class="ad-tw"><table><thead><tr><th>الوقت</th><th>الاسم</th><th>التجربة</th><th>النتيجة</th><th></th></tr></thead><tbody>${list.length ? list.map(r => `<tr class="${r.hidden ? 'dim' : ''}"><td>${fmtTs(r.ts)}</td><td>${r.name ? esc(r.name) : '<span class="sa-muted">بدون اسم</span>'}</td><td>${esc(gname(r.game))} · ${lvName(r.lv)}</td><td>${tierDot(r.tier)} ${r.score}</td><td><button class="ad-mini" data-hide="${r.id}" data-to="${r.hidden ? 0 : 1}">${r.hidden ? 'إظهار' : 'إخفاء'}</button></td></tr>`).join('') : '<tr><td colspan="5" class="sa-muted">لا جولات.</td></tr>'}</tbody></table></div></section>
      <section class="sa-glass ad-card"><h2>الشاشات وزحمة البوث</h2>
        <p class="sa-muted">افتح كل شاشة في نافذتها، أو انسخ رابطها لتشغيلها على جهاز العرض.</p>
        <div class="ad-acts"><a class="sa-btn ghost" href="#s1">${I('ShieldCheck')} افتح الشاشة الأولى</a><a class="sa-btn ghost" href="#s2">${I('Bot')} افتح الشاشة الثانية</a></div>
        <div class="ad-crowd"><div><b>وضع الزحمة</b><p class="sa-muted">يُظهر رمز QR تحت لوحة الصدارة في الشاشتين ليلعب الزوار من جوالاتهم، وتظهر نتائجهم في اللوحة نفسها.</p></div>
          <button type="button" class="ad-toggle ${cfg.crowd ? 'on' : ''}" id="crowd" role="switch" aria-checked="${!!cfg.crowd}"><i></i><span>${cfg.crowd ? 'مفعّل' : 'متوقف'}</span></button></div>
        ${SaifStore.mode() !== 'remote' ? '<p class="ad-warn">تنبيه: لن يصل لعب الجوالات إلى لوحة الصدارة هنا إلا بعد نشر الموقع مع الخادم المشترك (راجع ملف النشر).</p>' : ''}</section>
      <section class="sa-glass ad-card"><h2>الإعدادات والروابط</h2>
        <form id="uf" class="ad-form"><label>الرابط العام (يظهر في رمز QR بصفحة النتيجة)<input id="purl" dir="ltr" placeholder="https://your-site.netlify.app" value="${esc(cfg.publicUrl || '')}"></label><button class="sa-btn" type="submit">حفظ الرابط</button></form>
        <p class="sa-muted">روابط شاشات الكيوسك (عودة تلقائية بعد 30 ثانية ولا يتذكر اللاعب السابق):</p>
        <p class="ad-links" dir="ltr"><code>${esc(pubBase)}?kiosk=1#s1</code><code>${esc(pubBase)}?kiosk=1#s2</code><code>${esc(pubBase)}?m=1</code></p><p class="sa-muted">الرابط الثالث للجوالات (يظهر فيه التبديل بين المحورين).</p>
        <div class="ad-acts"><button class="sa-btn ghost" id="reset">مسح كل بيانات التجربة</button></div></section>
    </main>`;
    const q = id => document.getElementById(id);
    q('dsel').onchange = e => { day = e.target.value; draw(); };
    q('ref').onclick = async () => { await SaifStore.sync(); draw(); flash('تم التحديث'); };
    q('out').onclick = () => { try { sessionStorage.removeItem('saif_admin'); } catch (e) {} gate(); };
    if (q('csvd')) q('csvd').onclick = () => download(SaifStore.csvDay(d), `saif-${d}.csv`);
    if (q('endd')) twoStep(q('endd'), rep.closed ? 'تأكيد الفتح؟' : 'تأكيد إنهاء اليوم؟', () => { SaifStore.closeDay(d, !rep.closed); draw(); flash(rep.closed ? 'تم فتح اليوم' : 'تم إنهاء اليوم'); });
    q('csva').onclick = () => download(SaifStore.csvAll(), 'saif-rounds.csv');
    q('csvw').onclick = () => download(SaifStore.csvWinners(), 'saif-winners.csv');
    $$('[data-hide]', root).forEach(b => b.onclick = () => { SaifStore.setHidden(b.dataset.hide, b.dataset.to === '1'); draw(); });
    q('uf').onsubmit = e => { e.preventDefault(); if (SaifStore.setPublicUrl(q('purl').value)) flash('تم حفظ الرابط'); else flash('اكتب رابطًا يبدأ بـ http أو https'); };
    q('crowd').onclick = () => { SaifStore.setCrowd(!cfg.crowd); draw(); flash(!cfg.crowd ? 'تم تفعيل وضع الزحمة' : 'تم إيقاف وضع الزحمة'); };
    twoStep(q('reset'), 'تأكيد المسح؟ لا رجعة فيه', () => { SaifStore.resetAll(); draw(); flash('تم مسح البيانات'); });
    timer = setInterval(async () => { if (view.name === 'admin' && !document.activeElement.matches('input,select')) { await SaifStore.sync(); const y = window.scrollY; draw(); window.scrollTo(0, y); } }, 15000);
  }

  return { render(el) { root = el; document.title = SAIF_TR('لوحة التحكم · تجارب طويق التفاعلية'); draw(); if (ok()) SaifStore.sync().then(r => { if (r && view.name === 'admin' && !document.activeElement.matches('input,select')) draw(); }); } };
})();
