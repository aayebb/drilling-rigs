// Detailed well-control & subsea models: subsea BOP, surface BOP, riser, ROV, wellheads, platform
import * as THREE from 'three';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, flange, valve, pipeRun, strutMesh, Lattice, railing, rectRail, ladder, stairs, lbl, stripeTexture, seabedY } from './lib.js';
import { xmasTree } from './equipment.js';

const YEL = () => M(COL.yellow, { metalness: 0.35, roughness: 0.55 });

// Ram preventer body with two hydraulic bonnets; returns group (y = centre)
function ramBOP(key, y, colr, s = 1, opts = {}) {
  const g = grp(key), C = M(colr, { metalness: 0.45, roughness: 0.45 }), D = MAT.dark();
  g.add(rbox(1.9 * s, 1.0 * s, 1.9 * s, 0.12 * s, C));
  for (const sx of [-1, 1]) {
    const b = lathe([[0.62 * s, 0], [0.62 * s, 0.2 * s], [0.5 * s, 0.25 * s], [0.5 * s, 1.5 * s], [0.42 * s, 1.6 * s], [0.42 * s, 1.75 * s], [0.2 * s, 1.85 * s], [0, 1.85 * s]], C, 24);
    b.rotation.z = -sx * Math.PI / 2; b.position.x = sx * 0.95 * s; g.add(b);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.add(hcyl(0.04 * s, 0.25 * s, D, sx * 1.05 * s, Math.cos(a) * 0.52 * s, Math.sin(a) * 0.52 * s)); }
    if (opts.lock) g.add(hcyl(0.15 * s, 0.4 * s, M(0xf1c40f), sx * 2.95 * s, 0, 0));
  }
  g.position.y = y; return g;
}
function annularBOP(y, s = 1, colr = 0x7a828c) {
  const g = grp('annular'), C = M(colr, { metalness: 0.5, roughness: 0.4 });
  g.add(lathe([[0.5 * s, 0], [1.35 * s, 0], [1.45 * s, 0.15 * s], [1.45 * s, 0.75 * s], [1.3 * s, 1.15 * s], [0.9 * s, 1.45 * s], [0.5 * s, 1.55 * s], [0.45 * s, 1.75 * s]], C, 32));
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.add(cyl(0.045 * s, 0.2 * s, MAT.dark(), Math.cos(a) * 1.3 * s, 0.1 * s, Math.sin(a) * 1.3 * s)); }
  g.add(hcyl(0.07 * s, 0.4 * s, MAT.steel(), 1.55 * s, 0.4 * s, 0)); g.add(hcyl(0.07 * s, 0.4 * s, MAT.steel(), 1.55 * s, 0.9 * s, 0));
  g.position.y = y; return g;
}

