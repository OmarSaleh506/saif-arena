import * as THREE from 'three';
export const TAU = Math.PI * 2;
export function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const R = mulberry(20261112);
export const rr = (a, b) => a + (b - a) * R();
export const pick = a => a[(R() * a.length) | 0];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = t => 1 - Math.pow(1 - t, 3);

export function ctex(w, h, draw, { rep = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function addNoise(ctx, w, h, amt) {
  const d = ctx.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const n = (Math.random() - .5) * amt; a[i] += n; a[i + 1] += n; a[i + 2] += n; }
  ctx.putImageData(d, 0, 0);
}
export function blotches(ctx, w, h, n, col, rmin, rmax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = rmin + Math.random() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', alpha)); g.addColorStop(1, col.replace('A', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
/* نسخة من الخامة بتكرار يناسب مساحة (w×d متر) وحجم بلاطة بالمتر */
export function tiled(tex, w, d, size) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / size, d / size); return t; }

/* لافتة نصية عربية على لوحة */
export const tr = s => (typeof window !== 'undefined' && window.SAIF_TR) ? window.SAIF_TR(s) : s;
export function labelTexture(text, { w = 512, h = 128, bg = 'rgba(8,26,25,.82)', fg = '#F4F2EA', size = 64, border = '#84B6C6', sub = '' } = {}) {
  text = tr(text); sub = tr(sub);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const r = h * .22;
  x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, r); x.fill();
  if (border) { x.lineWidth = 5; x.strokeStyle = border; x.stroke(); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = /[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
  let fs = size; x.font = `800 ${fs}px Tajawal, sans-serif`; while (x.measureText(text).width > w - 36 && fs > 18) { fs -= 3; x.font = `800 ${fs}px Tajawal, sans-serif`; } x.fillText(text, w / 2, sub ? h * .4 : h / 2 + 2);
  if (sub) { x.font = `600 ${size * .5}px Tajawal, sans-serif`; x.fillStyle = '#C7D3D1'; x.fillText(sub, w / 2, h * .74); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function labelSprite(text, opts = {}) {
  const o = Object.assign({ w: 512, h: 128, scale: 14 }, opts);
  const tex = labelTexture(text, o);
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(o.scale, o.scale * o.h / o.w, 1); return s;
}
export function labelPlane(text, w, h, opts = {}) {
  const tex = labelTexture(text, Object.assign({ w: 512, h: Math.round(512 * h / w) }, opts));
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, side: opts.double ? THREE.DoubleSide : THREE.FrontSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
export function box(w, h, d, mat, x, y, z, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive; return m;
}
export function colorGeo(geo, hex) {
  const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
}
