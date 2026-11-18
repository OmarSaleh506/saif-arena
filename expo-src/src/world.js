import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tr, R, rr, pick, ctex, addNoise, blotches, tiled, labelSprite, labelPlane, box, colorGeo, TAU } from './util.js';

/* إحداثيات بالمتر: المبنى 196×112، الشمال = -z، والواجهة الرئيسية جنوبًا (z=+56) */
export const GATES = [
  { name: 'الجنوبية', x: 0 }, { name: 'الغربية', x: -95 }, { name: 'الشرقية', x: 95 },
];
export const FENCE_Z = 100;
export const DOORS = [-54, -18, 16, 53];            // مداخل المعرض 4،3،2،1 (من الغرب للشرق)
export const HALLS = {
  C: { x0: -25, x1: 2.5, z0: -30, z1: 31, name: 'القاعة C', col: '#3a4a58' },
  B: { x0: 6, x1: 53, z0: -30, z1: 31, name: 'القاعة B', col: '#34405f' },
  A: { x0: 56, x1: 95, z0: -30, z1: 31, name: 'القاعة A', col: '#53404a' },
};

export function buildWorld(scene, q) {
  const W = { gates: [], lampMats: [], glassMats: [], lights: [], trains: [], update: [], pick: [] };
  const add = o => { scene.add(o); return o; };

  /* ---------- الخامات (إجرائية) ---------- */
  const T = {
    concrete: ctex(512, 512, (c, w, h) => { c.fillStyle = '#b9b6ae'; c.fillRect(0, 0, w, h); blotches(c, w, h, 40, 'rgba(90,88,80,A)', 40, 120, .12); addNoise(c, w, h, 22); c.strokeStyle = 'rgba(60,58,52,.3)'; c.lineWidth = 2; c.strokeRect(0, 0, w, h); }),
    paving: ctex(512, 512, (c, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = `hsl(38,${12 + Math.random() * 8}%,${72 + Math.random() * 8}%)`; c.fillRect(i * 128, j * 128, 128, 128); } addNoise(c, w, h, 14); c.strokeStyle = 'rgba(80,70,55,.55)'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 128); c.lineTo(w, i * 128); c.stroke(); } }),
    stone: ctex(512, 512, (c, w, h) => { c.fillStyle = '#e4dfd3'; c.fillRect(0, 0, w, h); blotches(c, w, h, 50, 'rgba(160,150,130,A)', 30, 110, .1); addNoise(c, w, h, 10); c.strokeStyle = 'rgba(120,112,98,.45)'; c.lineWidth = 3; c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); }),
    asphalt: ctex(512, 512, (c, w, h) => { c.fillStyle = '#34373a'; c.fillRect(0, 0, w, h); blotches(c, w, h, 50, 'rgba(10,10,12,A)', 30, 90, .25); addNoise(c, w, h, 36); }),
    sand: ctex(512, 512, (c, w, h) => { c.fillStyle = '#c9b58d'; c.fillRect(0, 0, w, h); blotches(c, w, h, 70, 'rgba(150,120,80,A)', 30, 100, .2); addNoise(c, w, h, 26); }),
    grass: ctex(256, 256, (c, w, h) => { c.fillStyle = '#5b7f3b'; c.fillRect(0, 0, w, h); blotches(c, w, h, 40, 'rgba(40,70,20,A)', 10, 40, .3); addNoise(c, w, h, 34); }),
    carpet: ctex(256, 256, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); addNoise(c, w, h, 46); }),
    stall: ctex(512, 512, (c, w, h) => { c.fillStyle = '#34373a'; c.fillRect(0, 0, w, h); addNoise(c, w, h, 34); c.fillStyle = 'rgba(235,235,225,.9)'; c.fillRect(0, 0, 8, h); c.fillRect(w / 2 - 4, 0, 8, h); c.fillRect(0, 0, w, 8); }),
    dash: ctex(128, 32, (c, w, h) => { c.fillStyle = '#34373a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e6da'; c.fillRect(0, h / 2 - 2, w * .55, 4); addNoise(c, w, h, 24); }),
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    concrete: std({ map: T.concrete, roughness: .92 }),
    white: std({ color: 0xece9e1, roughness: .55, metalness: .05 }),
    cladding: std({ color: 0xd9d4c8, roughness: .7 }),
    steel: std({ color: 0x9aa2a8, roughness: .35, metalness: .85 }),
    darkSteel: std({ color: 0x2a3036, roughness: .45, metalness: .7 }),
    dark: std({ color: 0x1b2024, roughness: .6 }),
    glass: std({ color: 0x7db3c8, roughness: .06, metalness: .55, transparent: true, opacity: .46, emissive: 0xffc678, emissiveIntensity: 0, depthWrite: false }),
    roofGhost: std({ color: 0xc4cad0, transparent: true, opacity: .2, roughness: .5, depthWrite: false }),
    asphalt: std({ map: T.asphalt, roughness: .95 }),
    lamp: std({ color: 0x222, emissive: 0xffe2a8, emissiveIntensity: 0, roughness: .4 }),
    signGlow: std({ color: 0x111, emissive: 0xffffff, emissiveIntensity: 0 }),
  };
  W.lampMats.push(M.lamp, M.signGlow); W.glassMats.push(M.glass);
  const plane = (w, d, x, z, mat, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; return m; };
  const texMat = (tex, w, d, size, extra = {}) => std(Object.assign({ map: tiled(tex, w, d, size), roughness: .9 }, extra));
  W.T = T; W.M = M;

  /* ---------- الأرض والطرق والمواقف ---------- */
  add(plane(1800, 1800, 0, 100, texMat(T.sand, 1800, 1800, 40), -.1));
  add(plane(250, 46, 0, 78, texMat(T.paving, 250, 46, 8), .05));                       // ساحة المبنى
  add(plane(1400, 18, 0, 113, texMat(T.asphalt, 1400, 18, 12), .08));                  // الطريق الدائري
  const dash = (z) => { const m = plane(1400, .4, 0, z, texMat(T.dash, 1400, .4, 1.6), .1); m.material.map.repeat.set(1400 / 6, 1); return m; };
  add(dash(113.1));
  [[1400, 4, 0, 102, T.paving], [1400, 4, 0, 124, T.paving]].forEach(([w, d, x, z, t]) => add(plane(w, d, x, z, texMat(t, w, d, 4), .12)));
  [[-79, 142], [79, 142]].forEach(([x]) => add(plane(142, 70, x, 163, texMat(T.stall, 142, 70, 5.2), .06)));  // مواقف
  add(plane(16, 76, 0, 163, texMat(T.paving, 16, 76, 6), .09));                         // الممر المشاة نحو المترو
  [[-95, 118], [95, 118]].forEach(([x]) => add(plane(10, 24, x, 134, texMat(T.paving, 10, 24, 5), .09)));
  const grass = (w, d, x, z) => add(plane(w, d, x, z, texMat(T.grass, w, d, 6), .07));
  grass(120, 10, -60, 62); grass(120, 10, 60, 62); grass(250, 6, 0, 99.5);
  W.roadLanes = { east: [107.5, 111], west: [115.5, 119] };

  /* ---------- المبنى ---------- */
  const B = add(new THREE.Group());
  B.add(plane(198, 114, 0, 0, texMat(T.stone, 198, 114, 8), .15));
  const wallH = 14;
  B.add(box(198, wallH, .8, M.cladding, 0, wallH / 2, -56.4));
  B.add(box(.8, wallH, 113, M.cladding, -98.4, wallH / 2, 0));
  B.add(box(.8, wallH, 113, M.cladding, 98.4, wallH / 2, 0));
  /* الواجهة الزجاجية الجنوبية */
  const gl = new THREE.Mesh(new THREE.BoxGeometry(196, 12.5, .25), M.glass); gl.position.set(0, 6.4, 56); B.add(gl);
  const mull = new THREE.InstancedMesh(new THREE.BoxGeometry(.22, 12.6, .5), M.darkSteel, 66); mull.castShadow = true;
  const d0 = new THREE.Object3D();
  for (let i = 0; i < 66; i++) { d0.position.set(-97 + i * 3, 6.4, 56); d0.updateMatrix(); mull.setMatrixAt(i, d0.matrix); } B.add(mull);
  [4.2, 8.4].forEach(y => B.add(box(196, .22, .5, M.darkSteel, 0, y, 56, { cast: false })));
  B.add(box(196, 1.6, .6, M.cladding, 0, 13.3, 56));
  /* السقف شفاف جزئيًا مع كمرات ظاهرة (قطاع معماري) */
  const roof = new THREE.Mesh(new THREE.BoxGeometry(198, .4, 114), M.roofGhost); roof.position.set(0, 14.1, 0); B.add(roof);
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(.22, .8, 113), M.steel, 28); beams.castShadow = !!q.shadows;
  for (let i = 0; i < 28; i++) { d0.position.set(-94 + i * 7.2, 13.3, 0); d0.updateMatrix(); beams.setMatrixAt(i, d0.matrix); } B.add(beams);
  const cross = new THREE.InstancedMesh(new THREE.BoxGeometry(196, .35, .35), M.steel, 9);
  for (let i = 0; i < 9; i++) { d0.position.set(0, 12.8, -52 + i * 13); d0.updateMatrix(); cross.setMatrixAt(i, d0.matrix); } B.add(cross);
  /* مظلة المداخل الأمامية */
  B.add(box(196, .6, 12, M.white, 0, 10.6, 62));
  B.add(box(196, .25, .5, M.glass, 0, 10.2, 68, { cast: false }));
  const col = new THREE.InstancedMesh(new THREE.CylinderGeometry(.34, .34, 10.5, 12), M.steel, 15); col.castShadow = true;
  for (let i = 0; i < 15; i++) { d0.position.set(-91 + i * 13, 5.25, 67.4); d0.updateMatrix(); col.setMatrixAt(i, d0.matrix); } B.add(col);
  for (const x of DOORS) {
    B.add(box(11, 8, .5, M.darkSteel, x, 4, 56.3));
    const door = new THREE.Mesh(new THREE.PlaneGeometry(10, 7.6), std({ color: 0x0c1418, emissive: 0xffc678, emissiveIntensity: 0, roughness: .1, metalness: .5 })); door.material.userData = { k: .9 }; door.position.set(x, 3.9, 56.6); B.add(door); W.lampMats.push(door.material);
  }
  /* لافتات المداخل */
  DOORS.forEach((x, i) => { const p = labelPlane('المدخل ' + (4 - i), 9, 2.4, { size: 70, border: '#C9705F' }); p.position.set(x, 9.2, 62.4); B.add(p); });
  const mainSign = labelPlane('معرض تجارب طويق التفاعلية', 46, 5.6, { bg: 'rgba(8,26,25,.9)', size: 86 }); mainSign.position.set(0, 12.2, 68.4); B.add(mainSign);

  /* أرضيات القاعات والمسرح والممر */
  for (const k of Object.keys(HALLS)) {
    const h = HALLS[k], w = h.x1 - h.x0, d = h.z1 - h.z0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std({ map: tiled(T.carpet, w, d, 3), color: new THREE.Color(h.col), roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set((h.x0 + h.x1) / 2, .22, (h.z0 + h.z1) / 2); m.receiveShadow = true; B.add(m);
    const s = labelSprite(h.name, { w: 512, h: 160, size: 84, scale: 24, border: '#E8C77A' }); s.position.set((h.x0 + h.x1) / 2, 11.5, 0); B.add(s);
  }
  B.add(plane(40, 66, -71, 3, std({ color: 0x23272d, roughness: .85 }), .22));
  B.add(plane(198, 16, 0, 48, texMat(T.stone, 198, 16, 6, { roughness: .35 }), .2));    // الممر الرئيسي (Concourse)
  const cs = labelSprite('الممر الرئيسي', { w: 512, h: 128, size: 70, scale: 18 }); cs.position.set(0, 7, 49); B.add(cs);
  /* بوابات الدخول إلى المعرض */
  DOORS.forEach((x, i) => {
    B.add(box(.7, 7, .7, M.white, x - 6, 3.5, 39)); B.add(box(.7, 7, .7, M.white, x + 6, 3.5, 39)); B.add(box(13.4, 1.1, 1, M.white, x, 7, 39));
    const p = labelPlane('الدخول إلى ' + ['قاعة A', 'قاعة B', 'قاعة C', 'المسرح'][3 - i], 10, 1.7, { size: 50, border: '#84B6C6' }); p.position.set(x, 7, 38.4); B.add(p);
  });
  /* الغرف الجانبية بين المسرح والقاعة C */
  const room = (x, z, w, d, h, label, col = 0xdfe7ea) => {
    const mt = std({ color: col, roughness: .5, transparent: true, opacity: .85 });
    B.add(box(w, h, d, mt, x, h / 2, z)); const l = labelPlane(label, Math.min(w - 1, 12), 2, { size: 56, border: '#C9705F' }); l.rotation.x = -Math.PI / 2; l.position.set(x, h + .06, z); B.add(l);
  };
  room(-38, -22, 20, 13, 4.2, 'منطقة العمل', 0xe8eef0); room(-38, -10, 20, 9, 3.6, 'صالة المحكمين', 0xe3d9cc);
  room(-44, 4, 9, 9, 3.6, 'غرفة 1'); room(-31, 4, 12, 9, 3.6, 'غرفة 2'); room(-38, 20, 20, 14, 3.6, 'خدمات');
  room(30, -26, 24, 6, 3.8, 'مركز الإعلام وكبار الزوار', 0xe9e3d3);
  /* المخازن شمالًا */
  [[-87, 14, 'مخزن 1'], [-69, 12, 'مخزن 2'], [-39, 26, 'مخزن 3'], [-5, 30, 'مخزن 4'], [55, 80, 'مخزن 5']].forEach(([x, w, l]) => {
    B.add(box(w, 7, 16, M.cladding, x, 3.5, -47)); const p = labelPlane(l, Math.min(w - 2, 14), 2.4, { size: 60 }); p.rotation.x = -Math.PI / 2; p.position.set(x, 7.06, -47); B.add(p);
  });
  /* أعمدة داخلية */
  const ic = new THREE.InstancedMesh(new THREE.BoxGeometry(.9, 13.4, .9), M.concrete, 17 * 4); ic.castShadow = !!q.shadows; let n = 0;
  for (let i = 0; i < 17; i++) for (let j = 0; j < 4; j++) { d0.position.set(-90 + i * 11.4, 6.7, [-36, -12, 12, 36][j]); d0.updateMatrix(); ic.setMatrixAt(n++, d0.matrix); } B.add(ic);

  /* ---------- الأجنحة ---------- */
  const tileG = new THREE.BoxGeometry(1, .06, 1), wallG = (() => {
    const back = new THREE.BoxGeometry(1, 2.3, .08); back.translate(0, 1.15, -.46);
    const l = new THREE.BoxGeometry(.08, 2.3, 1); l.translate(-.46, 1.15, 0); const r = l.clone(); r.translate(.92, 0, 0);
    const head = new THREE.BoxGeometry(1, .22, .1); head.translate(0, 2.4, -.46);
    return mergeGeometries([back, l, r, head]);
  })();
  const booths = [], BS = 1.45;
  for (const k of Object.keys(HALLS)) {
    const h = HALLS[k], pitch = BS * 2 + 3.1, nb = Math.floor((h.x1 - h.x0 - 2) / pitch), x00 = (h.x0 + h.x1) / 2 - ((nb - 1) * pitch) / 2;
    for (let b = 0; b < nb; b++) for (let c = 0; c < 2; c++) {
      const x = x00 + b * pitch + (c ? BS * .5 + .02 : -BS * .5 - .02); let z = h.z0 + 2.2;
      for (let band = 0; band < 3; band++) { for (let r = 0; r < 12; r++) { booths.push([x, z + r * BS, c ? Math.PI / 2 : -Math.PI / 2]); } z += 12 * BS + 3.4; }
    }
  }
  const palette = ['#C9705F', '#84B6C6', '#E8C77A', '#6FBF9A', '#F4F2EA', '#9a7bd1', '#e0894a', '#4f8798'].map(c => new THREE.Color(c));
  const tilesI = new THREE.InstancedMesh(tileG, std({ roughness: .8 }), booths.length), wallsI = new THREE.InstancedMesh(wallG, std({ roughness: .7 }), booths.length);
  wallsI.castShadow = !!q.shadows; const o = new THREE.Object3D(); const cc = new THREE.Color();
  booths.forEach(([x, z, ry], i) => {
    const col = pick(palette);
    o.position.set(x, .26, z); o.rotation.set(0, 0, 0); o.scale.set(BS * .9, 1, BS * .9); o.updateMatrix(); tilesI.setMatrixAt(i, o.matrix); tilesI.setColorAt(i, cc.copy(col).multiplyScalar(.6));
    o.position.set(x, .26, z); o.rotation.set(0, ry === Math.PI / 2 ? Math.PI : 0, 0); o.scale.set(BS * .9, 1, BS * .9); o.updateMatrix(); wallsI.setMatrixAt(i, o.matrix); wallsI.setColorAt(i, col);
  });
  B.add(tilesI, wallsI); W.boothCount = booths.length;

  /* ---------- المسرح والمقاعد ---------- */
  B.add(box(36, 1.4, 8, std({ color: 0x1c2026, roughness: .5, metalness: .3 }), -71, .9, -26));
  const led = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshBasicMaterial({ toneMapped: false, map: (() => { const t = ctex(1024, 272, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0d3b66'); g.addColorStop(.5, '#1b6a8a'); g.addColorStop(1, '#C9705F'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; const led = tr('تجارب طويق التفاعلية'); let fz = 100; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${fz}px Tajawal, sans-serif`; while (c.measureText(led).width > w - 60 && fz > 30) { fz -= 4; c.font = `800 ${fz}px Tajawal, sans-serif`; } c.fillText(led, w / 2, h / 2 - 16); c.font = '600 44px Tajawal, sans-serif'; c.fillText('SAIF 2026', w / 2, h - 46); }, { srgb: true }); t.repeat.set(1, 1); return t; })() }));
  led.position.set(-71, 6.4, -29.6); B.add(led);
  [-86, -56].forEach(x => B.add(box(.5, 9.6, .5, M.darkSteel, x, 4.8, -29)));
  B.add(box(32, .5, .5, M.darkSteel, -71, 10, -27));
  const chairG = new THREE.BoxGeometry(.5, .75, .5); chairG.translate(0, .38, 0);
  const rows = 34, per = 24, seats = [];
  [-80.8, -61.2].forEach(cx => { for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) seats.push([cx + (i - per / 2) * .6, -13 + r * .9, r < 4 ? 1 : 0]); });
  const chairs = new THREE.InstancedMesh(chairG, std({ roughness: .8 }), seats.length); const vip = new THREE.Color('#C9705F'), norm = new THREE.Color('#2f3b48');
  seats.forEach(([x, z, v], i) => { o.position.set(x, .22, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); chairs.setMatrixAt(i, o.matrix); chairs.setColorAt(i, v ? vip : norm); });
  B.add(chairs);
  const vipL = labelSprite('كبار الزوار VIP', { w: 512, h: 128, size: 60, scale: 14, border: '#E8C77A' }); vipL.position.set(-71, 6, -14); B.add(vipL);

  /* ---------- الموقع الخارجي: سياج وبوابات ---------- */
  const S = add(new THREE.Group());
  const fencePostsX = []; for (let x = -124; x <= 124; x += 3) if (!GATES.some(g => Math.abs(x - g.x) < 12)) fencePostsX.push(x);
  const fp = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, 1.6, .18), M.darkSteel, fencePostsX.length); fencePostsX.forEach((x, i) => { d0.position.set(x, .8, FENCE_Z); d0.updateMatrix(); fp.setMatrixAt(i, d0.matrix); }); S.add(fp);
  [[-124, -107], [-83, -12], [12, 83], [107, 124]].forEach(([a, b]) => { S.add(box(b - a, .1, .1, M.steel, (a + b) / 2, 1.5, FENCE_Z, { cast: false })); S.add(box(b - a, .08, .08, M.steel, (a + b) / 2, .6, FENCE_Z, { cast: false })); });

  const laneP = 1.7, lanePos = (gx, j, extra) => (extra ? gx + 6.6 + (j - 1.5) * laneP : gx - 6.6 + (j - 1.5) * laneP);
  GATES.forEach((g, gi) => {
    const G = { x: g.x, name: g.name, baseX: j => lanePos(g.x, j, false), extraX: j => lanePos(g.x, j, true) };
    const grp = new THREE.Group(); S.add(grp);
    grp.add(box(26, .5, 10, M.white, g.x, 7.2, FENCE_Z - .5));
    grp.add(box(26, .2, 10.4, M.glass, g.x, 6.9, FENCE_Z - .5, { cast: false }));
    [-12.4, 12.4].forEach(dx => [-4, 3.2].forEach(dz => grp.add(box(.5, 7.2, .5, M.steel, g.x + dx, 3.6, FENCE_Z + dz))));
    const s1 = labelPlane('بوابة ' + g.name, 16, 3.2, { size: 82, border: '#E8C77A', bg: 'rgba(8,26,25,.92)' }); s1.position.set(g.x, 9, FENCE_Z - 5.8); grp.add(s1);
    s1.rotation.y = Math.PI; const s2 = labelPlane('بوابة ' + g.name, 16, 3.2, { size: 82, border: '#E8C77A', bg: 'rgba(8,26,25,.92)' }); s2.position.set(g.x, 9, FENCE_Z + 4.9); grp.add(s2);
    const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, .95, 1.4), M.steel, 8), posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, 1.05, 1.6), M.darkSteel, 8);
    for (let j = 0; j < 8; j++) { const x = j < 4 ? G.baseX(j) : G.extraX(j - 4); d0.position.set(x - .55, .55, FENCE_Z); d0.updateMatrix(); posts.setMatrixAt(j, d0.matrix); d0.position.set(x, .55, FENCE_Z); d0.updateMatrix(); arms.setMatrixAt(j, d0.matrix); }
    grp.add(arms, posts);
    G.okMat = std({ color: 0x111, emissive: 0x57e39a, emissiveIntensity: 1.8 }); G.noMat = std({ color: 0x111, emissive: 0xff4b3a, emissiveIntensity: 1.8 });
    for (let j = 0; j < 8; j++) { const x = j < 4 ? G.baseX(j) : G.extraX(j - 4); const L = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), j < 4 ? G.okMat : G.noMat); L.position.set(x, 3.6, FENCE_Z - 1); grp.add(L); if (j >= 4) (G.extraLights = G.extraLights || []).push(L); }
    G.barrier = box(8.4, .5, .2, std({ color: 0xff4b3a, emissive: 0x551a14 }), lanePos(g.x, 1.5, true), 1.1, FENCE_Z - 2.2); grp.add(G.barrier);
    G.barrier2 = box(8.4, .5, .2, std({ color: 0xffffff }), lanePos(g.x, 1.5, true), 1.55, FENCE_Z - 2.2); grp.add(G.barrier2);
    G.sign2 = labelSprite('بوابة إضافية', { w: 512, h: 128, size: 56, scale: 9, border: '#6FBF9A' }); G.sign2.position.set(lanePos(g.x, 1.5, true), 5, FENCE_Z - 3); G.sign2.visible = false; grp.add(G.sign2);
    /* محطة التاكسي أمام البوابة */
    const bayM = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), std({ color: 0xf2c230, roughness: .8, transparent: true, opacity: .55 })); bayM.rotation.x = -Math.PI / 2; bayM.position.set(g.x, .16, 107.5); S.add(bayM);
    const ts = labelSprite('محطة التاكسي', { w: 512, h: 128, size: 60, scale: 11, border: '#f2c230' }); ts.position.set(g.x, 6.2, 104.8); S.add(ts); G.taxiSign = ts; ts.visible = false;
    G.bayMesh = bayM; bayM.visible = false;
    G.bays = Array.from({ length: 6 }, (_, k) => [g.x - 9.5 + k * 3.8, 107.6]);
    /* منطقة الالتقاط للنقر على البوابة */
    const hit = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 24), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); hit.position.set(g.x, 6, FENCE_Z - 6); hit.userData.gate = gi; S.add(hit); W.pick.push(hit);
    W.gates.push(G);
  });
  W.setExtraOpen = (gi, open, t = 1) => {
    const G = W.gates[gi]; G.extraLights.forEach(L => { L.material = open ? G.okMat : G.noMat; });
    G.barrier.visible = G.barrier2.visible = !open; G.sign2.visible = open;
  };

  /* أعمدة إنارة */
  const lampG = (() => { const p = new THREE.CylinderGeometry(.12, .16, 9, 8); p.translate(0, 4.5, 0); const a = new THREE.BoxGeometry(2.4, .15, .15); a.translate(1.1, 9, 0); colorGeo(p, 0x3a4046); colorGeo(a, 0x3a4046); return mergeGeometries([p, a]); })();
  const lampPts = []; for (let x = -120; x <= 120; x += 20) { lampPts.push([x, 66, 0]); lampPts.push([x, 99, 0]); } for (let z = 108; z < 200; z += 14) { lampPts.push([-9, z, 0]); lampPts.push([9, z, Math.PI]); } for (let x = -300; x <= 300; x += 30) lampPts.push([x, 126, 0]);
  const lampI = new THREE.InstancedMesh(lampG, std({ vertexColors: true, roughness: .6, metalness: .6 }), lampPts.length); lampI.castShadow = !!q.shadows;
  const headI = new THREE.InstancedMesh(new THREE.SphereGeometry(.34, 8, 6), M.lamp, lampPts.length);
  lampPts.forEach(([x, z, ry], i) => { o.position.set(x, 0, z); o.rotation.set(0, ry, 0); o.scale.set(1, 1, 1); o.updateMatrix(); lampI.setMatrixAt(i, o.matrix); const hx = x + Math.cos(ry) * 2.2; o.position.set(hx, 8.85, z - Math.sin(ry) * 2.2); o.updateMatrix(); headI.setMatrixAt(i, o.matrix); });
  S.add(lampI, headI); W.lampHeads = lampPts.map(([x, z, ry]) => [x + Math.cos(ry) * 2.2, 8.7, z - Math.sin(ry) * 2.2]);

  /* نخيل وأشجار */
  const palmG = (() => {
    const t = new THREE.CylinderGeometry(.18, .3, 6.4, 8); t.translate(0, 3.2, 0); colorGeo(t, 0x7a6248); const parts = [t];
    for (let k = 0; k < 9; k++) { const f = new THREE.BoxGeometry(.5, .06, 3.6); f.translate(0, 0, 1.8); f.rotateX(-.45); f.rotateY((k / 9) * TAU); f.translate(0, 6.3, 0); colorGeo(f, k % 2 ? 0x3f7a35 : 0x4d8a3f); parts.push(f); }
    return mergeGeometries(parts);
  })();
  const treePts = []; for (let x = -118; x <= 118; x += 9) { if (Math.abs(x) < 14) continue; treePts.push([x, 60 + rr(-1, 1)]); treePts.push([x + 4, 71 + rr(-.5, .5)]); }
  for (let z = 108; z <= 196; z += 8) { treePts.push([-11.5, z]); treePts.push([11.5, z]); }
  for (let x = -140; x <= 140; x += 14) { if (Math.abs(x) < 15) continue; treePts.push([x, 127]); }
  const palms = new THREE.InstancedMesh(palmG, std({ vertexColors: true, roughness: .85 }), treePts.length); palms.castShadow = !!q.shadows;
  treePts.forEach(([x, z], i) => { o.position.set(x, 0, z); o.rotation.set(0, R() * TAU, 0); const s = rr(.85, 1.25); o.scale.set(s, s, s); o.updateMatrix(); palms.setMatrixAt(i, o.matrix); }); S.add(palms);
  /* أحواض نباتية */
  const pl = new THREE.InstancedMesh(new THREE.BoxGeometry(4, .7, 1.6), std({ color: 0x6b7f4c, roughness: .9 }), 30); for (let i = 0; i < 30; i++) { o.position.set(-116 + i * 8 + (i > 14 ? 4 : 0), .4, 76); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pl.setMatrixAt(i, o.matrix); } S.add(pl);

  /* ---------- المترو ---------- */
  const MZ = { a: 209, b: 219, st: 214 };
  const bed = box(900, .5, 28, std({ color: 0x6f6a62, roughness: 1 }), 0, .1, 214, { cast: false }); S.add(bed);
  const slp = new THREE.InstancedMesh(new THREE.BoxGeometry(.4, .16, 3.2), std({ color: 0x4a4540, roughness: 1 }), 900 * 2); let si = 0;
  [MZ.a, MZ.b].forEach(z => { for (let i = 0; i < 900; i++) { o.position.set(-450 + i, .4, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); slp.setMatrixAt(si++, o.matrix); } });
  S.add(slp); [MZ.a, MZ.b].forEach(z => [-.72, .72].forEach(dz => S.add(box(900, .14, .12, M.steel, 0, .56, z + dz, { cast: false }))));
  S.add(box(110, 1.0, 7, std({ color: 0xcfcac0, roughness: .8 }), 0, .6, MZ.st));                                   // الرصيف
  S.add(box(110, .06, .5, std({ color: 0xf2c230, roughness: .8 }), 0, 1.13, MZ.st - 2.8, { cast: false })); S.add(box(110, .06, .5, std({ color: 0xf2c230, roughness: .8 }), 0, 1.13, MZ.st + 2.8, { cast: false }));
  S.add(box(110, .4, 11, M.white, 0, 6.4, MZ.st)); const stCol = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .22, 5.8, 10), M.steel, 12);
  for (let i = 0; i < 12; i++) { o.position.set(-50 + i * 9.1, 3.5, MZ.st + (i % 2 ? 3 : -3)); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); stCol.setMatrixAt(i, o.matrix); } S.add(stCol);
  S.add(box(42, 7.5, 10, std({ color: 0x4a4f55, roughness: .45, metalness: .6 }), 0, 4.5, 199)); S.add(box(44, .8, 12, std({ color: 0x8a9096, roughness: .4, metalness: .7 }), 0, 9.3, 199));
  const lv = new THREE.InstancedMesh(new THREE.BoxGeometry(42.2, .18, .5), M.steel, 14); for (let i = 0; i < 14; i++) { d0.position.set(0, 1.5 + i * .6, 193.9); d0.updateMatrix(); lv.setMatrixAt(i, d0.matrix); } S.add(lv);
  S.add(box(14, 5, .4, M.glass, 0, 2.6, 193.7)); S.add(box(16, .5, 4, M.white, 0, 5.4, 192));
  /* جسر المشاة المغطى بين المحطة والمعرض */
  const BZ0 = 70, BZ1 = 195, BL = BZ1 - BZ0, BM = (BZ0 + BZ1) / 2;
  S.add(box(9, .7, BL, std({ color: 0x8d9298, roughness: .5, metalness: .5, transparent: true, opacity: .55 }), 0, 11, BM, { cast: false }));
  S.add(box(9.4, .3, BL, M.roofGhost, 0, 14.6, BM, { cast: false })); S.add(box(.25, 3.2, BL, M.glass, -4.4, 12.8, BM, { cast: false })); S.add(box(.25, 3.2, BL, M.glass, 4.4, 12.8, BM, { cast: false }));
  S.add(box(.3, .3, BL, M.steel, -4.4, 14.3, BM, { cast: false })); S.add(box(.3, .3, BL, M.steel, 4.4, 14.3, BM, { cast: false })); S.add(box(.3, .3, BL, M.steel, -4.4, 11.3, BM, { cast: false })); S.add(box(.3, .3, BL, M.steel, 4.4, 11.3, BM, { cast: false }));
  const bc = new THREE.InstancedMesh(new THREE.CylinderGeometry(.5, .6, 10.6, 12), M.concrete, 8); bc.castShadow = true; for (let i = 0; i < 8; i++) { d0.position.set(0, 5.3, BZ0 + 8 + i * 17); d0.updateMatrix(); bc.setMatrixAt(i, d0.matrix); } S.add(bc);
  const bs = labelPlane('جسر المترو ⟵ المعرض', 12, 1.8, { size: 52, border: '#84B6C6' }); bs.position.set(0, 13, 69.6); S.add(bs);
  const ms = labelPlane('محطة المترو', 22, 4.2, { size: 92, border: '#5fd08a', bg: 'rgba(10,40,30,.95)' }); ms.position.set(0, 11.6, 193.6); S.add(ms);
  const msg = labelSprite('المعرض 🡐 المترو', { w: 512, h: 128, size: 54, scale: 12, border: '#84B6C6' }); msg.position.set(0, 7, 150); S.add(msg); W.metroSign = msg;
  /* القطار */
  const carG = (() => {
    const body = new THREE.BoxGeometry(19, 3.1, 3); body.translate(0, 2.3, 0); colorGeo(body, 0xc4281f);
    const stripe = new THREE.BoxGeometry(19.02, .5, 3.02); stripe.translate(0, 1.5, 0); colorGeo(stripe, 0xf4f2ea);
    const win = new THREE.BoxGeometry(17.6, .95, 3.04); win.translate(0, 2.9, 0); colorGeo(win, 0x1a2a38);
    const roofG = new THREE.BoxGeometry(18, .3, 2.5); roofG.translate(0, 3.95, 0); colorGeo(roofG, 0xa31f18);
    const bog = new THREE.BoxGeometry(14, .5, 2.4); bog.translate(0, .75, 0); colorGeo(bog, 0x2a2f34);
    const doors = []; for (let k = -2; k <= 2; k++) { const d = new THREE.BoxGeometry(1.6, 2.1, 3.06); d.translate(k * 3.6, 2.2, 0); colorGeo(d, 0x8f1c16); doors.push(d); }
    return mergeGeometries([body, stripe, win, roofG, bog, ...doors]);
  })();
  const trainMat = std({ vertexColors: true, roughness: .35, metalness: .45, emissive: 0xffd9a0, emissiveIntensity: 0 });
  W.lampMats.push(trainMat); trainMat.userData = { k: .7 };
  const mkTrain = z => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(carG, trainMat); c.position.x = -i * 19.6; c.castShadow = !!q.shadows; g.add(c); } g.position.set(-400, 0, z); S.add(g); return g; };
  W.trains = [{ g: mkTrain(MZ.a), dir: 1, z: MZ.a, off: 0 }, { g: mkTrain(MZ.b), dir: -1, z: MZ.b, off: 22 }];
  W.trainPhase = (T0, k) => { /* دورة 44 ثانية: وصول 9، وقوف 9، مغادرة 9، غياب 17 */
    const t = ((T0 + k.off) % 44 + 44) % 44, STOP = 36;
    let u; if (t < 9) u = -330 + (330 - 0) * (1 - Math.pow(1 - t / 9, 2.2)) - 0; else if (t < 18) u = 0; else if (t < 27) { const s = (t - 18) / 9; u = 330 * s * s; } else u = 9999;
    const head = u > 9000 ? -9999 : (k.dir > 0 ? u + 38 - 0 : -(u) - 38);   // رأس القطار يتجاوز مركز الرصيف
    k.g.visible = u < 9000; k.g.rotation.y = k.dir > 0 ? 0 : Math.PI;
    k.g.position.x = k.dir > 0 ? (u - 20) : -(u - 20) ; k.dwell = t >= 9 && t < 18; k.t = t; };

  /* ---------- مركبات (مجسّم واحد مدمج) ---------- */
  const carGeo = (() => {
    const b = new THREE.BoxGeometry(4.5, .72, 1.85); b.translate(0, .62, 0); colorGeo(b, 0xffffff);
    const cab = new THREE.BoxGeometry(2.4, .62, 1.62); cab.translate(-.2, 1.25, 0); colorGeo(cab, 0x9fb3c0);
    const roofC = new THREE.BoxGeometry(2.1, .08, 1.55); roofC.translate(-.2, 1.58, 0); colorGeo(roofC, 0xffffff);
    const parts = [b, cab, roofC];
    for (const [x, z] of [[1.4, .9], [1.4, -.9], [-1.4, .9], [-1.4, -.9]]) { const w = new THREE.CylinderGeometry(.34, .34, .26, 12); w.rotateX(Math.PI / 2); w.translate(x, .34, z); colorGeo(w, 0x111111); parts.push(w); }
    for (const z of [.6, -.6]) { const l = new THREE.BoxGeometry(.06, .16, .4); l.translate(2.27, .72, z); colorGeo(l, 0xfff2c0); parts.push(l); const t = new THREE.BoxGeometry(.06, .16, .4); t.translate(-2.27, .72, z); colorGeo(t, 0xaa1111); parts.push(t); }
    return mergeGeometries(parts);
  })();
  W.carGeo = carGeo; W.carMat = std({ vertexColors: true, roughness: .35, metalness: .55 });
  W.carColors = ['#f4f4f4', '#d0d3d6', '#1d2733', '#8b1e2d', '#2b4a6b', '#6b6e70', '#c9c2b2', '#1f3a2c', '#e8e8e8'].map(c => new THREE.Color(c));

  /* السيارات المركونة */
  const parked = []; for (const [x0] of [[-150], [8]]) for (const zr of [134.6, 140.2, 160, 165.6, 183, 188.6]) for (let i = 0; i < 54; i++) if (R() < .62) parked.push([x0 + 1.3 + i * 2.6, zr, R() < .5 ? Math.PI / 2 : -Math.PI / 2]);
  const pk = new THREE.InstancedMesh(carGeo, W.carMat, parked.length); pk.castShadow = false; pk.receiveShadow = true;
  parked.forEach(([x, z, ry], i) => { o.position.set(x, 0, z); o.rotation.set(0, ry, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pk.setMatrixAt(i, o.matrix); pk.setColorAt(i, pick(W.carColors)); }); S.add(pk);
  W.parkedCount = parked.length;
  W.group = { building: B, site: S };
  return W;
}