// ------------------------------------------------------------------ SUBSEA BOP (origin = seabed)
export function buildSubseaBOP({ labels = true } = {}) {
  const G = new THREE.Group(), S = MAT.steel(), D = MAT.dark();
  // cuttings mound + wellhead / PGB
  const mound = sph(7, M(0x6b6458, { metalness: 0, roughness: 1 }), 0, -0.3, 0, 0.08); G.add(mound);
  const wh = grp('wellhead');
  wh.add(cyl(0.95, 3.5, M(0x7f8c8d, { metalness: 0.6 }), 0, 0.2, 0));
  wh.add(lathe([[0.55, 1.9], [0.75, 1.9], [0.75, 3.0], [0.55, 3.0]], S, 28));
  const pgb = new Lattice(); for (const [a, b] of [[[-2.8, -2.8], [2.8, -2.8]], [[2.8, -2.8], [2.8, 2.8]], [[2.8, 2.8], [-2.8, 2.8]], [[-2.8, 2.8], [-2.8, -2.8]], [[-2.8, -2.8], [2.8, 2.8]], [[2.8, -2.8], [-2.8, 2.8]]]) pgb.add(V3(a[0], 0.6, a[1]), V3(b[0], 0.6, b[1]), 0.18, new THREE.BoxGeometry(1, 1, 1));
  wh.add(pgb.build(YEL()));
  for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) { wh.add(cyl(0.15, 3.6, YEL(), x, 2.4, z)); wh.add(cone(0.15, 0.4, 0.5, YEL(), x, 4.4, z)); }
  G.add(wh);
  // wellhead connector
  const wc = grp('wellheadconn'); wc.add(lathe([[0.6, 2.95], [1.25, 3.0], [1.3, 3.3], [1.3, 4.2], [1.0, 4.4], [0.6, 4.4]], D, 32));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; wc.add(cyl(0.14, 0.9, M(COL.yellow), Math.cos(a) * 1.35, 3.7, Math.sin(a) * 1.35)); }
  G.add(wc);
  // lower stack frame
  const F = new Lattice();
  for (const [x, z] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) F.add(V3(x, 3.0, z), V3(x, 10.6, z), 0.17, new THREE.BoxGeometry(1, 1, 1));
  for (const y of [3.1, 6.8, 10.5]) for (const [a, b] of [[[-3.2, -3.2], [3.2, -3.2]], [[3.2, -3.2], [3.2, 3.2]], [[3.2, 3.2], [-3.2, 3.2]], [[-3.2, 3.2], [-3.2, -3.2]]]) F.add(V3(a[0], y, a[1]), V3(b[0], y, b[1]), 0.14, new THREE.BoxGeometry(1, 1, 1));
  for (const [a, b] of [[[-3.2, -3.2], [3.2, -3.2]], [[-3.2, 3.2], [3.2, 3.2]]]) { F.add(V3(a[0], 3.1, a[1]), V3(b[0], 6.8, b[1]), 0.08); F.add(V3(b[0], 6.8, b[1]), V3(a[0], 10.5, a[1]), 0.08); }
  G.add(tag(F.build(YEL()), 'bopstack'));
  // ram stack with flanges between
  ['piperam', 'piperam', 'piperam', 'casingshear', 'blindshear'].forEach((k, i) => {
    const colr = k === 'blindshear' ? 0xa93226 : k === 'casingshear' ? 0xb5651d : 0x5d6d7e;
    G.add(ramBOP(k, 4.9 + i * 1.18, colr, 0.92, { lock: true }));
  });
  for (let i = 0; i < 5; i++) G.add(tag(flange(0.85, 0.16, 12, S, 4.3 + i * 1.18), 'bopstack'));
  // choke/kill failsafe valves (with hydraulic actuators) + lines
  const ck = grp('chokekill'), R = M(COL.red, { metalness: 0.45 });
  for (const y of [5.5, 7.85, 9.0]) for (const sx of [-0.85, 0.85]) { ck.add(valve(sx, y, 1.75, 0.9, 'z', R, false)); }
  ck.add(pipeRun([V3(0.85, 5.5, 2.3), V3(1.6, 5.5, 2.5), V3(1.6, 17, 2.5)], 0.12, R));
  ck.add(pipeRun([V3(-0.85, 7.85, 2.3), V3(-1.6, 7.85, 2.5), V3(-1.6, 17, 2.5)], 0.12, R));
  G.add(ck);
  // accumulators (two racks)
  const acc = grp('accumulator');
  for (const sx of [-2.65, -2.05, 2.05, 2.65]) for (const sz of [-2.4, -1.7, 1.7, 2.4]) acc.add(lathe([[0, 0], [0.22, 0.08], [0.26, 0.3], [0.26, 2.3], [0.2, 2.5], [0.08, 2.6]], M(0xd35400, { metalness: 0.4 }), 16, sx, 3.4, sz));
  G.add(acc);
  // hydraulic hoses
  const hoses = grp('controlpod');
  for (let i = 0; i < 6; i++) hoses.add(pipeRun([V3(2.2, 12.5, -0.2 + i * 0.08), V3(2.8, 11, -0.5 + i * 0.1), V3(2.0, 9 - i * 0.6, -1.0), V3(1.4, 8 - i * 0.6, -0.8)], 0.035, M(0x111111, { roughness: 0.9 })));
  G.add(hoses);
  // ROV panel
  const rp = grp('rovpanel'); rp.add(boxUV(2.0, 1.4, 0.15, M(0xf4d03f), 0, 6.0, 3.3));
  for (let i = 0; i < 6; i++) { rp.add(hcyl(0.1, 0.25, MAT.dark(), -0.7 + (i % 3) * 0.7, 6.3 - Math.floor(i / 3) * 0.6, 3.45, 'z')); rp.add(torus(0.12, 0.02, MAT.steel(), -0.7 + (i % 3) * 0.7, 6.3 - Math.floor(i / 3) * 0.6, 3.55)); }
  rp.add(box(0.3, 1.2, 0.2, M(0x2c3e50), 1.4, 5.9, 3.35)); G.add(rp);
  for (let k = 0; k < 8; k++) G.add(tag(box(0.5, 0.25, 0.15, M(0xbdc3c7), -3.2 + (k % 2) * 6.4, 4 + Math.floor(k / 2) * 1.6, 3.3), 'bopstack')); // anodes
  // LMRP
  const LF = new Lattice();
  for (const [x, z] of [[-3.1, -2.8], [3.1, -2.8], [-3.1, 2.8], [3.1, 2.8]]) LF.add(V3(x, 10.7, z), V3(x, 15.6, z), 0.16, new THREE.BoxGeometry(1, 1, 1));
  for (const y of [10.8, 15.5]) for (const [a, b] of [[[-3.1, -2.8], [3.1, -2.8]], [[3.1, -2.8], [3.1, 2.8]], [[3.1, 2.8], [-3.1, 2.8]], [[-3.1, 2.8], [-3.1, -2.8]]]) LF.add(V3(a[0], y, a[1]), V3(b[0], y, b[1]), 0.13, new THREE.BoxGeometry(1, 1, 1));
  G.add(tag(LF.build(M(0x2e86c1, { metalness: 0.35 })), 'lmrp'));
  const lc = grp('lmrp'); lc.add(lathe([[0.6, 10.5], [1.15, 10.55], [1.2, 10.8], [1.2, 11.4], [0.9, 11.6], [0.6, 11.6]], D, 32));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.5; lc.add(cyl(0.12, 0.8, M(COL.yellow), Math.cos(a) * 1.25, 11.05, Math.sin(a) * 1.25)); }
  G.add(lc);
  G.add(annularBOP(11.6, 0.95)); G.add(annularBOP(13.4, 0.95));
  // MUX control pods (yellow & blue)
  const pods = grp('controlpod');
  for (const [sx, c] of [[2.35, 0xf1c40f], [-2.35, 0x2e86c1]]) {
    const P = M(c, { metalness: 0.3 });
    pods.add(rbox(1.2, 2.6, 1.2, 0.15, P, sx, 13.1, 0)); pods.add(cone(0.35, 0.6, 0.6, P, sx, 14.7, 0)); pods.add(rbox(0.9, 0.5, 0.9, 0.08, MAT.dark(), sx, 11.6, 0));
    for (let i = 0; i < 4; i++) pods.add(hcyl(0.08, 0.2, MAT.steel(), sx - Math.sign(sx) * 0.65, 12.3 + i * 0.45, 0.3));
  }
  G.add(pods);
  const fj = grp('flexjoint'); fj.add(lathe([[0.55, 15.2], [1.0, 15.3], [1.1, 15.7], [0.9, 16.3], [0.55, 16.5]], D, 28)); fj.add(sph(0.7, M(0x222222), 0, 16.4, 0, 0.6)); G.add(fj);
  const ra = grp('riseradapter'); ra.add(lathe([[0.5, 16.5], [0.6, 16.5], [0.6, 17.0], [1.1, 17.05], [1.1, 17.35], [0.5, 17.4]], S, 28));
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ra.add(cyl(0.05, 0.4, D, Math.cos(a) * 0.95, 17.2, Math.sin(a) * 0.95)); }
  G.add(ra);
  if (labels) {
    const L = (t, x, y, z) => lbl(G, t, x, y, z, 0.6);
    L('Flex joint', 0, 17.8, 1.4); L('Annular preventers (x2)', 2.2, 15.4, 2.2); L('Yellow pod', 3.6, 14.9, 0); L('Blue pod', -3.6, 14.9, 0);
    L('LMRP connector', -2.6, 11.0, 2.6); L('Blind shear rams', 4.2, 9.6, 0.6); L('Casing shear rams', 4.2, 8.4, 0.6);
    L('Pipe rams (x3)', 4.2, 6.1, 0.6); L('Wellhead connector', -2.8, 3.4, 3.4); L('Subsea wellhead & guide base', 0, 0.9, 3.8);
    L('Choke & kill valves', 0, 7.1, 2.9); L('ROV panel', 0, 6.9, 3.6); L('Accumulators', -2.4, 6.2, -2.8);
  }
  G.userData.height = 17.4;
  return G;
}

