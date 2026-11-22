// Detailed deck equipment models (procedural)
import * as THREE from 'three';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, flange, valve, pipeRun, strutMesh, Lattice, railing, rectRail, stairs, ladder, lbl, CYL6, CYL10, textTexture } from './lib.js';

const place = (g, x, y, z, rot = 0) => { g.position.set(x, y, z); g.rotation.y = rot; return g; };
const BLUE = () => M(0x1f5f99, { metalness: 0.4, roughness: 0.5 });
const GREEN = () => M(0x3c8d5a, { metalness: 0.35 });
const YEL = () => M(COL.yellow, { metalness: 0.35 });

// ------------------------------------------------------------------ MUD PUMP (triplex)
export function mudPump(x, y, z, rot = 0) {
  const g = grp('mudpump'), B = BLUE(), S = MAT.steel(), D = MAT.dark();
  g.add(box(6.6, 0.3, 3.0, D, 0, 0.15, 0));
  g.add(rbox(3.2, 2.2, 2.6, 0.3, B, -0.8, 1.4, 0));
  g.add(hcyl(1.05, 2.62, B, -1.3, 1.7, 0, 'z'));
  g.add(box(0.7, 0.9, 2.5, MAT.grating(), 0.95, 1.1, 0));
  for (let i = -1; i <= 1; i++) {
    g.add(rbox(1.2, 1.05, 0.72, 0.08, S, 1.9, 1.0, i * 0.85));
    g.add(hcyl(0.28, 0.25, D, 2.6, 1.05, i * 0.85)); g.add(cyl(0.26, 0.22, D, 1.9, 1.62, i * 0.85));
    for (let b = 0; b < 4; b++) { const a = b / 4 * Math.PI * 2 + 0.78; g.add(hcyl(0.04, 0.3, D, 2.65, 1.05 + Math.cos(a) * 0.2, i * 0.85 + Math.sin(a) * 0.2)); }
  }
  g.add(hcyl(0.26, 3.0, S, 1.9, 0.42, 0, 'z'));
  g.add(cyl(0.1, 1.1, S, 2.7, 1.95, 1.2)); g.add(sph(0.45, M(0xc0392b), 2.7, 2.7, 1.2, 0.85)); g.add(cyl(0.12, 0.35, D, 2.7, 3.15, 1.2));
  g.add(pipeRun([V3(2.6, 1.6, 0.85), V3(2.7, 1.9, 1.2)], 0.1, S));
  g.add(pipeRun([V3(2.7, 2.1, 1.2), V3(3.3, 2.1, 1.2), V3(3.3, 2.1, -1.4), V3(3.3, 3.5, -1.4)], 0.12, S));
  for (const sz of [-0.68, 0.68]) { g.add(hcyl(0.55, 1.7, M(0x7f8c8d, { metalness: 0.5 }), -1.0, 3.05, sz)); g.add(hcyl(0.5, 0.3, D, 0.0, 3.05, sz)); for (let f = 0; f < 6; f++) g.add(hcyl(0.58, 0.05, D, -1.7 + f * 0.25, 3.05, sz)); }
  g.add(box(0.35, 1.9, 2.6, YEL(), -2.6, 2.4, 0));
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ SHALE SHAKER
export function shaker(x, y, z, rot = 0) {
  const g = grp('shaker'), G = GREEN(), D = MAT.dark(), S = MAT.steel();
  const L = new Lattice(); for (const [a, b] of [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]]) L.add(V3(a, 0, b), V3(a, 0.9, b), 0.07);
  L.addBox(3.2, 0.1, 0.1, 0, 0.9, -0.9); L.addBox(3.2, 0.1, 0.1, 0, 0.9, 0.9); g.add(L.build(D));
  const basket = new THREE.Group(); basket.position.y = 1.35; basket.rotation.z = 0.06; g.add(basket);
  basket.add(box(3.0, 0.9, 0.1, G, 0, 0, -0.9)); basket.add(box(3.0, 0.9, 0.1, G, 0, 0, 0.9)); basket.add(box(0.1, 0.9, 1.8, G, -1.5, 0, 0));
  for (let i = 0; i < 3; i++) basket.add(box(0.95, 0.04, 1.7, MAT.grating(), -0.95 + i * 0.97, -0.05 + i * 0.05, 0));
  for (const sz of [-1.05, 1.05]) { basket.add(hcyl(0.24, 0.5, D, 0.3, 0.55, sz, 'z')); basket.add(box(0.7, 0.12, 0.2, D, 0.3, 0.3, sz * 0.97)); }
  for (const sx of [-1.2, 1.2]) for (const sz of [-0.9, 0.9]) g.add(cyl(0.12, 0.25, MAT.rubber(), sx, 0.98, sz));
  g.add(box(0.9, 1.3, 1.8, S, -2.0, 1.6, 0)); g.add(cyl(0.18, 1.2, S, -2.0, 2.8, 0));
  const chute = box(0.9, 0.08, 1.6, S, 2.0, 0.9, 0); chute.rotation.z = -0.5; g.add(chute);
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ MUD CLEANER (desander / desilter)
export function mudCleaner(x, y, z, rot = 0) {
  const g = grp('mudcleaner'), S = MAT.steel(), D = MAT.dark();
  g.add(boxUV(3.4, 1.4, 2.0, M(0x7d6608), 0, 0.7, 0));
  g.add(hcyl(0.18, 3.0, S, 0, 3.1, 0.55));
  for (const sx of [-1.1, -0.3]) { g.add(cone(0.32, 0.06, 1.3, S, sx, 2.2, 0.55)); g.add(cyl(0.32, 0.25, S, sx, 2.95, 0.55)); g.add(pipeRun([V3(sx, 3.05, 0.55), V3(sx, 3.1, 0.55)], 0.08, S)); }
  for (let i = 0; i < 8; i++) { const sx = 0.3 + (i % 4) * 0.35, sz = i < 4 ? -0.35 : 0.15; g.add(cone(0.1, 0.03, 0.7, S, sx, 2.3, sz)); g.add(cyl(0.1, 0.12, D, sx, 2.7, sz)); }
  g.add(hcyl(0.12, 1.6, S, 0.8, 2.85, -0.1));
  g.add(cyl(0.15, 1.6, S, -1.5, 2.2, 0.55));
  g.add(box(3.2, 0.06, 1.6, MAT.grating(), 0, 1.5, -0.1));
  return place(g, x, y, z, rot);
}

export function centrifuge(x, y, z, rot = 0) {
  const g = grp('centrifuge'), S = MAT.steel();
  g.add(box(4.0, 0.3, 1.4, MAT.dark(), 0, 0.15, 0));
  const bowl = lathe([[0.1, -1.6], [0.25, -1.5], [0.5, -0.6], [0.55, 0.9], [0.45, 1.4], [0.1, 1.5]], M(0xbdc3c7, { metalness: 0.7, roughness: 0.3 }), 24, 0, 1.1, 0);
  bowl.rotation.z = Math.PI / 2; g.add(bowl);
  g.add(rbox(1.0, 0.9, 0.9, 0.1, BLUE(), 1.6, 0.9, 0)); g.add(rbox(0.6, 0.7, 0.8, 0.08, MAT.dark(), -1.65, 0.85, 0));
  g.add(cone(0.3, 0.2, 0.4, S, -0.8, 0.5, 0));
  return place(g, x, y, z, rot);
}

export function degasser(x, y, z, rot = 0) {
  const g = grp('degasser'), S = M(0x95a5a6, { metalness: 0.6 });
  const v = lathe([[0, -1.6], [0.45, -1.5], [0.6, -1.25], [0.6, 1.25], [0.45, 1.5], [0, 1.6]], S, 24, 0, 1.2, 0); v.rotation.z = Math.PI / 2; g.add(v);
  for (const sx of [-1, 1]) g.add(box(0.2, 0.7, 1.0, MAT.dark(), sx, 0.35, 0));
  g.add(rbox(0.9, 0.7, 0.7, 0.08, BLUE(), 0.4, 2.2, 0)); g.add(cyl(0.1, 2.2, S, -1.2, 2.3, 0));
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ MUD PITS with agitators
export function mudPits(x, y, z, n = 4, rot = 0) {
  const g = grp('mudpit'), T = M(0x8e7b26, { metalness: 0.3 }), D = MAT.dark();
  const w = 4.2;
  for (let i = 0; i < n; i++) {
    g.add(boxUV(w, 2.6, 5, T, i * (w + 0.1), 1.3, 0));
    g.add(boxUV(w - 0.2, 0.05, 4.8, MAT.grating(), i * (w + 0.1), 2.63, 0));
    g.add(rbox(0.6, 0.5, 0.6, 0.06, BLUE(), i * (w + 0.1), 2.95, 0.9)); g.add(rbox(0.5, 0.6, 0.5, 0.06, MAT.dark(), i * (w + 0.1), 3.4, 0.9));
    g.add(cyl(0.1, 0.8, D, i * (w + 0.1) - 1.3, 2.9, -1.6)); g.add(cyl(0.15, 0.08, M(COL.red), i * (w + 0.1) - 1.3, 3.3, -1.6));
  }
  const len = n * (w + 0.1) - 0.1;
  g.add(railing([V3(-w / 2, 2.65, 2.5), V3(len - w / 2, 2.65, 2.5)])); g.add(railing([V3(-w / 2, 2.65, -2.5), V3(len - w / 2, 2.65, -2.5)]));
  g.add(hcyl(0.15, len, MAT.steel(), len / 2 - w / 2, 2.2, 2.65));
  return place(g, x, y, z, rot);
}
export function hopper(x, y, z, rot = 0) {
  const g = grp('hopper'), S = MAT.steel();
  g.add(cone(0.8, 0.12, 1.1, S, 0, 1.6, 0)); g.add(box(1.8, 0.05, 1.8, S, 0, 2.17, 0));
  for (const [a, b] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.add(cyl(0.05, 1.6, MAT.dark(), a, 0.8, b));
  g.add(hcyl(0.14, 2.2, S, 0.3, 0.9, 0)); g.add(cyl(0.12, 0.2, S, 0, 1.0, 0));
  g.add(box(1.2, 0.9, 1.0, M(0xd5c4a1, { metalness: 0 }), 1.8, 0.45, 0.6));
  return place(g, x, y, z, rot);
}
export function bulkSilos(x, y, z, n = 3, rot = 0) {
  const g = grp('bulksilo'), W = M(0xdfe4e8, { metalness: 0.35 });
  for (let i = 0; i < n; i++) {
    const sx = i * 3.6;
    g.add(lathe([[0.15, 0], [0.3, 0.1], [1.5, 1.6], [1.5, 6.5], [1.2, 7.1], [0.2, 7.3]], W, 24, sx, 1.2, 0));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.78; g.add(cyl(0.1, 3.0, MAT.dark(), sx + Math.cos(a) * 1.3, 1.5, Math.sin(a) * 1.3)); }
    g.add(pipeRun([V3(sx, 8.5, 0), V3(sx, 9.0, 0), V3(sx + 1.8, 9.0, 0)], 0.1, MAT.steel()));
  }
  g.add(ladder(-1.6, 0, 0, 8.6, true, 'x'));
  return place(g, x, y, z, rot);
}
export function tripTank(x, y, z) {
  const g = grp('triptank'), S = M(0x7f8c8d, { metalness: 0.5 });
  g.add(cyl(0.9, 5, S, 0, 2.5, 0)); g.add(cyl(0.95, 0.1, MAT.dark(), 0, 5.0, 0));
  g.add(box(0.08, 4.4, 0.08, M(0xffffff, { emissive: 0x3399ff, emissiveIntensity: 0.4 }), 0.95, 2.5, 0));
  g.add(rbox(0.6, 0.5, 0.5, 0.05, BLUE(), 1.3, 0.25, 0.4));
  return place(g, x, y, z);
}

// Complete circulating-system module (pits, pumps, shakers, cleaners)
export function mudModule(x, y, z, rot = 0, { pumps = 3, shakers = 3 } = {}) {
  const g = new THREE.Group(); place(g, x, y, z, rot);
  for (let i = 0; i < pumps; i++) g.add(mudPump(0, 0, i * 3.6));
  g.add(mudPits(6.5, 0, 3.5, 4));
  for (let i = 0; i < shakers; i++) g.add(shaker(8 + i * 3.6, 2.7, -1.6, Math.PI / 2));
  g.add(mudCleaner(21.5, 0, 1.0)); g.add(centrifuge(21.5, 0, 5.5)); g.add(degasser(21.5, 0, -2.5));
  g.add(hopper(3.5, 0, -2.6)); g.add(tripTank(-2.8, 0, -2.0));
  return g;
}

// ------------------------------------------------------------------ WELL-CONTROL EQUIPMENT ON DECK
export function chokeManifold(x, y, z, rot = 0) {
  const g = grp('chokemanifold'), S = MAT.steel(), R = M(COL.red, { metalness: 0.4 });
  g.add(boxUV(7, 0.25, 3.2, MAT.checker(), 0, 0.12, 0));
  g.add(hcyl(0.16, 6.2, S, 0, 1.0, -0.8)); g.add(hcyl(0.16, 6.2, S, 0, 1.0, 0.8)); g.add(hcyl(0.2, 6.2, S, 0, 2.0, 0));
  for (let i = -2; i <= 2; i++) { g.add(valve(i * 1.3, 1.0, -0.8, 0.9, 'x', R)); g.add(valve(i * 1.3, 1.0, 0.8, 0.9, 'x', R)); g.add(cyl(0.13, 1.0, S, i * 1.3, 1.5, 0)); }
  for (const sx of [-2.6, 2.6]) { const c = new THREE.Group(); c.position.set(sx, 2.0, 0); c.add(rbox(0.6, 0.6, 0.6, 0.08, M(0x2c3e50))); c.add(cyl(0.22, 0.7, YEL(), 0, 0.6, 0)); g.add(c); }
  for (let i = 0; i < 3; i++) g.add(cyl(0.12, 0.08, M(0xffffff), -1 + i, 2.35, 0.2));
  return place(g, x, y, z, rot);
}
export function accumulatorUnit(x, y, z, rot = 0) {
  const g = grp('accumulatorunit'), R = M(0xc0392b, { metalness: 0.4 });
  g.add(box(6, 0.3, 2.6, MAT.dark(), 0, 0.15, 0)); g.add(rbox(2.0, 1.2, 2.2, 0.1, M(0x7f8c8d), -1.8, 0.9, 0));
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) g.add(lathe([[0, 0], [0.18, 0.05], [0.2, 0.2], [0.2, 1.5], [0.12, 1.7], [0.05, 1.8]], R, 14, -0.4 + i * 0.45, 0.3, -0.6 + r * 0.5));
  g.add(hcyl(0.07, 3.6, MAT.steel(), 1.15, 2.3, -0.35));
  g.add(rbox(1.8, 0.9, 0.5, 0.05, M(0xecf0f1), 1.1, 1.1, 1.0));
  for (let i = 0; i < 6; i++) { g.add(box(0.12, 0.25, 0.12, MAT.dark(), 0.4 + i * 0.28, 1.5, 1.28)); g.add(cyl(0.02, 0.35, MAT.steel(), 0.4 + i * 0.28, 1.75, 1.32)); }
  g.add(rbox(1.0, 0.7, 0.8, 0.08, BLUE(), -1.8, 1.85, 0));
  return place(g, x, y, z, rot);
}
export function mgs(x, y, z) {
  const g = grp('mgs'), S = M(0xbdc3c7, { metalness: 0.6, roughness: 0.35 });
  g.add(lathe([[0, 0], [0.5, 0.15], [0.7, 0.6], [0.7, 6.0], [0.5, 6.5], [0, 6.7]], S, 24, 0, 0.8, 0));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.add(cyl(0.08, 1.0, MAT.dark(), Math.cos(a) * 0.6, 0.5, Math.sin(a) * 0.6)); }
  g.add(pipeRun([V3(0, 7.4, 0), V3(0, 9, 0), V3(-0.5, 10, 0), V3(-0.5, 30, 0)], 0.15, S));
  g.add(pipeRun([V3(0.7, 4.5, 0), V3(1.6, 4.5, 0), V3(1.6, 1.0, 0)], 0.12, S));
  g.add(pipeRun([V3(-0.7, 1.5, 0), V3(-2.0, 1.2, 0)], 0.15, S));
  g.add(ladder(0, 0, 0.8, 7.2, true, 'z'));
  return place(g, x, y, z);
}
export function cementUnit(x, y, z, rot = 0) {
  const g = grp('cementunit'), B = M(0x8e44ad, { metalness: 0.3 }), S = MAT.steel();
  g.add(box(7.5, 0.3, 2.8, MAT.dark(), 0, 0.15, 0));
  for (const sx of [-2.4, 0]) { g.add(rbox(1.8, 1.4, 1.2, 0.15, B, sx, 1.0, -0.6)); for (let i = -1; i <= 1; i++) g.add(hcyl(0.18, 0.4, S, sx + 1.1, 0.9, -0.6 + i * 0.35)); }
  g.add(boxUV(2.2, 1.6, 1.2, M(0xbdc3c7), -1.2, 1.1, 0.75)); g.add(boxUV(2.2, 1.6, 1.2, M(0xbdc3c7), 1.1, 1.1, 0.75));
  g.add(rbox(1.6, 2.2, 2.4, 0.12, M(0xecf0f1), 2.9, 1.4, 0)); g.add(box(0.05, 0.8, 1.6, MAT.glass(), 2.08, 1.9, 0));
  g.add(cone(0.6, 0.2, 0.9, S, 0.9, 2.2, -0.6));
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ POWER
export function engineRoom(x, y, z, w = 16, d = 9, rot = 0) {
  const g = grp('engineroom');
  g.add(boxUV(w, 6, d, M(0xd6dbdf, { metalness: 0.3 }), 0, 3, 0, 0.6));
  for (let i = 0; i < 4; i++) { const sx = -w / 2 + 2 + i * (w - 4) / 3; g.add(rbox(1.6, 1.0, 2.4, 0.1, M(0x7f8c8d), sx, 6.5, -d / 4)); g.add(lathe([[0.42, 0], [0.42, 4.2], [0.5, 4.4], [0.5, 4.8]], M(0x5d6d7e, { metalness: 0.6 }), 16, sx, 6, d / 4)); g.add(cyl(0.3, 0.05, MAT.black ? M(0x111111) : MAT.dark(), sx, 10.8, d / 4)); }
  for (let i = 0; i < 6; i++) g.add(box(1.2, 1.4, 0.05, MAT.grating(), -w / 2 + 1.5 + i * (w - 3) / 5, 2.5, d / 2 + 0.03));
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ CRANE
export function crane(x, y, z, yaw = 0, boom = 40, elev = 0.5) {
  const g = grp('crane'), Y = YEL(), D = MAT.dark();
  g.add(lathe([[1.6, 0], [1.5, 0.4], [1.3, 0.6], [1.3, 9.2], [1.7, 9.4], [1.7, 10]], Y, 24));
  const head = new THREE.Group(); head.position.y = 10; head.rotation.y = yaw; g.add(head);
  head.add(cyl(1.8, 0.5, D, 0, 0.25, 0));
  head.add(rbox(5.5, 2.8, 3.2, 0.2, Y, -1.2, 2.0, 0));
  head.add(rbox(2.0, 2.2, 1.6, 0.2, M(0xecf0f1), 1.6, 1.7, 1.8)); head.add(box(0.05, 1.2, 1.3, MAT.glass(), 2.62, 2.0, 1.8));
  const AF = new Lattice(); AF.add(V3(-3, 3.4, -1.2), V3(-1, 7.5, 0), 0.15); AF.add(V3(-3, 3.4, 1.2), V3(-1, 7.5, 0), 0.15); AF.add(V3(0.6, 3.4, 0), V3(-1, 7.5, 0), 0.15); head.add(AF.build(Y));
  const cosE = Math.cos(elev), sinE = Math.sin(elev); const tip = V3(1.5 + boom * cosE, 1.2 + boom * sinE, 0);
  const B = new Lattice(); const p0 = V3(1.5, 1.2, 0);
  const at = (t, oy, oz) => { const w = 1.0 * (1 - t * 0.6); return V3(p0.x + (tip.x - p0.x) * t - sinE * oy * w, p0.y + (tip.y - p0.y) * t + cosE * oy * w, oz * w); };
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [oy, oz] of C) B.add(at(0, oy, oz), at(1, oy, oz), 0.1);
  const n = Math.round(boom / 2.5);
  for (let i = 0; i <= n; i++) { const t = i / n; for (let k = 0; k < 4; k++) { const a = C[k], b = C[(k + 1) % 4]; B.add(at(t, ...a), at(t, ...b), 0.04); if (i < n) B.add(at(t, ...a), at((i + 1) / n, ...b), 0.035); } }
  head.add(B.build(Y));
  head.add(hcyl(0.5, 0.3, D, tip.x, tip.y, 0, 'z'));
  head.add(strutMesh(V3(-1, 7.5, 0), tip, 0.03, D));
  const hy = Math.max(2, tip.y - 18);
  head.add(strutMesh(tip, V3(tip.x, hy, 0), 0.03, D));
  head.add(rbox(0.6, 0.9, 0.4, 0.1, M(COL.orange), tip.x, hy - 0.4, 0)); head.add(torus(0.25, 0.07, D, tip.x, hy - 1.1, 0, Math.PI * 1.5));
  return place(g, x, y, z);
}

export function knuckleCrane(x, y, z, yaw = 0) {
  const g = grp('knucklecrane'), Y = M(COL.orange, { metalness: 0.4 }), D = MAT.dark();
  g.add(cyl(1.1, 6, Y, 0, 3, 0)); const h = new THREE.Group(); h.position.y = 6; h.rotation.y = yaw; g.add(h);
  h.add(rbox(2.4, 1.6, 2.2, 0.2, Y, 0, 0.8, 0));
  const a1 = rbox(9, 0.9, 0.9, 0.2, Y, 4, 3.5, 0); a1.rotation.z = 0.6; h.add(a1);
  const a2 = rbox(8, 0.7, 0.7, 0.2, Y, 10.5, 4.2, 0); a2.rotation.z = -0.5; h.add(a2);
  h.add(hcyl(0.25, 2.5, D, 3, 2.0, 0)); h.add(rbox(0.8, 1.2, 1.4, 0.1, D, 13.8, 2.0, 0));
  return place(g, x, y, z);
}

// ------------------------------------------------------------------ LIFE SAVING
export function lifeboat(x, y, z, rot = 0) {
  const g = grp('lifeboat'), O = M(0xf06a1a, { metalness: 0.1, roughness: 0.5 }), W = M(0xf4f4f4, { metalness: 0.1 });
  const hull = lathe([[0, -3.6], [0.7, -3.2], [1.3, -2.2], [1.45, 0], [1.3, 2.4], [0.8, 3.4], [0, 3.8]], O, 20, 0, 0, 0); hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, 0.75); g.add(hull);
  g.add(rbox(4.8, 1.0, 1.8, 0.45, W, 0, 0.75, 0)); g.add(rbox(1.2, 0.8, 1.0, 0.2, O, 0.5, 1.5, 0));
  for (let i = 0; i < 5; i++) g.add(box(0.35, 0.2, 1.82, M(0x2c3e50), -1.8 + i * 0.8, 0.95, 0));
  const D = MAT.steel();
  for (const sx of [-2.2, 2.2]) { g.add(strutMesh(V3(sx, -1.5, -2.3), V3(sx, 2.6, -1.4), 0.12, D)); g.add(strutMesh(V3(sx, 2.6, -1.4), V3(sx, 2.6, 0), 0.1, D)); g.add(cyl(0.02, 1.4, M(0x111111), sx, 1.9, 0)); }
  return place(g, x, y, z, rot);
}
export function liferafts(x, y, z, n = 4, rot = 0) {
  const g = grp('liferaft'), W = M(0xf4f6f7, { metalness: 0.2 });
  g.add(box(n * 1.0, 0.2, 1.2, MAT.dark(), (n - 1) * 0.5, 0.2, 0));
  for (let i = 0; i < n; i++) { g.add(lathe([[0, -0.75], [0.35, -0.7], [0.4, -0.6], [0.4, 0.6], [0.35, 0.7], [0, 0.75]], W, 16, i * 1.0, 0.75, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; g.add(torus(0.41, 0.03, M(COL.red), i, 0.75, 0)); }
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ HELIDECK
export function helideck(x, y, z, r = 12) {
  const g = grp('helideck');
  const c = document.createElement('canvas'); c.width = c.height = 512; const k = c.getContext('2d');
  k.fillStyle = '#2f4f3a'; k.fillRect(0, 0, 512, 512); k.strokeStyle = '#f1c40f'; k.lineWidth = 22; k.beginPath(); k.arc(256, 256, 150, 0, 7); k.stroke();
  k.strokeStyle = '#ffffff'; k.lineWidth = 10; k.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; k.lineTo(256 + Math.cos(a) * 240, 256 + Math.sin(a) * 240); } k.stroke();
  k.fillStyle = '#fff'; k.font = 'bold 200px Arial'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('H', 256, 266);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.5, 8), [M(COL.dark), M(0xffffff, { map: t, metalness: 0.1 }), M(COL.dark)]);
  deck.rotation.y = Math.PI / 8; deck.userData.keep = true; g.add(deck);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(r + 1.5, r, 0.1, 8, 1, true), M(0xffffff, { map: TEX.grating, side: THREE.DoubleSide }));
  net.rotation.y = Math.PI / 8; net.position.y = 0.1; g.add(net);
  const L = new Lattice(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; L.add(V3(Math.cos(a) * r * 0.9, -0.3, Math.sin(a) * r * 0.9), V3(Math.cos(a) * r * 0.3, -6, Math.sin(a) * r * 0.3), 0.25); L.add(V3(0, -0.3, 0), V3(Math.cos(a) * r * 0.9, -0.3, Math.sin(a) * r * 0.9), 0.2); }
  g.add(L.build(M(COL.white, { metalness: 0.3 })));
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.add(sph(0.12, M(0xa0ff9a, { emissive: 0x30ff40, emissiveIntensity: 1.2 }), Math.cos(a) * (r - 0.2), 0.35, Math.sin(a) * (r - 0.2))); }
  g.add(cyl(0.06, 4, MAT.steel(), r * 0.7, 2, r * 0.7)); const sock = cone(0.35, 0.12, 2.2, M(COL.orange), r * 0.7 + 1.1, 3.8, r * 0.7); sock.rotation.z = Math.PI / 2; g.add(sock);
  return place(g, x, y, z);
}

