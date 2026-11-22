import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
export const BOX = new THREE.BoxGeometry(1, 1, 1);
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 18);
export const CYL6 = new THREE.CylinderGeometry(1, 1, 1, 6);
export const CYL10 = new THREE.CylinderGeometry(1, 1, 1, 10);
export const SPH = new THREE.SphereGeometry(1, 20, 14);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function approach(cur, target, rate, dt) { const d = target - cur; const s = rate * dt; return Math.abs(d) <= s ? target : cur + Math.sign(d) * s; }
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function seabedY(x, z) { return -90 - 1410 * ss(-900, 300, x) - 700 * ss(900, 1600, x) + 2.0 * Math.sin(x * 0.013 + 1) * Math.cos(z * 0.011); }

// ---------------------------------------------------------------- procedural textures
function canvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function tex(c, rx = 1, ry = 1, srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
let _seed = 7; const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647;
export const TEX = {};
TEX.noise = tex(canvas(256, 256, (g, w, h) => { const d = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 150 + rnd() * 70; d.data.set([v, v, v, 255], i * 4); } g.putImageData(d, 0, 0); g.globalAlpha = 0.15; for (let i = 0; i < 60; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#555'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 4 + rnd() * 24, 0, 7); g.fill(); } }), 1, 1, false);
TEX.checker = tex(canvas(128, 128, (g) => { g.fillStyle = '#5c636a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#7a8189'; g.lineWidth = 5; g.lineCap = 'round'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 32 + 16, cy = y * 32 + 16; g.save(); g.translate(cx, cy); g.rotate((x + y) % 2 ? 0.8 : -0.8); g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.stroke(); g.restore(); } }));
TEX.grating = tex(canvas(128, 128, (g) => { g.fillStyle = '#2b2f33'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#b8a14a'; for (let i = 0; i < 128; i += 16) { g.fillRect(i, 0, 4, 128); } for (let i = 0; i < 128; i += 32) g.fillRect(0, i, 128, 3); }));
TEX.hazard = tex(canvas(128, 32, (g) => { g.fillStyle = '#f1c40f'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#111'; for (let i = -32; i < 160; i += 32) { g.beginPath(); g.moveTo(i, 32); g.lineTo(i + 16, 32); g.lineTo(i + 32, 0); g.lineTo(i + 16, 0); g.fill(); } }));
TEX.windows = tex(canvas(128, 128, (g) => { g.fillStyle = '#eef1f3'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = '#2c3e50'; g.fillRect(x * 32 + 6, y * 32 + 10, 20, 12); g.fillStyle = 'rgba(160,200,230,.5)'; g.fillRect(x * 32 + 6, y * 32 + 10, 20, 4); } }));
TEX.drum = tex(canvas(64, 64, (g) => { g.fillStyle = '#333'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#777'; g.lineWidth = 3; for (let y = 2; y < 64; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 4); g.stroke(); } }));
TEX.rack = tex(canvas(32, 64, (g) => { g.fillStyle = '#c0661f'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#5a2c0b'; for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 32, 6); }));
TEX.screen = tex(canvas(128, 64, (g) => { g.fillStyle = '#071a2b'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#2ecc71'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 128; x++) g.lineTo(x, 32 + Math.sin(x * 0.2) * 10 + rnd() * 4); g.stroke(); g.fillStyle = '#3498db'; g.fillRect(6, 6, 40, 8); g.fillStyle = '#e67e22'; g.fillRect(80, 46, 40, 10); }));
export function stripeTexture(base = '#9aa3ad', band = '#3a3f45', vertical = '#d9dde2', bandFrac = 0.12) {
  return tex(canvas(64, 128, (g) => { g.fillStyle = base; g.fillRect(0, 0, 64, 128); g.fillStyle = vertical; g.fillRect(0, 0, 10, 128); g.fillStyle = band; g.fillRect(0, 0, 64, 128 * bandFrac); }));
}
export function textTexture(text, w = 512, h = 128, bg = '#1b2a41', fg = '#ffffff', font = 'bold 80px Arial') {
  return tex(canvas(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); }));
}

// ---------------------------------------------------------------- materials (cached)
const _mc = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (_mc.has(key)) return _mc.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3, roughnessMap: o.map ? null : TEX.noise, ...o });
  _mc.set(key, m); return m;
}
export const COL = {
  steel: 0x9aa3ad, dark: 0x30363c, white: 0xe9ecee, yellow: 0xf2c230, orange: 0xe8742a, red: 0xc0392b,
  blue: 0x2f6db5, navy: 0x1d2e4a, deck: 0x6f767d, green: 0x3f8f5a, rust: 0x8a5a3c, black: 0x1a1a1a,
};
export const MAT = {
  steel: () => M(COL.steel, { metalness: 0.7, roughness: 0.38 }),
  chrome: () => M(0xd5d9de, { metalness: 0.95, roughness: 0.15 }),
  dark: () => M(COL.dark, { metalness: 0.5, roughness: 0.5 }),
  rubber: () => M(0x151515, { metalness: 0, roughness: 0.9 }),
  glass: () => M(0x88aacc, { metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.35 }),
  checker: () => M(0xffffff, { map: TEX.checker, metalness: 0.6, roughness: 0.45 }),
  grating: () => M(0xffffff, { map: TEX.grating, metalness: 0.4, roughness: 0.6 }),
  hazard: () => M(0xffffff, { map: TEX.hazard, roughness: 0.6, metalness: 0.1 }),
  windows: () => M(0xffffff, { map: TEX.windows, roughness: 0.4, metalness: 0.1 }),
  lightOn: () => M(0xfff5d6, { emissive: 0xfff2c0, emissiveIntensity: 1.6 }),
  redLight: () => M(0xff3030, { emissive: 0xff2020, emissiveIntensity: 2 }),
  screen: () => M(0xffffff, { map: TEX.screen, emissive: 0xffffff, emissiveMap: TEX.screen, emissiveIntensity: 0.9 }),
};

// ---------------------------------------------------------------- primitives
export function tag(obj, key) { obj.userData.part = key; return obj; }
export function grp(key, ...children) { const g = new THREE.Group(); if (key) tag(g, key); for (const c of children) g.add(c); return g; }
export function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(BOX, mat); m.scale.set(w, h, d); m.position.set(x, y, z); return m; }
// box with UVs in metres (for tiled textures)
export function boxUV(w, h, d, mat, x = 0, y = 0, z = 0, s = 0.5) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
}
const _rb = new Map();
export function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0) {
  const k = [w, h, d, r].join(); if (!_rb.has(k)) _rb.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)));
  const m = new THREE.Mesh(_rb.get(k), mat); m.position.set(x, y, z); return m;
}
export function cyl(r, h, mat, x = 0, y = 0, z = 0, geo = CYL) { const m = new THREE.Mesh(geo, mat); m.scale.set(r, h, r); m.position.set(x, y, z); return m; }
export function hcyl(r, len, mat, x, y, z, axis = 'x') { const m = cyl(r, len, mat, x, y, z); if (axis === 'x') m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; return m; }
export function sph(r, mat, x = 0, y = 0, z = 0, sy = 1) { const m = new THREE.Mesh(SPH, mat); m.scale.set(r, r * sy, r); m.position.set(x, y, z); return m; }
export function cone(r1, r2, h, mat, x = 0, y = 0, z = 0, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); return m; }
export function strutMesh(a, b, r, mat, geo = CYL) {
  const dir = V3().subVectors(b, a); const len = dir.length();
  const m = new THREE.Mesh(geo, mat); m.scale.set(r, len, r); m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize()); return m;
}
// profile: [[radius, y], ...] bottom to top
export function lathe(profile, mat, seg = 32, x = 0, y = 0, z = 0, phiStart = 0, phiLen = Math.PI * 2) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg, phiStart, phiLen), mat);
  if (phiLen < Math.PI * 2) m.material = m.material; 
  m.position.set(x, y, z); return m;
}
export function torus(r, t, mat, x = 0, y = 0, z = 0, arc = Math.PI * 2, seg = 24) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg, arc), mat); m.position.set(x, y, z); return m; }
// bolted flange ring (horizontal), centred at y
export function flange(r, t, n, mat, y = 0, boltMat) {
  const g = new THREE.Group();
  g.add(lathe([[r * 0.55, -t / 2], [r, -t / 2], [r, t / 2], [r * 0.55, t / 2]], mat, 28, 0, y, 0));
  const bm = boltMat || MAT.dark();
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.add(cyl(r * 0.05, t * 1.6, bm, Math.cos(a) * r * 0.82, y, Math.sin(a) * r * 0.82, CYL6)); }
  return g;
}
// gate valve with handwheel; axis = flow axis ('x'|'z')
export function valve(x, y, z, s = 1, axis = 'x', bodyMat = M(COL.red), wheel = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (axis === 'z') g.rotation.y = Math.PI / 2;
  g.add(rbox(0.5 * s, 0.5 * s, 0.4 * s, 0.06 * s, bodyMat));
  g.add(hcyl(0.17 * s, 0.9 * s, bodyMat, 0, 0, 0)); for (const sx of [-1, 1]) g.add(hcyl(0.25 * s, 0.06 * s, bodyMat, sx * 0.45 * s, 0, 0));
  g.add(cyl(0.05 * s, 0.6 * s, MAT.steel(), 0, 0.5 * s, 0));
  if (wheel) { const w = torus(0.22 * s, 0.025 * s, MAT.dark(), 0, 0.8 * s, 0); w.rotation.x = Math.PI / 2; g.add(w); }
  else g.add(cyl(0.2 * s, 0.5 * s, bodyMat, 0, 0.55 * s, 0)); // actuator
  return g;
}
// pipe run through points with small-radius bends
export function pipeRun(pts, r, mat, seg = 6) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.02);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 10), r, seg, false), mat);
}