// ------------------------------------------------------------------ SURFACE BOP (jack-up), origin at top, builds downward
export function buildSurfaceBOP() {
  const G = new THREE.Group(), s = 0.72, S = MAT.steel();
  G.add(annularBOP(-1.55, s));
  G.add(tag(flange(0.75, 0.14, 12, S, -1.62), 'surfacebop'));
  G.add(ramBOP('piperam', -2.35, 0x5d6d7e, s)); G.add(ramBOP('blindshear', -3.1, 0xa93226, s));
  G.add(tag(flange(0.75, 0.14, 12, S, -3.55), 'surfacebop'));
  const sp = grp('drillspool'); sp.add(cyl(0.6, 0.8, M(COL.red, { metalness: 0.4 }), 0, -4.0, 0));
  for (const sx of [-1, 1]) { sp.add(hcyl(0.14, 1.0, M(COL.red), sx * 0.9, -4.0, 0)); sp.add(valve(sx * 1.6, -4.0, 0, 0.8, 'x', M(COL.red), sx > 0)); sp.add(valve(sx * 2.4, -4.0, 0, 0.8, 'x', M(COL.red), false)); }
  sp.add(pipeRun([V3(2.8, -4.0, 0), V3(3.4, -4.0, 0), V3(3.4, 2.0, 0), V3(5, 3, 0)], 0.1, M(COL.red)));
  sp.add(pipeRun([V3(-2.8, -4.0, 0), V3(-3.4, -4.0, 0), V3(-3.4, 2.0, 0), V3(-5, 3, 0)], 0.1, M(COL.red)));
  G.add(sp);
  G.add(tag(flange(0.75, 0.14, 12, S, -4.45), 'surfacebop'));
  G.add(ramBOP('piperam', -4.95, 0x5d6d7e, s));
  const hd = grp('surfacebop'); hd.add(lathe([[0.4, -6.4], [0.75, -6.3], [0.75, -5.5], [0.5, -5.45]], MAT.dark(), 24)); hd.add(flange(0.8, 0.16, 12, S, -5.45)); G.add(hd);
  return G;
}

