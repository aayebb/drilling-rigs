// Detailed moonpools, riser handling items, flow lines, ship outfitting details
import * as THREE from 'three';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, pipeRun, strutMesh, Lattice, railing, rectRail, ladder, lbl } from './lib.js';

// stiffened steel plate texture (vertical frames + horizontal stringers)
const stiffTex = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#7d868e'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#5b636b'; g.fillRect(0, 0, 10, 128); g.fillRect(64, 0, 10, 128); g.fillRect(0, 60, 128, 8);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(10, 0, 3, 128); g.fillRect(74, 0, 3, 128);
  g.fillStyle = 'rgba(120,70,30,.25)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * 128, 68 + Math.random() * 50, 2, 6 + Math.random() * 20);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const perfTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#9aa3ab'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#1b2026';
  for (let y = 8; y < 64; y += 16) for (let x = 8; x < 64; x += 16) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const STIFF = () => M(0xffffff, { map: stiffTex, metalness: 0.5, roughness: 0.6 });
const PERF = () => M(0xffffff, { map: perfTex, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide });
const YEL = () => M(COL.yellow, { metalness: 0.35 });

function lampRow(g, pts, face) { for (const p of pts) { g.add(rbox(0.7, 0.35, 0.35, 0.05, MAT.dark(), p.x, p.y, p.z)); g.add(box(0.55, 0.22, 0.05, MAT.lightOn(), p.x + (face.x || 0) * 0.18, p.y, p.z + (face.z || 0) * 0.18)); } }