// Collects many struts into one merged mesh
export class Lattice {
  constructor() { this.geos = []; }
  add(a, b, r, geo = CYL6) {
    const dir = V3().subVectors(b, a); const len = dir.length(); if (len < 1e-4) return;
    const g = geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(V3().copy(a).addScaledVector(dir, 0.5), new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()), V3(r, len, r)));
    this.geos.push(g);
  }
  addBox(w, h, d, x, y, z) { const g = BOX.clone(); g.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeScale(w, h, d))); this.geos.push(g); }
  build(mat) { const g = mergeGeometries(this.geos.map(x => x.index ? x.toNonIndexed() : x)); this.geos.forEach(x => x.dispose()); return new THREE.Mesh(g, mat); }
}

// handrail along a polyline (y = deck level)
export function railing(pts, h = 1.1, mat = M(COL.yellow, { metalness: 0.4 })) {
  const L = new Lattice();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]; const len = a.distanceTo(b); const n = Math.max(1, Math.round(len / 1.6));
    L.add(V3(a.x, a.y + h, a.z), V3(b.x, b.y + h, b.z), 0.03); L.add(V3(a.x, a.y + h * 0.5, a.z), V3(b.x, b.y + h * 0.5, b.z), 0.025);
    for (let k = 0; k <= n; k++) { const p = V3().lerpVectors(a, b, k / n); L.add(p, V3(p.x, p.y + h, p.z), 0.03); }
  }
  return L.build(mat);
}
export function rectRail(x0, z0, x1, z1, y, h, skip) {
  const pts = [V3(x0, y, z0), V3(x1, y, z0), V3(x1, y, z1), V3(x0, y, z1), V3(x0, y, z0)];
  return railing(pts, h);
}
export function stairs(from, to, w = 1.0, mat = M(COL.yellow, { metalness: 0.4 })) {
  const L = new Lattice(); const d = V3().subVectors(to, from); const n = Math.max(2, Math.round(Math.abs(d.y) / 0.22));
  const side = V3(-d.z, 0, d.x).normalize().multiplyScalar(w / 2);
  for (const s of [-1, 1]) { L.add(V3().copy(from).addScaledVector(side, s), V3().copy(to).addScaledVector(side, s), 0.06); L.add(V3().copy(from).addScaledVector(side, s).setY(from.y + 1), V3().copy(to).addScaledVector(side, s).setY(to.y + 1), 0.03); }
  for (let i = 1; i < n; i++) { const p = V3().lerpVectors(from, to, i / n); L.add(V3().copy(p).sub(side), V3().copy(p).add(side), 0.08, BOX); }
  return L.build(mat);
}
export function ladder(x, y, z, h, cage = true, face = 'z', mat = M(COL.yellow, { metalness: 0.4 })) {
  const L = new Lattice(); const ox = face === 'z' ? 0.25 : 0, oz = face === 'z' ? 0 : 0.25;
  L.add(V3(x - ox, y, z - oz), V3(x - ox, y + h, z - oz), 0.03); L.add(V3(x + ox, y, z + oz), V3(x + ox, y + h, z + oz), 0.03);
  for (let k = 0.3; k < h; k += 0.3) L.add(V3(x - ox, y + k, z - oz), V3(x + ox, y + k, z + oz), 0.015);
  if (cage) for (let k = 2.2; k < h; k += 0.9) { const c = new THREE.TorusGeometry(0.4, 0.02, 4, 12, Math.PI); c.rotateX(Math.PI / 2); c.rotateY(face === 'z' ? 0 : Math.PI / 2); c.translate(x, y + k, z); L.geos.push(c); }
  return L.build(mat);
}