// ------------------------------------------------------------------ MARINE RISER SYSTEM
export function buildRiser(floorY, deckUnder, riserBottomY) {
  const G = new THREE.Group(), S = MAT.steel();
  const dv = grp('diverter'); dv.add(lathe([[0.5, -1], [1.0, -0.9], [1.0, 0.2], [0.6, 0.3]], MAT.dark(), 24, 0, floorY - 1.8, 0));
  for (const sx of [-1, 1]) dv.add(pipeRun([V3(sx * 0.9, floorY - 2.3, 0), V3(sx * 3, floorY - 2.6, 0), V3(sx * 12, floorY - 3.5, 0)], 0.3, M(0x7f8c8d))); G.add(dv);
  const tj = grp('telejoint');
  tj.add(cyl(0.38, floorY - 3 - (deckUnder - 12), MAT.chrome(), 0, (floorY - 3 + deckUnder - 12) / 2, 0));
  tj.add(lathe([[0.4, 0], [0.75, 0.2], [0.75, 17], [0.55, 17.4]], M(0x8e9aa6, { metalness: 0.6 }), 24, 0, deckUnder - 29, 0));
  tj.add(lathe([[0.75, 0], [1.1, 0], [1.1, 0.8], [0.75, 0.8]], M(0x34495e), 24, 0, deckUnder - 13, 0)); // packer/collar
  G.add(tj);
  const tg = grp('tensioner');
  const ring = torus(1.8, 0.3, YEL(), 0, deckUnder - 11.5, 0); ring.rotation.x = Math.PI / 2; tg.add(ring);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2; const p0 = V3(Math.cos(a) * 1.8, deckUnder - 11.5, Math.sin(a) * 1.8), p1 = V3(Math.cos(a) * 5, deckUnder - 0.3, Math.sin(a) * 5);
    const mid = V3().lerpVectors(p0, p1, 0.55);
    tg.add(strutMesh(p0, mid, 0.18, MAT.chrome())); tg.add(strutMesh(mid, p1, 0.32, M(0x5d6d7e, { metalness: 0.5 })));
  }
  for (let i = 0; i < 4; i++) tg.add(lathe([[0, 0], [0.6, 0.2], [0.7, 0.6], [0.7, 4], [0.6, 4.4], [0, 4.6]], M(0x95a5a6, { metalness: 0.5 }), 16, -6 + i * 4, deckUnder + 0.1, 7)); // APV bottles on deck
  G.add(tg);
  // riser string
  const top = deckUnder - 29, slickTop = 80, slickBot = 60, JL = 22.86;
  const len = top - riserBottomY;
  const rs = grp('riser');
  rs.add(cyl(0.53, slickTop, M(0x95a5a6, { metalness: 0.6 }), 0, top - slickTop / 2, 0));
  rs.add(cyl(0.53, slickBot, M(0x95a5a6, { metalness: 0.6 }), 0, riserBottomY + slickBot / 2, 0));
  G.add(rs);
  const nJ = Math.floor(len / JL);
  const fl = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 20), M(0x5d6d7e, { metalness: 0.6 }), nJ); tag(fl, 'riser');
  const by = []; const mx = new THREE.Matrix4();
  for (let i = 0; i < nJ; i++) { const y = top - i * JL; mx.makeTranslation(0, y, 0); fl.setMatrixAt(i, mx); if (top - y > slickTop && y - riserBottomY > slickBot + JL) by.push(y); }
  G.add(fl);
  const bm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.98, 0.98, JL - 1.8, 24), M(0xf1c40f, { metalness: 0.05, roughness: 0.7 }), by.length); tag(bm, 'buoyancy');
  by.forEach((y, i) => { mx.makeTranslation(0, y - JL / 2, 0); bm.setMatrixAt(i, mx); }); G.add(bm);
  const ck = grp('chokekill');
  for (const [sx, sz, r] of [[0.75, 0.3, 0.1], [-0.75, 0.3, 0.1], [0, -0.78, 0.08], [0.55, -0.6, 0.05]]) ck.add(cyl(r, len, M(r > 0.09 ? COL.red : 0x2c3e50, { metalness: 0.4 }), sx, riserBottomY + len / 2, sz));
  G.add(ck);
  return G;
}

