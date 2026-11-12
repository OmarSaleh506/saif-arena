/* مشاهد متحركة تظهر خلف كل بطاقة تجربة: كأن لاعبًا يلعبها فعلًا (SVG + SMIL، بلا صور). */
const PV = (() => {
  const D = '6s';
  const K = { cream: '#F4F2EA', blue: '#84B6C6', coral: '#C9705F', bad: '#E07A6A', ok: '#6FBF9A', gold: '#E8C77A', dim: 'rgba(244,242,234,.14)', line: 'rgba(244,242,234,.32)', panel: 'rgba(244,242,234,.07)' };
  const rep = 'repeatCount="indefinite"';
  const an = (attr, vals, kt, extra = '') => `<animate attributeName="${attr}" values="${vals}" keyTimes="${kt}" dur="${D}" ${rep} ${extra}/>`;
  const mv = (vals, kt) => `<animateTransform attributeName="transform" type="translate" values="${vals}" keyTimes="${kt}" dur="${D}" ${rep}/>`;
  /* يظهر عند النسبة t من الدورة ويختفي في نهايتها */
  const show = (t) => an('opacity', '0;0;1;1;0', `0;${t};${(t + .04).toFixed(2)};.93;1`);
  const tapRing = (x, y, t) => `<circle cx="${x}" cy="${y}" r="2" fill="none" stroke="#fff" stroke-width="2" opacity="0">${an('r', '2;2;2;22;22', `0;${t};${(t + .01).toFixed(2)};${(t + .1).toFixed(2)};1`)}${an('opacity', '0;0;.95;0;0', `0;${t};${(t + .01).toFixed(2)};${(t + .1).toFixed(2)};1`)}</circle>`;
  const ARROW = '<path d="M0 0 L0 20 L5.5 15.5 L9.5 24 L13 22.5 L9 14 L16.5 14 Z" fill="#fff" stroke="#081A19" stroke-width="1.4" stroke-linejoin="round"/>';
  /* مؤشر يتنقل بين نقاط ويضغط عند 0.28 و0.58 */
  const cursor = (p1, p2, p3) => {
    const [a, b, c] = [p1, p2, p3].map(p => p.join(','));
    return tapRing(p2[0], p2[1], .28) + tapRing(p3[0], p3[1], .58) +
      `<g>${mv(`${a};${b};${b};${c};${c};${a}`, '0;.24;.32;.54;.62;1')}<g>${ARROW}<animateTransform attributeName="transform" type="scale" values="1;1;.86;1;1;.86;1;1" keyTimes="0;.24;.28;.32;.54;.58;.62;1" dur="${D}" ${rep}/></g></g>`;
  };
  const svg = body => `<svg class="pv" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${body}</svg>`;
  const R = (x, y, w, h, fill, rx = 6, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
  const C = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const L = (x1, y1, x2, y2, stroke = K.line, w = 2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  const T = (x, y, s, size = 14, fill = K.cream, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Tajawal,sans-serif" font-weight="800" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
  const check = (x, y, t, col = K.ok) => `<g opacity="0">${show(t)}${C(x, y, 11, col)}<path d="M${x - 5} ${y} l3.5 4 l7 -8" stroke="#081A19" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const motion = (path, dur, begin = 0, extra = '') => `<animateMotion path="${path}" dur="${dur}s" begin="${begin}s" ${rep} ${extra}/>`;
  const fade = (dur, begin, ratio = .85) => `<animate attributeName="opacity" values="1;1;0" keyTimes="0;${ratio};1" dur="${dur}s" begin="${begin}s" ${rep}/>`;
  const pulse = (r1, r2, col, dur = 1.6) => `<circle r="${r1}" fill="none" stroke="${col}" stroke-width="2.5"><animate attributeName="r" values="${r1};${r2};${r1}" dur="${dur}s" ${rep}/><animate attributeName="opacity" values=".9;0;.9" dur="${dur}s" ${rep}/></circle>`;

  const RA = (x, y, w, h, fill, rx, kids) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}">${kids}</rect>`;
  const motionKT = (path, kp, kt) => `<animateMotion path="${path}" dur="${D}" keyPoints="${kp}" keyTimes="${kt}" calcMode="linear" ${rep}/>`;
  const S = {};

  /* 1) بزل: قطعة تُسحب إلى مكانها */
  S.puzzle = () => {
    const fills = [K.blue, '#4F8798', K.coral, '#285865', K.blue, '#B95D4E', '#4F8798', K.blue];
    let cells = '', k = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = 125 + c * 50, y = 35 + r * 50;
      if (r === 1 && c === 2) { cells += R(x, y, 48, 48, 'none', 6, `stroke="${K.line}" stroke-dasharray="5 5" stroke-width="2"`); continue; }
      cells += R(x, y, 48, 48, fills[k++ % fills.length], 6, 'opacity=".55"') + C(x + 24, y + 24, 8, K.cream, 'opacity=".5"');
    }
    return svg(cells +
      `<g transform="translate(40 150) rotate(-12)">${R(0, 0, 40, 40, K.coral, 6, 'opacity=".5"')}</g><g transform="translate(325 40) rotate(10)">${R(0, 0, 40, 40, K.blue, 6, 'opacity=".5"')}</g>` +
      `<g transform="translate(225 85)"><g>${mv('135,70;135,70;0,0;0,0;135,70', '0;.08;.42;.9;1')}<g>${an('opacity', '0;1;1;1;0;0', '0;.04;.42;.88;.95;1')}${R(0, 0, 48, 48, K.gold, 6)}${C(24, 24, 8, '#081A19', 'opacity=".5"')}<g transform="translate(30 26)">${ARROW}</g></g></g></g>` +
      check(274, 134, .46));
  };

  /* 2) مهندس الشبكات: جدار حماية ثم مسار آمن */
  S.network = () => {
    const node = (x, y, col, ex = '') => C(x, y, 17, '#12302F', `stroke="${col}" stroke-width="3" ${ex}`);
    return svg(
      [[60, 62, 170, 110], [60, 162, 170, 110], [170, 110, 250, 58], [170, 110, 250, 162], [250, 58, 340, 110], [250, 162, 340, 110]].map(l => L(...l)).join('') +
      `<path d="M60 62 L170 110 L250 162 L340 110" fill="none" stroke="${K.ok}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">${an('stroke-dashoffset', '100;100;0;0;100', '0;.6;.82;.93;1')}</path>` +
      node(60, 62, K.blue) + node(60, 162, K.blue) + node(170, 110, K.blue) + node(250, 58, K.bad) + node(250, 162, K.gold) +
      `<g transform="translate(250 58)">${pulse(18, 28, K.bad)}<path d="M-6 -6 l12 12 M6 -6 l-12 12" stroke="${K.bad}" stroke-width="3" stroke-linecap="round"/></g>` +
      `<g transform="translate(250 162)" opacity="0">${show(.3)}<path d="M0 -12 L11 -8 V1 C11 8 5 12 0 14 C-5 12 -11 8 -11 1 V-8 Z" fill="${K.coral}"/></g>` +
      R(322, 90, 36, 40, '#285865', 8, `stroke="${K.cream}" stroke-width="2.5"`) + L(330, 102, 350, 102, K.cream, 2.5) + L(330, 112, 350, 112, K.cream, 2.5) + C(334, 123, 2.4, K.ok) +
      `<circle r="5" fill="${K.cream}" opacity="0">${motionKT('M60 62 L170 110 L250 162 L340 110', '0;0;1;1', '0;.62;.86;1')}${an('opacity', '0;0;1;1;0;0', '0;.62;.64;.86;.88;1')}</circle>` +
      cursor([28, 205], [250, 175], [60, 80]));
  };

  /* 3) الرؤية الحاسوبية: استبعاد الحشد حتى يبقى المرشح */
  S.b1 = () => {
    let out = '', i = 0;
    const shirts = [K.coral, K.gold, '#9AA9A7', K.coral, '#B95D4E', K.gold];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = 105 + c * 48, y = 48 + r * 48, tgt = (r === 1 && c === 3), n = i++;
      const t0 = (.3 + (n % 5) * .045).toFixed(2), t1 = (+t0 + .1).toFixed(2);
      out += `<g transform="translate(${x} ${y})" ${tgt ? '' : ''}>${tgt ? '' : an('opacity', '1;1;.12;.12;1', `0;${t0};${t1};.94;1`)}` +
        C(0, -9, 6, K.cream, 'opacity=".75"') + `<path d="M-10 14 Q-10 -2 0 -2 Q10 -2 10 14 Z" fill="${tgt ? K.blue : shirts[n % shirts.length]}" opacity="${tgt ? 1 : .7}"/>${tgt ? R(7, 3, 8, 9, K.cream, 2, 'opacity=".9"') : ''}</g>`;
    }
    return svg(out +
      `<g transform="translate(297 96)" opacity="0">${show(.58)}<rect x="-20" y="-31" width="40" height="52" rx="10" fill="none" stroke="${K.ok}" stroke-width="3"/>${pulse(24, 34, K.ok)}</g>` +
      [['قميص أزرق', 88], ['شنطة', 168]].map(([s, x], k) => `<g>${R(x - 36, 176, 72, 24, K.panel, 12, `stroke="${K.line}"`)}${T(x, 193, s, 12)}<g opacity="0">${show(k ? .45 : .3)}${R(x - 36, 176, 72, 24, K.ok, 12, 'opacity=".35"')}</g></g>`).join('') +
      cursor([30, 205], [88, 190], [300, 110]));
  };

  /* 4) محلل البيانات: أعمدة تنمو واختيار بوابة */
  S.b2 = () => {
    const hs = [60, 95, 130, 100, 70, 45], bars = hs.map((h, i) => {
      const x = 96 + i * 36, hot = i === 2;
      return `<rect x="${x}" width="24" rx="5" fill="${hot ? K.gold : K.blue}" opacity="${hot ? 1 : .6}" y="170" height="0">${an('height', `0;0;${h};${h};0`, `0;${(.08 + i * .03).toFixed(2)};${(.3 + i * .03).toFixed(2)};.93;1`)}${an('y', `170;170;${170 - h};${170 - h};170`, `0;${(.08 + i * .03).toFixed(2)};${(.3 + i * .03).toFixed(2)};.93;1`)}</rect>`;
    }).join('');
    return svg(L(80, 172, 320, 172, K.line, 2) + bars +
      `<polyline points="96,120 132,95 168,60 204,86 240,112 276,128" fill="none" stroke="${K.coral}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">${an('stroke-dashoffset', '100;100;0;0;100', '0;.35;.6;.93;1')}</polyline>` +
      `<g transform="translate(168 40)" opacity="0">${show(.3)}${R(-26, -14, 52, 24, K.gold, 12)}${T(0, 3, 'أنت', 13, '#081A19')}</g>` +
      [0, 1, 2].map(i => `<g>${R(120 + i * 62, 186, 54, 22, K.panel, 11, `stroke="${K.line}"`)}${i === 1 ? `<g opacity="0">${show(.58)}${R(120 + i * 62, 186, 54, 22, K.coral, 11)}</g>` : ''}</g>`).join('') +
      cursor([350, 200], [168, 100], [210, 198]));
  };

  /* 5) مشغل الدرونز: مسار يتجنب الحظر والرياح */
  S.b3 = () => {
    const P = 'M52 172 L120 172 L120 112 L232 112 L232 62 L346 62';
    let grid = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) grid += C(52 + c * 42, 62 + r * 27.5, 2, K.cream, 'opacity=".25"');
    return svg(grid +
      R(142, 118, 40, 28, K.bad, 6, 'opacity=".35"') + R(190, 150, 40, 28, K.bad, 6, 'opacity=".35"') + R(240, 78, 36, 28, K.blue, 6, 'opacity=".35"') +
      L(150, 125, 174, 140, K.bad, 2.5) + L(174, 125, 150, 140, K.bad, 2.5) +
      `<path d="${P}" fill="none" stroke="${K.ok}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 7" opacity=".8"/>` +
      C(346, 62, 11, K.coral) + T(346, 67, '!', 14, '#fff') + C(52, 172, 6, K.cream) +
      R(56, 24, 120, 10, K.panel, 5) + RA(56, 24, 120, 10, K.ok, 5, an('width', '120;120;52;52;120', '0;.1;.7;.93;1')) +
      `<g>${motionKT(P, '0;0;1;1', '0;.08;.8;1')}${C(0, 0, 7, K.cream)}${L(-12, -12, 12, 12, K.cream, 2.5)}${L(12, -12, -12, 12, K.cream, 2.5)}${C(-12, -12, 4.5, K.blue)}${C(12, -12, 4.5, K.blue)}${C(-12, 12, 4.5, K.blue)}${C(12, 12, 4.5, K.blue)}<g transform="translate(6 8)">${ARROW}</g></g>`);
  };

  /* 6) مهندس الروبوتات: تجميع واختبار */
  S.b4 = () => {
    const wheel = x => `<g transform="translate(${x} 146)">${C(0, 0, 17, '#12302F', `stroke="${K.cream}" stroke-width="3"`)}<g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="1.6s" ${rep}/>${L(-12, 0, 12, 0, K.cream, 2.5)}${L(0, -12, 0, 12, K.cream, 2.5)}</g></g>`;
    return svg(
      R(150, 66, 100, 60, '#285865', 12, `stroke="${K.blue}" stroke-width="3"`) + R(172, 82, 56, 20, K.panel, 6) + C(190, 92, 4, K.ok) + C(210, 92, 4, K.ok) + wheel(172) + wheel(228) +
      `<g opacity="0">${show(.3)}${L(200, 66, 200, 44, K.cream, 3)}${C(200, 40, 6, K.gold)}</g>` +
      `<g opacity="0">${show(.45)}${R(160, 52, 80, 12, K.gold, 4)}${L(180, 52, 180, 64, '#081A19', 1.5)}${L(200, 52, 200, 64, '#081A19', 1.5)}${L(220, 52, 220, 64, '#081A19', 1.5)}</g>` +
      [0, 1, 2, 3].map(i => `<g>${R(296, 48 + i * 30, 70, 22, K.panel, 11, `stroke="${K.line}"`)}${T(331, 64 + i * 30, ['عجلات', 'حساس', 'بطارية', 'هيكل'][i], 11.5)}</g>`).join('') +
      [0, 1, 2].map(i => `<g>${C(62, 62 + i * 30, 10, K.panel, `stroke="${K.line}"`)}<g opacity="0">${show(.5 + i * .1)}${C(62, 62 + i * 30, 10, K.ok)}</g></g>`).join('') +
      R(40, 160, 96, 10, K.panel, 5) + RA(40, 160, 10, 10, K.ok, 5, an('width', '10;10;96;96;10', '0;.3;.75;.93;1')) +
      cursor([30, 205], [331, 129], [200, 100]));
  };

  /* 7) محلل SOC: فحص السجلات وتمييز المريب */
  S.b5 = () => {
    const widths = [150, 190, 120, 170, 140, 185, 110];
    const rows = widths.map((w, i) => {
      const y = 44 + i * 22, bad = i === 2 || i === 5;
      return R(86, y, 228, 17, bad ? 'none' : K.panel, 5) + R(94, y + 6, 24, 5, K.blue, 2.5, 'opacity=".7"') + R(126, y + 6, w * .7, 5, K.line, 2.5) +
        (bad ? `<g opacity="0">${show(i === 2 ? .3 : .58)}${R(86, y, 228, 17, K.bad, 5, 'opacity=".28"')}${T(300, y + 13, '⚠', 12, K.gold)}</g>` : '');
    }).join('');
    return svg(R(70, 24, 260, 172, 'rgba(8,26,25,.55)', 14, `stroke="${K.line}" stroke-width="2"`) + C(88, 34, 3, K.bad) + C(98, 34, 3, K.gold) + C(108, 34, 3, K.ok) + rows +
      `<g>${mv('0,0;0,0;0,132;0,132;0,0', '0;.05;.85;.95;1')}${R(82, 42, 236, 21, 'none', 6, `stroke="${K.blue}" stroke-width="2.5" opacity=".9"`)}</g>` +
      cursor([360, 205], [200, 99], [200, 143]));
  };

  /* 8) مختبر الاختراق: اكتشاف ثغرات في تطبيق */
  S.vuln = () => svg(
    R(90, 22, 220, 172, 'rgba(8,26,25,.6)', 14, `stroke="${K.line}" stroke-width="2"`) + R(90, 22, 220, 24, K.panel, 14) + C(106, 34, 3.5, K.bad) + C(118, 34, 3.5, K.gold) + C(130, 34, 3.5, K.ok) +
    R(104, 56, 192, 20, K.panel, 10) + T(200, 70, '…?pass=1234', 11.5, K.blue, 'direction="ltr"') +
    R(104, 86, 120, 8, K.line, 4) + R(104, 100, 192, 36, K.panel, 8) + T(200, 123, 'ID 1•••••••••', 12.5, K.cream, 'direction="ltr"') + R(104, 144, 150, 8, K.line, 4) + R(104, 160, 90, 22, K.coral, 11, 'opacity=".7"') +
    `<g opacity="0">${show(.3)}${R(100, 52, 200, 28, 'none', 12, `stroke="${K.bad}" stroke-width="3"`)}</g><g opacity="0">${show(.58)}${R(100, 96, 200, 44, 'none', 10, `stroke="${K.bad}" stroke-width="3"`)}</g>` +
    [0, 1, 2, 3, 4].map(i => `<g>${C(160 + i * 20, 208, 5, K.dim)}${i < 2 ? `<g opacity="0">${show(i ? .6 : .32)}${C(160 + i * 20, 208, 5, K.bad)}</g>` : ''}</g>`).join('') +
    cursor([350, 205], [250, 64], [250, 122]));

  /* 9) الدفاع السيبراني: اعتراض تهديدات */
  S.defend = () => {
    const enemy = (path, dur, begin) => `<g>${motion(path, dur, begin)}${fade(dur, begin, .88)}<rect x="-7" y="-7" width="14" height="14" rx="3" fill="${K.bad}" transform="rotate(45)"/></g>`;
    return svg(
      [58, 92].map(r => C(200, 100, r, 'none', `stroke="${K.line}" stroke-dasharray="4 6" stroke-width="2"`)).join('') +
      `<g transform="translate(200 100)"><g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" ${rep}/><path d="M0 0 L0 -92 A92 92 0 0 1 60 -70 Z" fill="${K.blue}" opacity=".16"/></g>${C(0, 0, 25, K.coral)}<path d="M0 -13 L11 -8 V2 C11 9 5 13 0 15 C-5 13 -11 9 -11 2 V-8 Z" fill="${K.cream}"/></g>` +
      enemy('M60 30 L180 92', 3.2, 0) + enemy('M345 30 L222 92', 3.6, 1.1) + enemy('M60 175 L180 112', 3.4, 2.2) +
      `<g transform="translate(292 58)">${C(0, 0, 8, K.bad)}<g opacity="0">${show(.6)}${pulse(10, 22, K.ok, 1.2)}</g><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.58;.62;.95;1" dur="${D}" ${rep}/></g>` +
      [0, 1, 2].map(i => R(135 + i * 52, 188, 44, 24, i === 1 ? K.coral : K.panel, 12, `stroke="${K.line}"`)).join('') +
      `<line x1="292" y1="66" x2="232" y2="188" stroke="${K.ok}" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round" opacity="0">${show(.6)}</line>` +
      cursor([360, 205], [292, 58], [213, 200]));
  };

  /* 10) الطب الشرعي: ترتيب الأدلة زمنيًا */
  S.forensic = () => {
    const xs = [70, 145, 220, 295], labs = ['بريد', 'جهاز', 'دخول', 'خادم'];
    return svg(L(52, 100, 348, 100, K.line, 4) +
      xs.map((x, i) => `${C(x, 100, 17, '#12302F', `stroke="${K.line}" stroke-width="3"`)}<g opacity="0">${an('opacity', '0;0;1;1;0', `0;${(.18 + i * .13).toFixed(2)};${(.22 + i * .13).toFixed(2)};.93;1`)}${C(x, 100, 17, i === 0 ? K.bad : K.coral)}</g>${T(x, 140, labs[i], 12)}`).join('') +
      `<g>${mv('52,0;52,0;300,0;300,0;52,0', '0;.1;.75;.93;1')}<g transform="translate(0 100)"><circle r="11" fill="none" stroke="${K.gold}" stroke-width="3.5"/><line x1="8" y1="8" x2="18" y2="18" stroke="${K.gold}" stroke-width="4" stroke-linecap="round"/></g></g>` +
      `<g transform="translate(220 150)"><g>${mv('-110,38;-110,38;0,0;0,0;-110,38', '0;.06;.42;.9;1')}<g>${an('opacity', '0;1;1;1;0;0', '0;.04;.42;.88;.95;1')}${R(-28, -4, 56, 28, K.blue, 8)}${L(-18, 6, 14, 6, '#081A19', 2.5)}${L(-18, 14, 4, 14, '#081A19', 2.5)}<g transform="translate(14 12)">${ARROW}</g></g></g></g>` +
      T(200, 40, 'من أين بدأ الاختراق؟', 15, K.cream, 'opacity=".75"'));
  };

  /* 11) حقيقي أم مزيّف؟: مقطعان صوتيان */
  S.deepfake = () => {
    const wave = (cx, t, jag) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
      const h = jag ? [10, 34, 12, 40, 8, 30, 14, 38, 10][i] : [14, 26, 38, 30, 44, 32, 40, 24, 16][i], x = cx - 40 + i * 10;
      return `<rect x="${x}" width="6" rx="3" fill="${K.blue}" y="${110 - 5}" height="10">${an('height', `10;10;${h};${(h * .5).toFixed(0)};${h};10;10`, `0;${t};${(t + .05).toFixed(2)};${(t + .1).toFixed(2)};${(t + .15).toFixed(2)};${(t + .22).toFixed(2)};1`)}${an('y', `105;105;${110 - h / 2};${110 - h / 4};${110 - h / 2};105;105`, `0;${t};${(t + .05).toFixed(2)};${(t + .1).toFixed(2)};${(t + .15).toFixed(2)};${(t + .22).toFixed(2)};1`)}</rect>`;
    }).join('');
    return svg(
      [[110, 'أ'], [290, 'ب']].map(([cx, s]) => R(cx - 70, 50, 140, 120, K.panel, 16, `stroke="${K.line}" stroke-width="2"`) + C(cx, 80, 15, K.coral) + `<path d="M${cx - 4} ${73} L${cx + 8} 80 L${cx - 4} 87Z" fill="#fff"/>` + T(cx, 158, s, 16, K.cream, 'opacity=".8"')).join('') +
      wave(110, .26, false) + wave(290, .56, true) +
      `<g transform="translate(200 110)">${C(0, 0, 16, K.gold)}${T(0, 6, '؟', 20, '#081A19')}${pulse(18, 28, K.gold, 2)}</g>` +
      `<g opacity="0">${show(.78)}${R(40, 44, 140, 132, 'none', 18, `stroke="${K.ok}" stroke-width="3.5"`)}</g>` +
      cursor([350, 205], [110, 82], [290, 82]));
  };

  /* 12) تعلّم الآلة: تصنيف النقاط */
  S.ml = () => {
    const A = [[110, 70], [140, 100], [100, 120], [150, 62], [125, 140], [90, 90]], B = [[270, 70], [300, 100], [330, 130], [260, 120], [300, 60], [285, 150]];
    return svg(
      A.map(([x, y]) => C(x, y, 7, K.coral)).join('') + B.map(([x, y]) => C(x, y, 7, K.blue)).join('') +
      `<g transform="translate(200 110)"><g><animateTransform attributeName="transform" type="rotate" values="-22;-22;3;3;-22" keyTimes="0;.1;.55;.93;1" dur="${D}" ${rep}/>${L(0, -92, 0, 92, K.gold, 3, 'stroke-dasharray="7 6"')}</g></g>` +
      [[196, 60, K.blue, .3], [210, 150, K.coral, .6]].map(([x, y, col, t]) => `<circle cx="${x}" cy="${y}" r="8" fill="${K.cream}">${an('fill', `${K.cream};${K.cream};${col};${col};${K.cream}`, `0;${t};${(t + .03).toFixed(2)};.93;1`)}</circle>`).join('') +
      T(110, 188, 'مشبوه', 13, K.coral) + T(290, 188, 'آمن', 13, K.blue) +
      cursor([360, 205], [196, 62], [210, 150]));
  };

  /* 13) عالم البيانات: العنصر الشاذ */
  S.pattern = () => {
    let dots = '', s = 7;
    for (let i = 0; i < 46; i++) { s = (s * 9301 + 49297) % 233280; const x = 70 + (s / 233280) * 260; s = (s * 9301 + 49297) % 233280; const y = 40 + (s / 233280) * 130; dots += C(x.toFixed(0), (y * .5 + 85 * .5 + (y > 110 ? 0 : 10)).toFixed(0), 4.5, K.blue, 'opacity=".6"'); }
    return svg(L(60, 180, 340, 180, K.line, 2) + L(60, 40, 60, 180, K.line, 2) + dots +
      `<g transform="translate(305 52)">${C(0, 0, 8, K.bad)}${pulse(10, 24, K.bad, 1.4)}</g>` +
      `<g>${mv('90,60;90,60;250,60;250,60;90,60', '0;.1;.7;.93;1')}<circle cx="0" cy="45" r="22" fill="none" stroke="${K.gold}" stroke-width="2.5" stroke-dasharray="5 5"/></g>` +
      `<g opacity="0">${show(.6)}${R(250, 80, 104, 24, K.bad, 12)}${T(302, 97, 'نشاط شاذ', 13, '#fff')}</g>` +
      cursor([360, 205], [200, 120], [305, 52]));
  };

  const html = id => (S[id] ? S[id]() : '');
  /* مستخدم عند تفضيل تقليل الحركة: تجميد المشاهد */
  const freeze = root => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) root.querySelectorAll('svg.pv').forEach(s => { try { s.pauseAnimations(); } catch (e) {} }); };
  return { html, freeze };
})();