// ---------------------------------------------------------------- baking (merge static meshes per part)
function nearestPart(o, stop) { let a = o.parent; while (a && a !== stop) { if (a.userData.part) return a; a = a.parent; } return a && a.userData.part ? a : null; }
export function bakeParts(root) {
  root.updateMatrixWorld(true);
  const parts = []; root.traverse(o => { if (o.userData.part && !o.isMesh && !o.isInstancedMesh) parts.push(o); });
  for (const part of parts) {
    const buckets = new Map(); const rm = [];
    const inv = new THREE.Matrix4().copy(part.matrixWorld).invert();
    part.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o === part) return;
      if (o.userData.part) return; // separately tagged
      let a = o.parent, ok = true; while (a && a !== part) { if (a.userData.part || a.userData.dynamic) { ok = false; break; } a = a.parent; }
      if (!ok || o.userData.dynamic || o.userData.keep) return;
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      g.clearGroups();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      const k = o.material.uuid; if (!buckets.has(k)) buckets.set(k, { mat: o.material, geos: [] }); buckets.get(k).geos.push(g); rm.push(o);
    });
    if (rm.length < 2) continue;
    for (const o of rm) o.parent.remove(o);
    for (const { mat, geos } of buckets.values()) { const mg = mergeGeometries(geos); geos.forEach(x => x.dispose()); if (mg) part.add(new THREE.Mesh(mg, mat)); }
  }
}