// ------------------------------------------------------------------ ROV + TMS
export function buildROV() {
  const g = grp('rov'), Y = M(0xf1c40f, { metalness: 0.1, roughness: 0.6 }), D = MAT.dark(), S = MAT.steel();
  g.add(rbox(3.0, 0.9, 1.8, 0.2, Y, 0, 0.55, 0));
  const fr = new Lattice(); for (const [x, z] of [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]]) fr.add(V3(x, -0.9, z), V3(x, 0.1, z), 0.06); fr.addBox(3.0, 0.12, 0.12, 0, -0.9, -0.8); fr.addBox(3.0, 0.12, 0.12, 0, -0.9, 0.8); fr.addBox(0.12, 0.12, 1.7, -1.4, -0.9, 0); fr.addBox(0.12, 0.12, 1.7, 1.4, -0.9, 0);
  g.add(fr.build(D));
  for (const [x, z, ax] of [[-1.1, -0.95, 'x'], [-1.1, 0.95, 'x'], [1.1, -0.95, 'x'], [1.1, 0.95, 'x']]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 14, 1, true), M(0x222222, { side: THREE.DoubleSide })); t.rotation.z = Math.PI / 2; t.rotation.y = (x * z > 0 ? 0.6 : -0.6); t.position.set(x, -0.3, z); g.add(t); }
  for (const x of [-0.5, 0.5]) g.add(cyl(0.2, 0.35, M(0x222222), x, 0.1, 0));
  for (const sz of [-0.5, 0.5]) { const a = new THREE.Group(); a.position.set(1.6, -0.5, sz); a.add(strutMesh(V3(0, 0, 0), V3(0.6, 0.2, 0), 0.07, S)); a.add(strutMesh(V3(0.6, 0.2, 0), V3(1.0, -0.2, 0), 0.06, S)); a.add(box(0.2, 0.15, 0.25, D, 1.05, -0.3, 0)); g.add(a); }
  for (const sz of [-0.6, 0.6]) g.add(hcyl(0.14, 0.2, M(0xfffbe0, { emissive: 0xfff2b0, emissiveIntensity: 3 }), 1.55, 0.2, sz));
  g.add(box(0.3, 0.3, 0.3, M(0x111111), 1.5, 0.6, 0));
  g.add(sph(0.12, M(0x333333), 1.66, 0.6, 0));
  return g;
}
export function buildTMS() {
  const g = grp('rov'), Y = M(0xf1c40f);
  g.add(lathe([[0, 0], [1.4, 0], [1.4, 2.2], [1.0, 2.6], [0.2, 2.8]], M(0x34495e, { metalness: 0.4 }), 12));
  g.add(hcyl(0.9, 1.4, Y, 0, 1.4, 0, 'z'));
  return g;
}

