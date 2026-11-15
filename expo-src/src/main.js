import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildWorld, GATES, FENCE_Z, DOORS } from './world.js';
import { P, makeAgents, waveT, clockOf } from './sim.js';
import { clamp, lerp, ease, TAU, R, rr, pick, colorGeo, labelSprite } from './util.js';

const V3 = THREE.Vector3, Col = THREE.Color;
const TODK = [
  { t: 0,   sunC: '#ffd8a0', sunI: 2.5, el: 24, az: 292, hemiS: '#bcd9f2', hemiG: '#9a8760', hemiI: .8, top: '#4f8fd0', bot: '#f6dcae', fog: '#ecd3a8', env: .6, lamp: 0 },
  { t: .5,  sunC: '#ff8c52', sunI: 1.5, el: 6,  az: 282, hemiS: '#6f86b8', hemiG: '#6a5546', hemiI: .62, top: '#2c3f78', bot: '#f2905f', fog: '#c98d6d', env: .42, lamp: .55 },
  { t: 1,   sunC: '#8fb0ff', sunI: .2, el: 38, az: 120, hemiS: '#16254a', hemiG: '#080b12', hemiI: .24, top: '#050a1a', bot: '#16263f', fog: '#0e1828', env: .12, lamp: 1 },
];
const SKYV = `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const SKYF = `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP;
void main(){ vec3 d = normalize(vP); float h = clamp(d.y,0.0,1.0); vec3 c = mix(bot, top, pow(h,.55));
 float s = max(dot(d,normalize(sunDir)),0.0); c += sunCol*(pow(s,380.0)*1.6 + pow(s,12.0)*.28);
 gl_FragColor = vec4(c,1.0); }`;

export function create(container, opts = {}) {
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  const q = { shadows: opts.shadows ?? !isMobile, shadowSize: isMobile ? 1024 : 2048, maxPR: opts.maxPR ?? (isMobile ? 1.25 : 1.6), people: isMobile ? 1 : 1 };
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = q.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:0'; container.appendChild(cv);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); const envRT = pm.fromScene(new RoomEnvironment(), .04); scene.environment = envRT.texture; scene.environmentIntensity = .7;
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 1, 3000);
  scene.fog = new THREE.Fog('#ecd3a8', 260, 1100);

  /* إضاءة وسماء */
  const sun = new THREE.DirectionalLight('#ffd8a0', 3); sun.castShadow = q.shadows;
  sun.shadow.mapSize.set(q.shadowSize, q.shadowSize); const sc = sun.shadow.camera; sc.left = -190; sc.right = 190; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 700; sun.shadow.bias = -.0004; sun.shadow.normalBias = .6;
  sun.target.position.set(0, 0, 50); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#bcd9f2', '#9a8760', 1); scene.add(hemi);
  const skyMat = new THREE.ShaderMaterial({ vertexShader: SKYV, fragmentShader: SKYF, side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new Col() }, bot: { value: new Col() }, sunDir: { value: new V3(0, 1, 0) }, sunCol: { value: new Col() } } });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);

  const W = buildWorld(scene, q);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,225,160,1)'); g.addColorStop(.25, 'rgba(255,205,120,.45)'); g.addColorStop(1, 'rgba(255,190,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glowG = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(W.lampHeads.flat(), 3));
  const glow = new THREE.Points(glowG, new THREE.PointsMaterial({ map: glowTex, size: 9, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })); glow.frustumCulled = false; scene.add(glow);
  const starA = []; for (let i = 0; i < 700; i++) { const u = R(), v = R() * .98 + .02, th = u * TAU, ph = Math.acos(v); starA.push(Math.sin(ph) * Math.cos(th) * 2200, Math.cos(ph) * 2200, Math.sin(ph) * Math.sin(th) * 2200); }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starA, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false })); stars.frustumCulled = false; scene.add(stars);
  const youMark = (() => { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 28), new THREE.MeshBasicMaterial({ color: 0xE8C77A, side: THREE.DoubleSide, depthTest: false, transparent: true })); r.rotation.x = -Math.PI / 2; r.position.y = .35; g.add(r); const s = labelSprite('أنت', { w: 256, h: 112, size: 64, scale: 5, border: '#E8C77A', depthTest: false }); s.position.y = 3.6; g.add(s); g.visible = false; g.renderOrder = 20; scene.add(g); return g; })();
  const gateX = i => GATES[i].x;

  /* ---------- الوقت من اليوم ---------- */
  const cA = new Col(), cB = new Col();
  let tod = 0;
  function setTOD(t) {
    tod = clamp(t, 0, 1); let a = TODK[0], b = TODK[1]; if (tod > .5) { a = TODK[1]; b = TODK[2]; }
    const f = ease(clamp((tod - a.t) / (b.t - a.t), 0, 1)), mixc = (k) => cA.set(a[k]).lerp(cB.set(b[k]), f);
    sun.color.copy(mixc('sunC')); sun.intensity = lerp(a.sunI, b.sunI, f);
    const el = THREE.MathUtils.degToRad(lerp(a.el, b.el, f)), az = THREE.MathUtils.degToRad(lerp(a.az, b.az, f));
    const d = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    sun.position.copy(sun.target.position).addScaledVector(d, 380); skyMat.uniforms.sunDir.value.copy(d); skyMat.uniforms.sunCol.value.copy(sun.color).multiplyScalar(tod > .75 ? .35 : 1);
    hemi.color.copy(mixc('hemiS')); hemi.groundColor.copy(cA.set(a.hemiG).lerp(cB.set(b.hemiG), f)); hemi.intensity = lerp(a.hemiI, b.hemiI, f);
    skyMat.uniforms.top.value.copy(cA.set(a.top).lerp(cB.set(b.top), f)); skyMat.uniforms.bot.value.copy(cA.set(a.bot).lerp(cB.set(b.bot), f));
    scene.fog.color.copy(cA.set(a.fog).lerp(cB.set(b.fog), f)); scene.environmentIntensity = lerp(a.env, b.env, f);
    const lamp = lerp(a.lamp, b.lamp, f); W.lampMats.forEach(m => { m.emissiveIntensity = lamp * (m.userData?.k ?? 2.4); });
    W.glassMats.forEach(m => { m.emissiveIntensity = lamp * .55; }); glow.material.opacity = lamp * .95; stars.material.opacity = clamp((tod - .6) / .35, 0, 1);
    renderer.toneMappingExposure = lerp(1, 1.18, tod > .5 ? (tod - .5) * 2 : 0);
  }
  W.lampMats.forEach(m => { if (!m.userData || !m.userData.k) m.userData = { k: m === W.M.signGlow ? 1.4 : 2.4 }; });

  /* ---------- الكاميرا ---------- */
  const cam = { tx: 0, ty: 0, tz: 60, yaw: 0, pit: .62, dist: 330 }, goal = { ...cam }, PRE = {
    overview: { tx: 0, ty: 0, tz: 62, yaw: .0, pit: .58, dist: 340 }, intro: { tx: 0, ty: 0, tz: 100, yaw: -.65, pit: .38, dist: 150 },
    building: { tx: 0, ty: 0, tz: 8, yaw: .25, pit: .72, dist: 210 }, halls: { tx: 0, ty: 0, tz: 4, yaw: 0, pit: 1.2, dist: 150 },
    stage: { tx: -71, ty: 0, tz: -4, yaw: .55, pit: .62, dist: 70 }, front: { tx: 0, ty: 3, tz: 62, yaw: .1, pit: .2, dist: 110 },
    gates: { tx: 0, ty: 0, tz: 96, yaw: 0, pit: .5, dist: 225 }, g0: { tx: 0, ty: 2, tz: 92, yaw: .22, pit: .42, dist: 62 }, g1: { tx: -95, ty: 2, tz: 92, yaw: .5, pit: .42, dist: 62 }, g2: { tx: 95, ty: 2, tz: 92, yaw: -.5, pit: .42, dist: 62 },
    parking: { tx: 0, ty: 0, tz: 150, yaw: .0, pit: .68, dist: 215 }, metro: { tx: 0, ty: 1, tz: 208, yaw: -.55, pit: .3, dist: 105 }, car: { tx: -40, ty: 0, tz: 135, yaw: .45, pit: .35, dist: 90 },
    taxi: { tx: 0, ty: 1, tz: 104, yaw: .6, pit: .3, dist: 48 }, sim: { tx: 0, ty: 0, tz: 86, yaw: 0, pit: .46, dist: 168 }, q0: { tx: 0, ty: 0, tz: 88, yaw: .18, pit: .42, dist: 82 }, q1: { tx: -92, ty: 0, tz: 88, yaw: .5, pit: .42, dist: 82 }, q2: { tx: 92, ty: 0, tz: 88, yaw: -.5, pit: .42, dist: 82 }, analysis: { tx: 0, ty: 0, tz: 92, yaw: 0, pit: .56, dist: 300 },
  };
  let camT = null, auto = null, controls = true, userCb = null;
  function camTo(name, dur = 1.8) { const p = typeof name === 'string' ? PRE[name] : name; if (!p) return; camT = { from: { ...cam }, to: { ...p }, t: 0, dur }; auto = null; }
  function applyCam() {
    const cp = Math.cos(cam.pit); camera.position.set(cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + Math.sin(cam.pit) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
  }
  Object.assign(cam, PRE.intro); applyCam();
  /* مدارات المستخدم */
  const ptr = new Map(); let drag = null, pinch0 = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } });
  cv.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; const p = ptr.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (!controls) return; camT = null; auto = null; userCb && userCb();
    const rect = cv.getBoundingClientRect(), k = 1 / Math.max(.2, rect.width / cv.clientWidth);
    if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); cam.dist = clamp(cam.dist * (pinch0 / Math.max(1, d)), 25, 520); pinch0 = d; goal.dist = cam.dist; return; }
    if (drag) drag.moved += Math.abs(dx) + Math.abs(dy);
    if (e.shiftKey || e.buttons === 2) { const s = cam.dist * .0016 * k; cam.tx -= Math.cos(cam.yaw) * dx * s; cam.tz += Math.sin(cam.yaw) * dx * s; }
    else { cam.yaw -= dx * .006 * k; cam.pit = clamp(cam.pit + dy * .005 * k, .08, 1.5); }
    Object.assign(goal, cam);
  });
  const up = e => { ptr.delete(e.pointerId); if (drag && drag.moved < 8 && performance.now() - drag.t < 450 && e.type === 'pointerup') pickAt(e); drag = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => { if (!controls) return; e.preventDefault(); camT = null; userCb && userCb(); cam.dist = clamp(cam.dist * (1 + Math.sign(e.deltaY) * .1), 25, 520); goal.dist = cam.dist; }, { passive: false });
  const ray = new THREE.Raycaster(), mp = new THREE.Vector2(); let onPick = null;
  function pickAt(e) {
    const r = cv.getBoundingClientRect(); mp.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mp, camera);
    const h = ray.intersectObjects(W.pick, false)[0]; if (h && onPick) onPick(h.object.userData.gate);
  }

  /* ---------- مركبات ---------- */
  const O = new THREE.Object3D(), dummyHidden = () => { O.position.set(0, -80, 0); O.scale.setScalar(.001); O.rotation.set(0, 0, 0); O.updateMatrix(); return O.matrix; };
  const mkInst = (n, tint) => { const m = new THREE.InstancedMesh(W.carGeo, W.carMat, n); m.castShadow = q.shadows; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); for (let i = 0; i < n; i++) { m.setMatrixAt(i, dummyHidden()); m.setColorAt(i, tint ? new Col(tint) : pick(W.carColors)); } scene.add(m); return m; };
  const amb = mkInst(30), dep = mkInst(130), taxis = mkInst(70, '#f2b81c');
  const ambS = Array.from({ length: 30 }, (_, i) => ({ s: R() * 760, dir: i % 2 ? -1 : 1, v: rr(9, 15) }));
  function setCar(inst, i, x, z, ang, y = 0) { O.position.set(x, y, z); O.rotation.set(0, ang, 0); O.scale.setScalar(1); O.updateMatrix(); inst.setMatrixAt(i, O.matrix); inst.instanceMatrix.needsUpdate = true; }
  const movers = []; let depFree = [...Array(130).keys()], taxiFree = [...Array(70).keys()];
  function spawnMover(kind, x, z, path, speed, hold = 0, onEnd) {
    const pool = kind === 'taxi' ? taxiFree : depFree; if (!pool.length) return null; const i = pool.pop();
    const m = { kind, i, x, z, path, pi: 0, v: speed, hold, ang: 0, onEnd }; const f = path[0]; m.ang = Math.atan2(-(f[1] - z), f[0] - x); movers.push(m); return m;
  }
  function stepMovers(dt) {
    for (let k = movers.length - 1; k >= 0; k--) {
      const m = movers[k], inst = m.kind === 'taxi' ? taxis : dep;
      if (m.hold > 0) { m.hold -= dt; setCar(inst, m.i, m.x, m.z, m.ang); continue; }
      const [tx, tz] = m.path[m.pi], dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz), st = m.v * dt;
      if (d <= st) { m.x = tx; m.z = tz; m.pi++; if (m.pi >= m.path.length) { inst.setMatrixAt(m.i, dummyHidden()); inst.instanceMatrix.needsUpdate = true; (m.kind === 'taxi' ? taxiFree : depFree).push(m.i); movers.splice(k, 1); continue; } }
      else { m.x += dx / d * st; m.z += dz / d * st; const ta = Math.atan2(-dz, dx); let da = ta - m.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); m.ang += da * Math.min(1, dt * 7); }
      setCar(inst, m.i, m.x, m.z, m.ang);
    }
  }
  const LANE_E = 111.2, LANE_W = 116.8;
  function departCar(px, pz) {   // سيارة تغادر من موقف
    const east = px > 0, ex = east ? 153 : -153, lane = east ? LANE_E : LANE_W;
    return spawnMover('car', px, pz, [[ex, pz], [ex, lane], [east ? 420 : -420, lane]], rr(9, 13), rr(.2, 1.4));
  }
  function taxiLeave(bx, bz, hold = 1) { const east = bx > -20; return spawnMover('taxi', bx, bz, [[east ? 420 : -420, LANE_E - (east ? 0 : -5.6)]], rr(10, 14), hold); }

  /* ---------- القطار ---------- */
  const TR = W.trains; let trainClock = 0; const stPos = [];
  function trainUpdate(dt) {
    trainClock += dt;
    TR.forEach(k => {
      const t = ((trainClock + k.off) % 44 + 44) % 44; let u;
      if (t < 9) { const s = t / 9; u = -380 * (1 - (1 - Math.pow(1 - s, 2.4))) * 0 + (-380 * Math.pow(1 - s, 2.4)); } else if (t < 18) u = 0; else if (t < 27) { const s = (t - 18) / 9; u = 380 * s * s * 1.1; } else u = 9999;
      k.g.visible = u < 9000; k.dwell = t >= 10.5 && t < 17; k.t = t;
      if (k.dir > 0) { k.g.rotation.y = 0; k.g.position.x = u + 29; } else { k.g.rotation.y = Math.PI; k.g.position.x = -u - 29; }
    });
  }

  /* ---------- الأشخاص ---------- */
  const humanGeo = (() => {
    const b = new THREE.CylinderGeometry(.2, .24, .95, 7); b.translate(0, .95, 0); const l = new THREE.CylinderGeometry(.14, .14, .5, 6); l.translate(0, .25, 0);
    colorGeo(b, 0xffffff); colorGeo(l, 0x2a2f38); return mergeGeometries([b, l]);
  })(), headGeo = new THREE.SphereGeometry(.15, 8, 6), SKIN = ['#e8bd96', '#c99568', '#9b6a45', '#7a4b2d'].map(c => new Col(c));
  const CLOTH = ['#f4f2ea', '#e8e1d0', '#cfd5d8', '#2f3b48', '#C9705F', '#84B6C6', '#E8C77A', '#6FBF9A', '#101214', '#e9e9e9'].map(c => new Col(c));
  const NP = 470, bodyI = new THREE.InstancedMesh(humanGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 }), NP), headI = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: .7 }), NP);
  [bodyI, headI].forEach(m => { m.frustumCulled = false; m.castShadow = q.shadows; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); });
  const people = Array.from({ length: NP }, (_, i) => { bodyI.setColorAt(i, pick(CLOTH)); headI.setColorAt(i, pick(SKIN)); return { x: 0, y: -50, z: 0, vis: false, s: rr(.92, 1.08), ph: R() * TAU }; });
  let pdirty = true;
  function putPerson(p, i, t, moving) {
    const bob = moving ? Math.abs(Math.sin(t * 11 + p.ph)) * .07 : 0, y = p.vis ? p.y + bob : -60;
    O.position.set(p.x, y, p.z); O.rotation.set(0, p.ang || 0, 0); O.scale.setScalar(p.vis ? p.s : .001); O.updateMatrix(); bodyI.setMatrixAt(i, O.matrix);
    O.position.set(p.x, y + 1.68 * p.s, p.z); O.rotation.set(0, 0, 0); O.updateMatrix(); headI.setMatrixAt(i, O.matrix);
  }
  /* زوّار الصالات (ثابتون) + مشاة ديكور */
  let pn = 0; const statics = [], walkers = [];
  const HC = [[-17, 0, 20, 58], [29, 0, 44, 58], [76, 0, 36, 58]];
  for (let i = 0; i < 90; i++) { const p = people[pn++]; const c = pick(HC); p.x = c[0] + rr(-c[2], c[2]) / 1.3; p.z = rr(-24, 30); p.y = .25; p.vis = true; p.ang = R() * TAU; statics.push(p); }
  for (let i = 0; i < 60; i++) { const p = people[pn++]; const z0 = rr(108, 190), side = pick([-3.5, 3.5, -5.5, 5.5]); p.vis = true; p.y = .1; p.w = { a: [side + rr(-.8, .8), 107], b: [side + rr(-.8, .8), 192], f: R(), v: rr(1.1, 1.6) }; walkers.push(p); }
  for (let i = 0; i < 40; i++) { const p = people[pn++]; p.vis = true; p.y = .2; p.w = { a: [rr(-90, 90), 62], b: [rr(-90, 90), 90], f: R(), v: rr(1, 1.5) }; walkers.push(p); }
  const SIMBASE = pn;   // بقية المصفوفة للمحاكاة

  /* ---------- المحاكاة ---------- */
  let sim = null;
  const dests = { car: (g) => { const px = g === 1 ? rr(-140, -20) : g === 2 ? rr(20, 140) : (R() < .5 ? rr(-140, -20) : rr(20, 140)); return { px, pz: pick([137.4, 162.8, 185.8]) }; } };
  function startSim(data, d1, d2, cb = {}) {
    stopSim(); const ag = makeAgents(data, cb.seed || 11);
    sim = { t: 0, speed: 1, ag: ag.map((a, i) => ({ ...a, p: people[SIMBASE + i], st: 'wait', g: a.mode === 2 ? d2 : a.gate0, path: null, lane: -1, slot: 0 })), G: [0, 1, 2].map(() => ({ q: [], lanes: Array(8).fill(0), maxQ: 0, served: 0 })), d1, d2, tOpen: d1 >= 0 ? waveT(d1) : 1e9, openDone: false, done: 0, waitSum: 0, waitN: 0, maxWait: 0, maxQ: 0, cb, ended: false, plat: [], tick: 0 };
    W.setExtraOpen(0, false); W.gates.forEach((g, i) => { g.bayMesh.visible = g.taxiSign.visible = i === d2; });
    sim.ag.forEach(a => { a.p.vis = false; });
    if (cb.you) { const y = sim.ag.find(a => a.mode === cb.you[0] && a.wave === cb.you[1] && a.gate0 === cb.you[2]) || sim.ag.find(a => a.wave === cb.you[1] && a.mode === cb.you[0]) || sim.ag.find(a => a.wave === cb.you[1]); if (y) y.you = true; sim.you = y; }
  }
  function stopSim() { youMark.visible = false; if (!sim) return; sim.ag.forEach(a => { a.p.vis = false; }); sim = null; }
  function walk(a, dt, tx, tz, v) { const p = a.p, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), st = v * dt; if (d <= st) { p.x = tx; p.z = tz; return true; } p.x += dx / d * st; p.z += dz / d * st; p.ang = Math.atan2(-dz, dx) + Math.PI / 2; return false; }
  const queueSlot = (gi, k) => { const col = k % 6, row = (k / 6) | 0; return [gateX(gi) + (col - 2.5) * 1.15 - 0, FENCE_Z - 4.5 - row * 1.05]; };
  const laneX = (gi, l) => l < 4 ? gateX(gi) - 6.6 + (l - 1.5) * 1.7 : gateX(gi) + 6.6 + (l - 5.5) * 1.7;
  function route(a) {
    const gi = a.g, lx = laneX(gi, a.lane), pts = [[lx, FENCE_Z + 3]];
    if (a.mode === 0) { const d = dests.car(gi); a.dest = d; pts.push([lx, 126], [d.px, 126], [d.px, d.pz]); }
    else if (a.mode === 1) { const s = pick([-4, 4, -2, 2]); pts.push([lx, 127], [s, 128], [s, 191], [rr(-38, 38), 196], [rr(-40, 40), 212.4 + (R() < .5 ? 0 : 0)]); a.plat = true; }
    else { const g = W.gates[gi]; const bay = g.bays[sim.bayI = ((sim.bayI || 0) + 1) % 6]; a.bay = bay; pts.push([bay[0], bay[1] - 1.4]); }
    a.path = pts; a.pi = 0;
  }
  function simStep(dt) {
    const S = sim; if (!S) return; S.t += dt; const t = S.t;
    if (!S.openDone && t >= S.tOpen) { S.openDone = true; W.setExtraOpen(0, true); S.cb.onOpen && S.cb.onOpen(); }
    for (const a of S.ag) {
      const p = a.p;
      if (a.st === 'wait' && t >= a.t) { a.st = 'toGate'; p.vis = true; p.y = .25; const door = pick(a.g === 1 ? DOORS.slice(0, 2) : a.g === 2 ? DOORS.slice(2) : DOORS); p.x = door + rr(-3, 3); p.z = 57.8 + rr(0, 3); a.apx = gateX(a.g) + rr(-5, 5); a.apz = 86 + rr(-2, 1); a.v = Math.hypot(a.apx - p.x, a.apz - p.z) / 4.6; a.tj = t + 4.6; }
      if (a.st === 'toGate') { walk(a, dt, a.apx, a.apz, a.v); if (t >= a.tj) { a.st = 'queue'; a.tq = t; S.G[a.g].q.push(a); } }
      else if (a.st === 'queue') { /* يتحرك نحو خانته في الطابور (يُحدّث بالأسفل) */ }
      else if (a.st === 'serve') { walk(a, dt, laneX(a.g, a.lane), FENCE_Z - 0.5, 14); if (t >= a.done) { a.st = 'go'; route(a); } }
      else if (a.st === 'go') {
        const [tx, tz] = a.path[a.pi]; if (walk(a, dt, tx, tz, a.mode === 1 ? 9 : 8)) { a.pi++; if (a.pi >= a.path.length) { a.st = a.mode === 1 ? 'plat' : 'fin'; a.tw = t; if (a.mode === 0) { departCar(a.dest.px, a.dest.pz); p.vis = false; S.done++; a.st = 'end'; } else if (a.mode === 2) { taxiLeave(a.bay[0], a.bay[1], 0.6); p.vis = false; S.done++; a.st = 'end'; } } }
      }
      else if (a.st === 'plat') { if (TR.some(k => k.dwell) && t - a.tw > a.rnd * 3) { a.st = 'board'; a.bz = a.p.z < 214 ? 210.9 : 217.1; a.bz = R() < .5 ? 210.6 : 217.4; } }
      else if (a.st === 'board') { if (walk(a, dt, p.x, a.bz, 6)) { a.st = 'end'; p.vis = false; S.done++; } }
    }
    /* الطوابير والمسارات */
    S.G.forEach((g, gi) => {
      const L = (gi === 0 && S.openDone) ? 8 : 4;
      for (let l = 0; l < L && g.q.length; l++) if (g.lanes[l] <= t) { const a = g.q.shift(); a.st = 'serve'; a.lane = l; a.done = t + P.SVC * (.85 + .3 * a.rnd); g.lanes[l] = a.done; g.served++; const w = t - a.tq; S.waitSum += w; S.waitN++; if (w > S.maxWait) S.maxWait = w; }
      g.q.forEach((a, k) => { const [sx, sz] = queueSlot(gi, k); walk(a, dt, sx, sz, 7); });
      if (g.q.length > g.maxQ) g.maxQ = g.q.length; if (g.q.length > S.maxQ) S.maxQ = g.q.length;
    });
    if (S.you) { const p = S.you.p; youMark.visible = p.vis; youMark.position.set(p.x, p.y, p.z); }
    if ((S.tick += dt) > .12) { S.tick = 0; S.cb.onTick && S.cb.onTick(simStats()); }
    if (!S.ended && S.ag.every(a => a.st === 'go' || a.st === 'end' || a.st === 'plat' || a.st === 'board') && t > waveT(4) + 3) { S.ended = true; S.cb.onTick = null; S.cb.onDone && S.cb.onDone(simStats()); }
    if (S.cb.autoTOD) setTOD(lerp(.08, 1, clamp(t / (waveT(4) + 14), 0, 1)));
  }
  function simStats() { const S = sim; return { t: S.t, clock: clockOf(S.t), q: S.G.map(g => g.q.length), maxQ: S.maxQ, perGate: S.G.map(g => g.maxQ), served: S.G.reduce((s, g) => s + g.served, 0), total: S.ag.length, avgWait: S.waitSum / Math.max(1, S.waitN), maxWait: S.maxWait, open: S.openDone, platform: S.ag.filter(a => a.st === 'plat').length }; }

  /* ---------- أعمدة الحرارة فوق البوابات ---------- */
  const heats = []; let selRing = null;
  function heat(vals, labels) {
    heats.forEach(h => { scene.remove(h); h.traverse(o => { o.geometry && o.geometry.dispose(); }); }); heats.length = 0; if (!vals) return;
    const mx = Math.max(...vals), hot = new Col('#ff5c3a'), cool = new Col('#52d6a2');
    vals.forEach((v, i) => { const f = v / mx, h = 6 + f * 34, g = new THREE.Group(); const c = new Col().copy(cool).lerp(hot, f * f);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, h, 28, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide })); m.position.y = h / 2; g.add(m);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .7, depthWrite: false })); cap.rotation.x = -Math.PI / 2; cap.position.y = h; g.add(cap);
      const s = labelSprite(`${labels ? labels[i] : ''} · ${v}`, { w: 512, h: 128, size: 66, scale: 15, border: '#' + c.getHexString() }); s.position.y = h + 4; s.material.depthTest = false; g.add(s);
      g.position.set(gateX(i), 0, 88); scene.add(g); heats.push(g); });
  }
  function setTaxiStand(i) {
    if (!selRing) { selRing = new THREE.Mesh(new THREE.RingGeometry(10, 11.6, 48), new THREE.MeshBasicMaterial({ color: 0xf2c230, transparent: true, opacity: .9, depthWrite: false })); selRing.rotation.x = -Math.PI / 2; selRing.position.y = .3; scene.add(selRing); }
    selRing.visible = i != null && i >= 0; if (selRing.visible) selRing.position.set(gateX(i), .3, 107.6);
    W.gates.forEach((g, k) => { g.bayMesh.visible = g.taxiSign.visible = k === i; });
  }
  function setExtraOpen(open) { W.setExtraOpen(0, open); }

  /* مشهد البطل (أسئلة المرحلة الأولى) */
  let hero = null, heroT = 0;
  function showHero(mode) {
    if (mode == null || mode < 0) { hero = null; return; }
    hero = mode; heroT = 0; trainClock = mode === 1 ? 36 : trainClock;
    camTo(mode === 0 ? 'car' : mode === 1 ? 'metro' : 'taxi', 2.2);
    if (mode === 2) setTaxiStand(0); else setTaxiStand(-1);
  }

  /* ---------- الحلقة ---------- */
  let last = performance.now(); const clock = { getDelta() { const n = performance.now(), d = (n - last) / 1000; last = n; return d; } }; let T = 0, running = true, raf = 0, slow = 0, frames = 0, pr = 1, shadowsOn = q.shadows;
  function resize() {
    const w = container.clientWidth || 1280, h = container.clientHeight || 720, rect = cv.getBoundingClientRect(), k = rect.width ? rect.width / w : 1;
    pr = clamp((window.devicePixelRatio || 1) * k, .55, q.maxPR); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  setTOD(.0);
  let heroSpawn = 0;
  function frame() {
    raf = requestAnimationFrame(frame); if (!running) return; const rdt = Math.min(clock.getDelta(), .15); T += rdt; frames++;
    const dt = rdt * (sim ? sim.speed : 1);
    if (camT) { camT.t += rdt / camT.dur; const f = ease(Math.min(1, camT.t)); for (const k of ['tx', 'ty', 'tz', 'pit', 'dist']) cam[k] = lerp(camT.from[k], camT.to[k], f); let dy = camT.to.yaw - camT.from.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); cam.yaw = camT.from.yaw + dy * f; if (camT.t >= 1) { Object.assign(goal, cam); camT = null; } }
    else if (auto) { cam.yaw += auto.rate * rdt; }
    applyCam();
    /* سيارات الطريق */
    ambS.forEach((c, i) => { c.s += c.dir * c.v * rdt; if (c.s > 380) c.s -= 760; if (c.s < -380) c.s += 760; setCar(amb, i, c.s, c.dir > 0 ? LANE_E : LANE_W, c.dir > 0 ? 0 : Math.PI); }); amb.instanceMatrix.needsUpdate = true;
    for (let r = dt; r > 0; r -= .05) stepMovers(Math.min(r, .05)); trainUpdate(rdt);
    if (hero === 2 && (heroSpawn -= rdt) < 0) { heroSpawn = 2.2; const bay = W.gates[0].bays[(Math.random() * 6) | 0]; const m = spawnMover('taxi', -150, LANE_E - 3.6, [[bay[0] + 6, 107.6], [bay[0], 107.6]], 12, 0); if (m) { m.onEnd = null; setTimeout(() => taxiLeave(bay[0], bay[1], 0), 3200); } }
    if (hero === 0 && (heroSpawn -= rdt) < 0) { heroSpawn = 1.7; departCar(rr(-140, -20), pick([137.4, 162.8])); }
    /* مشاة الديكور */
    walkers.forEach((p, i) => { const w = p.w; w.f = (w.f + w.v * rdt / 90) % 2; const f = w.f < 1 ? w.f : 2 - w.f; p.x = lerp(w.a[0], w.b[0], f); p.z = lerp(w.a[1], w.b[1], f); p.ang = (w.f < 1 ? 1 : -1) * Math.PI / 2 * (w.b[1] > w.a[1] ? 1 : 1); });
    if (sim) for (let r = dt; r > 0 && sim; r -= .05) simStep(Math.min(r, .05));
    for (let i = 0; i < NP; i++) { const p = people[i]; if (p.vis || i >= SIMBASE) putPerson(p, i, T, i >= 90 || (sim && i >= SIMBASE)); }
    bodyI.instanceMatrix.needsUpdate = headI.instanceMatrix.needsUpdate = true;
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    /* جودة متكيّفة */
    slow += rdt > .036 ? 1 : -.4; if (slow < 0) slow = 0;
    if (slow > 25) { slow = 0; if (pr > .75) { q.maxPR = Math.max(.7, pr - .2); resize(); } else if (shadowsOn) { shadowsOn = false; sun.castShadow = false; renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); } }
  }
  frame();
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  return {
    camTo, setTOD, heat, setTaxiStand, setExtraOpen, showHero, startSim, stopSim, simSpeed: v => { if (sim) sim.speed = v; },
    onPick: f => { onPick = f; }, onUser: f => { userCb = f; }, controls: v => { controls = v; }, autoOrbit: r => { auto = r ? { rate: r } : null; },
    getStats: () => (sim ? simStats() : null), dbg: () => { const h = {}; sim && sim.ag.forEach(a => { h[a.st] = (h[a.st] || 0) + 1; }); return h; }, renderer, scene, camera, stats: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, pr, frames, shadows: shadowsOn }),
    shot: () => { renderer.render(scene, camera); return cv.toDataURL('image/png'); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); cv.remove(); },
  };
}
window.Expo3D = { create, P, waveT, clockOf };