// ------------------------------------------------------------------ ACCOMMODATION
export function quarters(x, y, z, w, h, d, { bridge = false, name } = {}) {
  const g = grp('quarters');
  g.add(boxUV(w, h, d, MAT.windows(), 0, h / 2, 0, 1 / 3));
  g.add(box(w + 0.2, 0.4, d + 0.2, M(0xbdc3c7), 0, h + 0.2, 0));
  g.add(rectRail(-w / 2, -d / 2, w / 2, d / 2, h + 0.4, 1.1));
  if (bridge) { g.add(rbox(w * 0.7, 3, d * 0.8, 0.3, M(0xf4f6f7), 0, h + 1.9, 0)); g.add(box(w * 0.7 + 0.05, 1.3, d * 0.75, MAT.glass(), 0, h + 2.3, 0)); }
  const top = h + (bridge ? 3.4 : 0.4);
  g.add(cyl(0.12, 7, MAT.steel(), w * 0.2, top + 3.5, 0)); g.add(box(3.2, 0.25, 0.4, M(0x333333), w * 0.2, top + 6.2, 0)); g.add(sph(0.7, M(0xffffff), -w * 0.2, top + 1.0, d * 0.25));
  g.add(sph(0.12, MAT.redLight(), w * 0.2, top + 7.1, 0));
  if (name) { const plate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 1.6), M(0xffffff, { map: textTexture(name, 1024, 128, '#ffffff', '#1b2a41', 'bold 90px Arial') })); plate.position.set(0, h - 1.2, d / 2 + 0.03); plate.userData.keep = true; g.add(plate); }
  g.add(stairs(V3(w / 2 + 0.7, 0, d / 2 - 2), V3(w / 2 + 0.7, h, d / 2 - 2 - h * 0.9)));
  return place(g, x, y, z);
}