// ---------------------------------------------------------------- labels
export function makeLabel(text, height = 3, opts = {}) {
  const fs = 64, pad = 22;
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  ctx.font = `600 ${fs}px system-ui, Segoe UI, Arial`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  c.width = w; c.height = fs + pad * 1.4;
  ctx.font = `600 ${fs}px system-ui, Segoe UI, Arial`;
  ctx.fillStyle = opts.bg || 'rgba(12,22,34,0.78)';
  ctx.beginPath(); ctx.roundRect(0, 0, c.width, c.height, 18); ctx.fill();
  ctx.strokeStyle = opts.border || 'rgba(255,200,60,0.9)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = opts.color || '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(text, pad, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: t, depthTest: !opts.always, transparent: true, fog: false });
  if (opts.screen) mat.sizeAttenuation = false;
  const s = new THREE.Sprite(mat); s.scale.set(height * c.width / c.height, height, 1);
  s.center.set(0.5, 0); s.raycast = () => {}; s.renderOrder = opts.always ? 999 : 10;
  s.userData.isLabel = true; s.userData.always = !!opts.always;
  return s;
}
export function lbl(parent, text, x, y, z, h = 3, opts) { const l = makeLabel(text, h, opts); l.position.set(x, y, z); parent.add(l); return l; }