// ------------------------------------------------------------------ DRILLSHIP MOONPOOL (opening already cut in the hull)
// x0..x1 (length), half width hw, deckY top, keelY bottom
export function shipMoonpool(R, { x0 = -20, x1 = 20, hw = 6.5, deckY = 7, keelY = -12 } = {}) {
  const mp = grp('moonpool'); R.add(mp);
  const H = deckY - keelY, L = x1 - x0, cy = (deckY + keelY) / 2;
  // stiffened inner walls
  const s = 0.15;
  mp.add(boxUV(L, H, 0.3, STIFF(), (x0 + x1) / 2, cy, hw - s, 0.12)); mp.add(boxUV(L, H, 0.3, STIFF(), (x0 + x1) / 2, cy, -hw + s, 0.12));
  mp.add(boxUV(0.3, H, hw * 2, STIFF(), x0 + s, cy, 0, 0.12)); mp.add(boxUV(0.3, H, hw * 2, STIFF(), x1 - s, cy, 0, 0.12));
  // coaming at deck with hazard stripes, and hull opening rim at keel
  for (const sz of [-1, 1]) mp.add(boxUV(L + 1.2, 0.5, 0.5, MAT.hazard(), (x0 + x1) / 2, deckY + 0.25, sz * (hw + 0.25), 1));
  for (const sx of [x0, x1]) mp.add(boxUV(0.5, 0.5, hw * 2 + 1.2, MAT.hazard(), sx + (sx === x0 ? -0.25 : 0.25), deckY + 0.25, 0, 1));
  // internal walkways (two levels) with railings + ladders
  for (const y of [3.0, -3.5]) {
    for (const sz of [-1, 1]) {
      const z = sz * (hw - 0.9);
      mp.add(boxUV(L - 1, 0.12, 1.4, MAT.grating(), (x0 + x1) / 2, y, z, 0.8));
      for (let x = x0 + 2; x < x1; x += 4) mp.add(strutMesh(V3(x, y - 0.05, sz * (hw - 0.3)), V3(x, y - 1.4, sz * (hw - 0.05)), 0.06, YEL()));
      mp.add(railing([V3(x0 + 0.6, y, z - sz * 0.7), V3(x1 - 0.6, y, z - sz * 0.7)]));
    }
  }
  for (const [x, z] of [[x0 + 1.5, hw - 0.5], [x1 - 1.5, -hw + 0.5]]) mp.add(ladder(x, -3.5, z, deckY + 3.5, true, 'x'));
  // wave dampers (perforated cantilever plates near the waterline)
  const wd = grp('wavedamper'); mp.add(wd);
  for (const sz of [-1, 1]) for (let x = x0 + 1.5; x < x1 - 1; x += 3.2) { const p = boxUV(2.8, 0.08, 2.0, PERF(), x + 1.4, -1.2, sz * (hw - 1.0), 0.6); p.rotation.x = sz * 0.12; wd.add(p); }
  for (const sx of [x0 + 1.0, x1 - 1.0]) { const p = boxUV(2.0, 0.08, hw * 2 - 2, PERF(), sx, -1.2, 0, 0.6); wd.add(p); }
  // floodlights on walls
  lampRow(mp, [-15, -5, 5, 15].flatMap(x => [V3(x, 5.5, hw - 0.4), V3(x, 5.5, -hw + 0.4)]), V3(0, 0, 0));
  for (const x of [-15, -5, 5, 15]) for (const sz of [-1, 1]) mp.add(sph(0.18, MAT.lightOn(), x, 5.5, sz * (hw - 0.65)));
  // water surface inside moonpool (animated sloshing)
  const wg = new THREE.PlaneGeometry(L - 0.6, hw * 2 - 0.6, 40, 14); wg.rotateX(-Math.PI / 2);
  const water = tag(new THREE.Mesh(wg, new THREE.MeshPhysicalMaterial({ color: 0x0e5d6e, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.85, emissive: 0x032a33, emissiveIntensity: 0.4, side: THREE.DoubleSide })), 'moonpoolwater');
  water.position.set((x0 + x1) / 2, 0, 0); water.userData.dynamic = true; mp.add(water);
  const base = Float32Array.from(wg.attributes.position.array);
  // moonpool cart spanning the moonpool on rails (parked at the east end)
  const cart = grp('moonpoolcart'); R.add(cart);
  for (const sz of [-1, 1]) cart.add(boxUV(L + 10, 0.35, 0.6, MAT.hazard(), (x0 + x1) / 2, deckY + 0.18, sz * (hw + 1.2), 1));
  const cf = new Lattice(); const cx = x1 - 3.5;
  for (const dx of [-2.6, 2.6]) { cf.addBox(0.8, 0.9, hw * 2 + 3.2, cx + dx, deckY + 0.95, 0); }
  for (const dz of [-hw + 0.5, 0, hw - 0.5]) cf.addBox(6.0, 0.5, 0.5, cx, deckY + 1.2, dz);
  cart.add(cf.build(YEL()));
  for (const dx of [-2.6, 2.6]) for (const sz of [-1, 1]) cart.add(hcyl(0.4, 0.5, MAT.dark(), cx + dx, deckY + 0.55, sz * (hw + 1.2), 'z'));
  cart.add(rbox(2.0, 0.8, 1.4, 0.08, M(0x2c3e50), cx, deckY + 1.6, hw - 1.5));
  // BOP transporter skid rails from storage to moonpool
  const tr = grp('moonpoolcart'); for (const dz of [-12.5, -7.5]) tr.add(boxUV(26, 0.3, 0.6, MAT.hazard(), -33, deckY + 0.15, dz, 1)); R.add(tr);
  const upd = (t) => {
    const p = wg.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) { const x = base[i], z = base[i + 2]; p[i + 1] = 0.6 + Math.sin(x * 0.45 + t * 1.6) * 0.35 + Math.sin(z * 0.9 - t * 2.1) * 0.25 + Math.sin(t * 0.7) * 0.5; }
    wg.attributes.position.needsUpdate = true; wg.computeVertexNormals();
  };
  lbl(mp, 'Moonpool walkways', x0 + 9, 4.0, -hw + 1, 0.55); lbl(mp, 'Wave dampers', x0 + 9, -0.6, -hw + 1.5, 0.55); lbl(mp, 'Moonpool cart', x1 - 3.5, deckY + 3, 0, 0.8);
  return upd;
}

// ------------------------------------------------------------------ SEMI MOONPOOL (opening in the deck box)
export function semiMoonpool(R, { hx = 8, hz = 7, y0 = 12, y1 = 20 } = {}) {
  const mp = grp('moonpool'); R.add(mp);
  const H = y1 - y0, cy = (y0 + y1) / 2;
  mp.add(boxUV(hx * 2, H, 0.3, STIFF(), 0, cy, hz - 0.15, 0.15)); mp.add(boxUV(hx * 2, H, 0.3, STIFF(), 0, cy, -hz + 0.15, 0.15));
  mp.add(boxUV(0.3, H, hz * 2, STIFF(), hx - 0.15, cy, 0, 0.15)); mp.add(boxUV(0.3, H, hz * 2, STIFF(), -hx + 0.15, cy, 0, 0.15));
  for (const sz of [-1, 1]) mp.add(boxUV(hx * 2 + 1, 0.4, 0.5, MAT.hazard(), 0, y1 + 0.2, sz * (hz + 0.25), 1));
  for (const sx of [-1, 1]) mp.add(boxUV(0.5, 0.4, hz * 2 + 1, MAT.hazard(), sx * (hx + 0.25), y1 + 0.2, 0, 1));
  for (const sz of [-1, 1]) { mp.add(boxUV(hx * 2 - 1, 0.12, 1.2, MAT.grating(), 0, 15, sz * (hz - 0.8), 0.8)); mp.add(railing([V3(-hx + 0.5, 15, sz * (hz - 1.4)), V3(hx - 0.5, 15, sz * (hz - 1.4))])); }
  mp.add(ladder(hx - 0.6, 15, hz - 0.6, 5, false, 'x'));
  for (const x of [-5, 0, 5]) for (const sz of [-1, 1]) { mp.add(rbox(0.7, 0.35, 0.35, 0.05, MAT.dark(), x, 18, sz * (hz - 0.35))); mp.add(sph(0.16, MAT.lightOn(), x, 18, sz * (hz - 0.55))); }
  // guide frame / riser centralizer beams under the deck
  const gf = new Lattice(); for (const sz of [-1, 1]) gf.addBox(hx * 2, 0.6, 0.6, 0, y0 - 0.3, sz * 3.2); gf.addBox(0.6, 0.6, 6.4, 3.2, y0 - 0.3, 0); gf.addBox(0.6, 0.6, 6.4, -3.2, y0 - 0.3, 0);
  mp.add(gf.build(YEL()));
  return mp;
}