// ------------------------------------------------------------------ BURNER BOOM (well test)
export function burnerBoom(x, y, z, yaw = 0, len = 30) {
  const g = grp('burnerboom'), W = M(COL.white, { metalness: 0.4 });
  const B = new Lattice(); const C = [[0, 1.2, -0.9], [0, 1.2, 0.9], [0, -0.2, 0]];
  for (const [, cy, cz] of C) B.add(V3(0, cy, cz), V3(len, cy * 0.35 + 4, cz * 0.35), 0.12);
  for (let i = 0; i <= 10; i++) { const t = i / 10; const p = C.map(([, cy, cz]) => V3(len * t, lerpN(cy, cy * 0.35 + 4, t), lerpN(cz, cz * 0.35, t))); for (let k = 0; k < 3; k++) B.add(p[k], p[(k + 1) % 3], 0.05); }
  g.add(B.build(W)); g.add(cyl(0.6, 1.2, M(0x555555), len, 4.6, 0)); g.add(cyl(0.3, 1.0, M(0x888888), len, 5.5, 0));
  g.add(pipeRun([V3(0, 0.6, 0), V3(len, 4.0, 0)], 0.1, MAT.steel()));
  g.rotation.y = yaw; g.position.set(x, y, z); return g;
}
const lerpN = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ PIPE / RISER STORAGE
export function pipeDeck(x, y, z, len = 30, w = 12, color = COL.steel, key = 'pipedeck', r = 0.18, layers = 3) {
  const G = grp(key); G.position.set(x, y, z);
  G.add(boxUV(len + 2, 0.4, w + 2, MAT.checker(), 0, 0.2, 0));
  for (const sx of [-len / 2 - 0.8, len / 2 + 0.8]) G.add(box(0.3, 2.5, w + 2, YEL(), sx, 1.25, 0));
  const per = Math.floor(w / (r * 2.2)); const geo = new THREE.CylinderGeometry(r, r, len, 10); geo.rotateZ(Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, M(color, { metalness: 0.5 }), per * layers); const mx = new THREE.Matrix4(); let k = 0;
  for (let l = 0; l < layers; l++) for (let i = 0; i < per; i++) { mx.makeTranslation(0, 0.4 + r + l * r * 2 + l * 0.1, -w / 2 + i * r * 2.2 + r); im.setMatrixAt(k++, mx); }
  G.add(im);
  if (key === 'riserrack') for (let i = 0; i < per; i++) for (const sx of [-len / 2, len / 2]) { /* flanges */ }
  return G;
}
export function containers(x, y, z, n = 4, rot = 0) {
  const g = grp('container'); const cols = [0x1f618d, 0xb03a2e, 0x1e8449, 0x7d3c98, 0xd68910];
  for (let i = 0; i < n; i++) { const m = M(cols[i % cols.length], { metalness: 0.3 }); g.add(boxUV(6.1, 2.6, 2.44, m, 0, 1.3 + (i % 2) * 2.6, Math.floor(i / 2) * 2.6)); }
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ CHRISTMAS TREE (surface / platform)
export function xmasTree(x, y, z, rot = 0) {
  const g = grp('xmastree'), R = M(0xc0392b, { metalness: 0.45 }), S = MAT.steel();
  g.add(lathe([[0.35, 0], [0.35, 0.4], [0.45, 0.4], [0.45, 0.55], [0.3, 0.55], [0.3, 0.8]], S, 20));
  g.add(flange(0.42, 0.12, 8, S, 0.85));
  g.add(valve(0, 1.25, 0, 0.9, 'z', R)); g.add(valve(0, 1.95, 0, 0.9, 'z', R, false));
  g.add(rbox(0.5, 0.5, 0.5, 0.05, S, 0, 2.6, 0));
  g.add(valve(0.75, 2.6, 0, 0.8, 'x', R, false)); g.add(hcyl(0.12, 1.4, S, 1.4, 2.6, 0)); g.add(rbox(0.4, 0.5, 0.4, 0.06, M(0x2c3e50), 2.0, 2.6, 0));
  g.add(valve(0, 3.25, 0, 0.8, 'z', R)); g.add(lathe([[0.22, 0], [0.22, 0.3], [0.1, 0.4], [0, 0.42]], S, 16, 0, 3.6, 0));
  g.add(cyl(0.06, 0.3, MAT.dark(), -0.3, 2.95, 0)); g.add(cyl(0.12, 0.05, M(0xffffff), -0.3, 3.1, 0));
  return place(g, x, y, z, rot);
}

// ------------------------------------------------------------------ RIG FLOOR: shared deck clutter
export function bopHandler(x, y, z) { // overhead BOP crane rails (for drillships/semis)
  const g = grp('bophandler'), Y = YEL();
  for (const sz of [-4, 4]) g.add(box(22, 0.8, 0.6, Y, 0, 9, sz));
  for (const sx of [-10, 10]) for (const sz of [-4, 4]) g.add(box(0.6, 9, 0.6, Y, sx, 4.5, sz));
  g.add(box(1.2, 1.2, 9, Y, 3, 9.6, 0)); g.add(rbox(1.4, 1.0, 1.4, 0.1, MAT.dark(), 3, 8.6, 0));
  return place(g, x, y, z);
}