// ------------------------------------------------------------------ FIXED WELLHEAD PLATFORM (jacket) for jack-up
export function wellheadPlatform(seabed, wellX, deckY = 18) {
  const G = new THREE.Group(), W = M(0xe5e7e9, { metalness: 0.4 }), Y = YEL();
  const cx = wellX + 7, hw = 9, hd = 9;
  const J = new Lattice(); const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const at = (y, sx, sz) => { const t = (deckY - 2 - y) / (deckY - 2 - seabed); const sp = 1 + t * 0.35; return V3(cx + sx * hw * sp, y, sz * hd * sp); };
  for (const [sx, sz] of legs) J.add(at(seabed, sx, sz), at(deckY - 2, sx, sz), 0.75, new THREE.CylinderGeometry(1, 1, 1, 12));
  const levels = [seabed + 2, seabed * 0.66, seabed * 0.33, -6, deckY - 6];
  for (let li = 0; li < levels.length; li++) {
    const y = levels[li];
    for (let i = 0; i < 4; i++) { const a = legs[i], b = legs[(i + 1) % 4]; J.add(at(y, ...a), at(y, ...b), 0.32); if (li < levels.length - 1) { J.add(at(y, ...a), at(levels[li + 1], ...b), 0.25); J.add(at(y, ...b), at(levels[li + 1], ...a), 0.25); } }
  }
  G.add(tag(J.build(Y), 'jacket'));
  const dk = grp('platformdeck');
  dk.add(boxUV(26, 1.0, 22, MAT.grating(), cx, deckY - 1.5, 0)); dk.add(boxUV(26, 0.4, 22, MAT.checker(), cx, deckY - 6.0, 0));
  for (const [sx, sz] of legs) dk.add(cyl(0.8, 6, W, cx + sx * hw, deckY - 4, sz * hd));
  dk.add(rectRail(cx - 13, -11, cx + 13, 11, deckY - 1.0, 1.1)); dk.add(rectRail(cx - 13, -11, cx + 13, 11, deckY - 5.8, 1.1));
  dk.add(rbox(6, 3.5, 4, 0.2, M(0xd0d3d4), cx + 8, deckY + 0.75, -7)); // control/MCC module
  dk.add(boxUV(0.3, 0.3, 20, M(0xc0392b), cx + 6, deckY + 1.5, 0)); // production header
  dk.add(stairs(V3(cx + 12, deckY - 5.8, -9), V3(cx + 12, deckY - 1, -4)));
  G.add(dk);
  // conductors in slots + christmas trees on completed wells
  const cg = grp('platformconductor');
  const slots = [];
  for (let i = -2; i <= 2; i++) slots.push([wellX, i * 2.5]);
  for (let i = -2; i <= 2; i++) slots.push([wellX + 3.5, i * 2.5]);
  for (const [x, z] of slots) {
    if (x === wellX && Math.abs(z) < 0.1) continue; // the slot jack-up is drilling (conductor drawn separately)
    cg.add(cyl(0.38, deckY - 2 - seabed, M(0x95a5a6, { metalness: 0.5 }), x, (deckY - 2 + seabed) / 2, z));
  }
  G.add(cg);
  for (const [x, z] of slots) if (!(x === wellX && Math.abs(z) < 0.1) && (x > wellX)) G.add(xmasTree(x, deckY - 1, z, Math.PI / 2));
  // boat landing & riser guard
  G.add(tag(boxUV(10, 0.4, 2, MAT.grating(), cx, 1.5, -hd * 1.02 - 1), 'platformdeck'));
  lbl(G, 'Fixed wellhead platform (jacket)', cx, deckY + 6, -10, 2.0);
  lbl(G, 'Christmas trees (producing wells)', wellX + 3.5, deckY + 3.5, -4, 1.4);
  G.userData.wellZ = 0;
  return G;
}