// ------------------------------------------------------------------ RISER SPIDER + GIMBAL (parked on the drill floor)
export function riserSpider(x, y, z) {
  const g = grp('riserspider'), Y = M(0xf39c12, { metalness: 0.4 }), D = MAT.dark();
  g.add(lathe([[1.3, 0], [1.6, 0], [1.6, 0.4], [1.3, 0.45]], D, 32)); // gimbal base
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.add(cyl(0.18, 0.25, MAT.rubber(), Math.cos(a) * 1.45, 0.55, Math.sin(a) * 1.45)); }
  g.add(lathe([[0.75, 0.6], [1.45, 0.6], [1.45, 1.2], [0.75, 1.2]], Y, 32)); // spider body
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const d = rbox(0.5, 0.35, 0.3, 0.05, D, Math.cos(a) * 0.9, 1.0, Math.sin(a) * 0.9); d.rotation.y = -a; g.add(d); const cl = cyl(0.12, 0.6, MAT.chrome(), Math.cos(a) * 1.3, 1.5, Math.sin(a) * 1.3); g.add(cl); }
  g.position.set(x, y, z); return g;
}
// riser running tool hanging on the catwalk side
export function riserRunningTool(x, y, z) {
  const g = grp('riserspider'); g.add(lathe([[0.3, 0], [0.55, 0.2], [0.55, 1.4], [0.3, 1.6], [0.2, 2.2]], M(0xf39c12, { metalness: 0.4 }), 24));
  g.add(box(0.8, 0.6, 0.8, MAT.dark(), 0, -0.2, 0)); g.position.set(x, y, z); return g;
}

// ------------------------------------------------------------------ FLOW LINE (diverter → shakers)
export function flowLine(pts) {
  const g = grp('flowline'); g.add(pipeRun(pts, 0.32, M(0x95a5a6, { metalness: 0.6 }), 10));
  for (let i = 1; i < pts.length - 1; i++) g.add(cyl(0.12, Math.max(0.5, pts[i].y - 7), MAT.dark(), pts[i].x, (pts[i].y + 7) / 2 - 0.3, pts[i].z));
  return g;
}

// ------------------------------------------------------------------ SHIP OUTFITTING
export function bowAnchor(x, y, z, side) {
  const g = grp('shipanchor'), D = M(0x2b2b2b, { metalness: 0.7 });
  g.add(box(0.7, 3.2, 0.5, D, 0, -1.6, 0)); g.add(box(0.5, 0.5, 2.6, D, 0, -3.2, 0));
  for (const sz of [-1, 1]) { const f = box(0.4, 1.8, 0.9, D, 0, -2.6, sz * 1.2); f.rotation.x = sz * 0.6; g.add(f); }
  g.add(lathe([[1.3, -0.4], [1.3, 0.6]], M(0x111111, { side: THREE.DoubleSide }), 20, 0, 0, side * -0.3)); // hawse pipe
  g.position.set(x, y, z); g.rotation.y = side > 0 ? 0 : Math.PI; return g;
}
export function windlass(x, y, z) {
  const g = grp('shipanchor'); g.add(box(3, 1.2, 2.2, M(0x2e4053), 0, 0.6, 0)); g.add(hcyl(0.8, 2.2, MAT.dark(), 0, 1.4, 0, 'z'));
  g.add(hcyl(0.95, 0.15, M(COL.red), 0, 1.4, 0.9, 'z')); g.position.set(x, y, z); return g;
}
export function bollards(pts) {
  const g = grp('bollard');
  for (const p of pts) { g.add(box(1.6, 0.25, 0.7, MAT.dark(), p.x, p.y + 0.12, p.z)); for (const dx of [-0.45, 0.45]) { g.add(cyl(0.2, 0.8, MAT.dark(), p.x + dx, p.y + 0.6, p.z)); g.add(cyl(0.27, 0.08, MAT.dark(), p.x + dx, p.y + 1.0, p.z)); } }
  return g;
}
export function rescueBoat(x, y, z, rot = 0) {
  const g = grp('rescueboat');
  const tube = lathe([[0, -3], [0.4, -2.8], [0.45, 2.2], [0.3, 2.9], [0, 3.1]], M(0xe55b13, { roughness: 0.7, metalness: 0 }), 14); tube.rotation.z = Math.PI / 2; tube.scale.set(1, 1, 1);
  for (const sz of [-0.85, 0.85]) { const t = tube.clone(); t.position.z = sz; g.add(t); }
  g.add(box(5.4, 0.25, 1.8, M(0xecf0f1), 0, -0.3, 0)); g.add(box(0.6, 0.6, 0.5, MAT.dark(), -2.2, 0.2, 0)); g.add(rbox(0.9, 0.7, 0.7, 0.1, M(0x2c3e50), 0.6, 0.3, 0));
  g.add(strutMesh(V3(-0.5, 0.2, 0), V3(0.2, 5.5, -1.5), 0.12, YEL())); g.add(strutMesh(V3(0.2, 5.5, -1.5), V3(0.2, 5.5, -3.0), 0.12, YEL())); g.add(strutMesh(V3(0, 5.3, 0), V3(0, 0.6, 0), 0.02, M(0x111111)));
  g.position.set(x, y, z); g.rotation.y = rot; return g;
}
export function fireMonitor(x, y, z, rot = 0) {
  const g = grp('firemonitor'), R = M(0xc0392b, { metalness: 0.4 });
  g.add(cyl(0.18, 1.2, R, 0, 0.6, 0)); g.add(sph(0.25, R, 0, 1.25, 0)); const n = cone(0.12, 0.2, 0.9, MAT.chrome(), 0.45, 1.45, 0); n.rotation.z = -1.1; g.add(n);
  g.add(torus(0.18, 0.03, MAT.dark(), -0.1, 1.25, 0.22));
  g.position.set(x, y, z); g.rotation.y = rot; return g;
}
export function floodMast(x, y, z, h = 14) {
  const g = grp('floodlight');
  g.add(cyl(0.18, h, M(0xd0d3d4, { metalness: 0.5 }), 0, h / 2, 0)); g.add(box(2.4, 0.15, 0.15, MAT.dark(), 0, h, 0));
  for (const dx of [-0.9, 0, 0.9]) { g.add(rbox(0.6, 0.45, 0.35, 0.05, MAT.dark(), dx, h + 0.35, 0.2)); g.add(box(0.48, 0.34, 0.03, MAT.lightOn(), dx, h + 0.35, 0.39)); }
  g.position.set(x, y, z); return g;
}
export function funnel(x, y, z) {
  const g = grp('engineroom');
  g.add(rbox(6, 9, 8, 0.8, M(0xecf0f1, { metalness: 0.3 }), 0, 4.5, 0)); g.add(box(6.05, 1.0, 8.05, M(0x1b2a41), 0, 8.0, 0));
  for (const dz of [-2, 0, 2]) for (const dx of [-1.2, 1.2]) { g.add(cyl(0.45, 3, M(0x34495e, { metalness: 0.6 }), dx, 10, dz)); g.add(cyl(0.48, 0.15, M(0x111111), dx, 11.5, dz)); }
  g.position.set(x, y, z); return g;
}
// crown-mounted heave compensator (floaters)
export function heaveCompensator(H, top) {
  const g = grp('heavecomp'), S = M(0x7f8c8d, { metalness: 0.6 }), CH = MAT.chrome(), Y = YEL();
  for (const sx of [-1.7, 1.7]) { g.add(lathe([[0.45, 0], [0.5, 0.1], [0.5, 3.4], [0.4, 3.6]], S, 20, sx, H + 1.8, -1.2)); g.add(cyl(0.22, 1.5, CH, sx, H + 1.1, -1.2)); }
  g.add(box(4.4, 0.6, 1.2, Y, 0, H + 2.0, -1.2)); g.add(box(4.4, 0.6, 1.2, Y, 0, H + 5.5, -1.2));
  for (let i = 0; i < 4; i++) g.add(lathe([[0, 0], [0.35, 0.1], [0.38, 0.3], [0.38, 2.6], [0.3, 2.8], [0, 2.9]], M(0xbdc3c7, { metalness: 0.5 }), 14, -1.5 + i, H + 0.5, top / 2 + 0.4));
  return g;
}
