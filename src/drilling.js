// Detailed drilling package: derrick, hoisting, rotating, pipe handling, drill floor
import * as THREE from 'three';
import { heaveCompensator } from './moonpool.js';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, flange, valve, pipeRun, strutMesh, Lattice, railing, rectRail, stairs, ladder, makeLabel, stripeTexture, approach, lerp, CYL6 } from './lib.js';

const STAND = 28;
const YEL = () => M(COL.yellow, { metalness: 0.35 });

// ------------------------------------------------------------------ individual models
export function topDrive(aux = false) {
  const g = grp(aux ? 'topdrive_aux' : 'topdrive');
  const C = aux ? M(0x2c7fb8, { metalness: 0.4 }) : M(0xd4471b, { metalness: 0.4, roughness: 0.45 });
  const S = MAT.steel(), D = MAT.dark(), CH = MAT.chrome();
  // saver sub, IBOPs, pipe handler
  g.add(lathe([[0.09, -0.1], [0.1, 0.4], [0.14, 0.45], [0.14, 0.9], [0.12, 1.0]], CH, 18));
  g.add(rbox(0.36, 0.38, 0.36, 0.05, D, 0, 1.15, 0)); g.add(hcyl(0.06, 0.3, D, 0.24, 1.15, 0));
  g.add(rbox(0.38, 0.38, 0.38, 0.05, M(COL.red), 0, 1.6, 0)); g.add(cyl(0.08, 0.3, YEL(), 0.25, 1.6, 0.15));
  g.add(torus(0.42, 0.09, S, 0, 2.0, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.add(rbox(0.9, 0.5, 0.5, 0.08, C, 0, 2.15, 0.45)); // torque wrench / backup
  // link tilt + bails + elevator
  for (const sx of [-0.5, 0.5]) { g.add(strutMesh(V3(sx, 2.3, 0), V3(sx * 0.9, -2.6, 0.05), 0.07, S)); g.add(strutMesh(V3(sx * 0.8, 2.0, -0.35), V3(sx * 0.9, 0.4, 0.15), 0.045, YEL())); }
  g.add(torus(0.4, 0.13, M(0x7f8c8d, { metalness: 0.7 }), 0, -2.75, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.add(rbox(0.3, 0.3, 0.5, 0.05, D, 0.45, -2.75, 0));
  // gearbox + motor housing
  g.add(lathe([[0.45, 0], [0.75, 0.1], [0.8, 0.5], [0.8, 1.0], [0.55, 1.2]], C, 28, 0, 2.3, 0));
  g.add(rbox(1.9, 1.5, 1.3, 0.2, C, 0, 4.2, 0));
  for (const sx of [-0.62, 0.62]) {
    g.add(lathe([[0.45, 0], [0.5, 0.05], [0.5, 1.5], [0.42, 1.6]], C, 24, sx, 4.9, 0.35));
    g.add(lathe([[0.36, 0], [0.38, 0.3], [0.2, 0.45], [0, 0.48]], D, 18, sx, 6.5, 0.35)); // blower cowl
    for (let f = 0; f < 5; f++) g.add(torus(0.51, 0.02, D, sx, 5.1 + f * 0.28, 0.35));
  }
  // gooseneck & washpipe
  g.add(cyl(0.12, 1.4, S, 0, 5.6, -0.2));
  g.add(pipeRun([V3(0, 6.2, -0.2), V3(0, 6.9, -0.2), V3(0, 7.2, -0.5), V3(0, 7.0, -0.85)], 0.11, S));
  // bail
  const bail = torus(0.65, 0.08, S, 0, 6.6, 0.3, Math.PI); g.add(bail);
  // guide dolly
  g.add(rbox(1.6, 3.2, 0.3, 0.05, D, 0, 4.0, -1.0));
  for (const sy of [2.7, 5.3]) for (const sx of [-0.6, 0.6]) g.add(hcyl(0.14, 0.2, M(0x111111), sx, sy, -1.25, 'z'));
  g.add(pipeRun([V3(0.9, 5.0, -0.3), V3(1.4, 5.5, -0.6), V3(1.5, 7.5, -1.2)], 0.09, M(0x111111))); // service loop
  return g;
}
export function travelingBlock() {
  const g = grp('travelblock'), Y = YEL(), D = MAT.dark(), S = MAT.steel();
  for (const sz of [-0.55, 0.55]) g.add(rbox(1.7, 2.6, 0.12, 0.25, Y, 0, 9.0, sz));
  for (let i = 0; i < 6; i++) g.add(hcyl(0.75, 0.12, M(0x2b2b2b, { metalness: 0.7 }), -0.6 + i * 0.24, 9.3, 0, 'x'));
  g.add(hcyl(0.15, 1.6, S, 0, 9.3, 0, 'x'));
  g.add(rbox(1.2, 0.7, 1.0, 0.15, Y, 0, 7.7, 0));
  g.add(lathe([[0.2, 0], [0.32, 0.2], [0.32, 1.0], [0.25, 1.2]], Y, 18, 0, 6.5, 0)); // hook body/spring
  const hk = torus(0.45, 0.14, S, 0, 6.3, 0, Math.PI * 1.4); hk.rotation.z = Math.PI * 0.8; g.add(hk);
  return g;
}
export function crownBlock(H, top) {
  const g = grp('crown'), D = MAT.dark(), Y = YEL();
  g.add(boxUV(top + 1.6, 0.4, top + 1.6, MAT.grating(), 0, H + 0.2, 0));
  g.add(rectRail(-(top + 1.6) / 2, -(top + 1.6) / 2, (top + 1.6) / 2, (top + 1.6) / 2, H + 0.4, 1.0));
  for (const sz of [-0.6, 0.6]) g.add(box(3.6, 1.6, 0.25, Y, 0, H + 1.2, sz));
  for (let i = 0; i < 7; i++) g.add(hcyl(0.95, 0.14, M(0x2b2b2b, { metalness: 0.7 }), -1.3 + i * 0.43, H + 1.2, 0, 'x'));
  g.add(hcyl(0.6, 0.15, M(0x2b2b2b), -2.4, H + 0.9, 0.0, 'x'));
  // gin pole
  g.add(strutMesh(V3(1.5, H + 0.4, -1.5), V3(0.5, H + 5, -0.6), 0.12, Y)); g.add(strutMesh(V3(-1.5, H + 0.4, -1.5), V3(0.5, H + 5, -0.6), 0.12, Y));
  g.add(sph(0.25, MAT.redLight(), 0, H + 5.3, -0.6)); g.add(sph(0.2, MAT.redLight(), top / 2 + 0.6, H + 0.8, top / 2 + 0.6));
  return g;
}
export function drawworks() {
  const g = grp('drawworks'), B = M(0x1f5f99, { metalness: 0.45 }), D = MAT.dark(), S = MAT.steel();
  g.add(box(6.4, 0.3, 3.0, D, 0, 0.15, 0));
  const drum = hcyl(1.0, 2.8, M(0xffffff, { map: TEX.drum, metalness: 0.7 }), 0, 1.9, 0); g.add(drum);
  for (const sx of [-1.5, 1.5]) { g.add(hcyl(1.35, 0.12, M(0x8d8d8d, { metalness: 0.8, roughness: 0.25 }), sx, 1.9, 0)); g.add(rbox(0.5, 0.8, 0.5, 0.05, M(COL.red), sx, 3.1, 0.7)); g.add(rbox(0.5, 0.8, 0.5, 0.05, M(COL.red), sx, 0.75, 0.9)); }
  g.add(rbox(1.2, 2.4, 2.6, 0.15, B, -2.4, 1.5, 0)); // gearbox
  for (const sz of [-0.7, 0.7]) { g.add(hcyl(0.6, 1.6, B, -3.9, 1.6, sz)); for (let f = 0; f < 7; f++) g.add(hcyl(0.64, 0.04, D, -4.6 + f * 0.22, 1.6, sz)); g.add(hcyl(0.45, 0.25, D, -4.85, 1.6, sz)); }
  g.add(box(0.06, 1.4, 2.8, MAT.grating(), 1.9, 2.2, 0));
  g.add(rbox(2.6, 0.2, 2.9, 0.06, B, 0, 3.2, -0.3));
  return g;
}
export function ironRoughneck() {
  const g = grp('roughneck'), G = M(0x2e8b57, { metalness: 0.4 }), D = MAT.dark(), S = MAT.steel();
  g.add(rbox(1.2, 1.6, 1.0, 0.1, G, 0, 0.8, 0));
  for (const sz of [-0.3, 0.3]) g.add(rbox(2.2, 0.25, 0.2, 0.05, G, 0.9, 1.5, sz));
  const head = new THREE.Group(); head.position.set(1.9, 1.3, 0); g.add(head);
  head.add(rbox(0.9, 0.5, 1.2, 0.08, G, 0, 0.5, 0)); // spinner
  for (const sz of [-0.35, 0.35]) for (const sx of [-0.25, 0.25]) head.add(cyl(0.12, 0.45, M(0x111111), sx, 0.5, sz));
  const tw = torus(0.38, 0.14, D, 0, -0.05, 0, Math.PI * 1.5); tw.rotation.x = Math.PI / 2; head.add(tw);
  const bw = torus(0.38, 0.14, D, 0, -0.45, 0, Math.PI * 1.5); bw.rotation.x = Math.PI / 2; head.add(bw);
  for (const sz of [-0.6, 0.6]) head.add(cyl(0.08, 0.6, YEL(), 0, -0.25, sz));
  head.add(lathe([[0.3, -1.3], [0.45, -1.0], [0.5, -0.75], [0.48, -0.75]], M(0x111111, { side: THREE.DoubleSide }), 16, 0, 0, 0)); // mud bucket
  return g;
}
function cyberChair(x, y, z, rot) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
  g.add(cyl(0.08, 0.5, MAT.dark(), 0, 0.25, 0)); g.add(rbox(0.6, 0.15, 0.6, 0.05, M(0x222222), 0, 0.55, 0)); g.add(rbox(0.6, 0.9, 0.15, 0.06, M(0x222222), 0, 1.0, -0.3));
  for (const sx of [-0.5, 0.5]) { g.add(rbox(0.3, 0.12, 0.7, 0.04, M(0x333333), sx, 0.75, 0.05)); g.add(cyl(0.05, 0.2, MAT.dark(), sx, 0.9, 0.2)); }
  const scr = box(0.8, 0.5, 0.03, MAT.screen(), 0, 1.4, 0.5); scr.rotation.x = -0.3; g.add(scr);
  for (const sx of [-0.65, 0.65]) { const s2 = box(0.5, 0.35, 0.03, MAT.screen(), sx, 1.35, 0.4); s2.rotation.y = -sx * 0.7; g.add(s2); }
  return g;
}
export function drillersCabin() {
  const g = grp('drillercabin'), W = M(0xeef1f3, { metalness: 0.3 });
  g.add(rbox(4.2, 0.2, 3.4, 0.05, W, 0, 0.1, 0)); g.add(rbox(4.2, 0.3, 3.4, 0.1, W, 0, 3.15, 0));
  g.add(box(4.2, 3.0, 0.15, W, 0, 1.6, -1.6)); g.add(box(0.15, 3.0, 3.4, W, -2.0, 1.6, 0));
  g.add(box(0.1, 2.0, 3.2, MAT.glass(), 2.05, 1.9, 0)); g.add(box(4.0, 2.0, 0.1, MAT.glass(), 0, 1.9, 1.65)); g.add(box(4.0, 0.1, 3.2, MAT.glass(), 0, 3.0, 0));
  for (const [x, z] of [[2.05, 1.65], [2.05, -1.6], [-2.0, 1.65]]) g.add(box(0.15, 3.0, 0.15, W, x, 1.6, z));
  g.add(box(4.2, 0.8, 0.12, W, 0, 0.5, 1.65)); g.add(box(0.12, 0.8, 3.4, W, 2.05, 0.5, 0));
  g.add(cyberChair(0.9, 0.2, 0.2, 0.6)); g.add(cyberChair(-0.8, 0.2, 0.0, 0.3));
  g.add(rbox(1.4, 0.6, 1.0, 0.1, M(0x95a5a6), 0, 3.6, -0.6));
  g.add(box(4.0, 0.08, 0.6, MAT.dark(), 0, 3.1, 2.0));
  return g;
}

// ------------------------------------------------------------------ the package
export class DrillPackage {
  constructor({ H = 50, base = 12, top = 7, subH = 10, stringBottomY = -200, bitDepth = 2500, setback = 20, aux = false, label = 'Top drive', cmc = false } = {}) {
    this.root = new THREE.Group();
    this.H = H; this.stringBottomY = stringBottomY;
    this.tdMin = 2.8; this.tdMax = H - 15; this.tdY = this.tdMin + 10; this.tdTarget = this.tdY;
    this.mode = 'idle'; this.phase = null; this.t = 0; this.attached = true; this.slips = false;
    this.rpm = 0; this.rn = 0; this.ra = 0; this.bitDepth = bitDepth; this.setback = setback; this.enabled = true;
    this.status = 'Idle – string suspended from top drive.'; this.aux = aux;
    const R = this.root, D = MAT.dark(), S = MAT.steel();

    // ---- drill floor with openings, railing, stairs
    const fl = grp('drillfloor');
    fl.add(boxUV(18, 0.6, 18, MAT.checker(), 0, -0.3, 0, 0.6));
    fl.add(rectRail(-9, -9, 9, 9, 0, 1.1));
    fl.add(stairs(V3(-8.4, 0, -6), V3(-8.4, -subH + 0.3, -6 + subH * 1.0)));
    fl.add(box(0.5, 0.1, 0.5, MAT.hazard(), 0, 0.02, 0));
    for (const [x, z] of [[-1.6, 1.4], [1.6, 1.6]]) { fl.add(cyl(0.3, 0.12, D, x, 0.03, z)); fl.add(cyl(0.22, 0.13, M(0x050505), x, 0.04, z)); } // mousehole & rathole
    // substructure
    const sub = new Lattice();
    for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8], [-8, 0], [8, 0]]) sub.add(V3(x, -0.6, z), V3(x, -subH, z), 0.4);
    for (let y = -subH; y < -1; y += 3.5) for (const [a, b] of [[[-8, -8], [8, -8]], [[8, -8], [8, 8]], [[8, 8], [-8, 8]], [[-8, 8], [-8, -8]]]) { sub.add(V3(a[0], y, a[1]), V3(b[0], y, b[1]), 0.15); sub.add(V3(a[0], y, a[1]), V3(b[0], Math.min(-0.6, y + 3.5), b[1]), 0.1); }
    fl.add(sub.build(M(COL.white, { metalness: 0.35 })));
    R.add(fl);

    // ---- derrick
    const der = grp('derrick'); const L = new Lattice(); const h0 = base / 2, h1 = top / 2;
    const cp = (h, sx, sz) => { const hw = h0 + (h1 - h0) * h / H; return V3(sx * hw, h, sz * hw); };
    const SQ = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (const [sx, sz] of SQ) L.add(cp(0, sx, sz), cp(H, sx, sz), 0.34, new THREE.CylinderGeometry(1, 1, 1, 8));
    for (let h = 0; h < H; h += 4.5) {
      const h2 = Math.min(H, h + 4.5);
      for (let i = 0; i < 4; i++) {
        const a = SQ[i], b = SQ[(i + 1) % 4];
        L.add(cp(h2, ...a), cp(h2, ...b), 0.13);
        if (!(i === 0 && h < 14)) { L.add(cp(h, ...a), cp(h2, ...b), 0.08); L.add(cp(h, ...b), cp(h2, ...a), 0.08); }
      }
    }
    der.add(L.build(M(aux ? 0xd8dbe0 : COL.white, { metalness: 0.45, roughness: 0.45 })));
    der.add(ladder(cp(0, -1, 1).x + 0.6, 0, cp(0, -1, 1).z - 0.6, H - 0.5, true, 'z'));
    for (let h = 9; h < H - 2; h += 9) der.add(box(1.6, 0.08, 1.6, MAT.grating(), cp(h, -1, 1).x + 1.0, h, cp(h, -1, 1).z - 1.0));
    for (let h = 8; h < H; h += 12) for (const [sx, sz] of SQ) { const p = cp(h, sx, sz); der.add(rbox(0.35, 0.25, 0.25, 0.04, MAT.lightOn(), p.x * 0.92, p.y, p.z * 0.92)); }
    // racking board with fingers
    const rbY = 26.5, rbHW = h0 + (h1 - h0) * rbY / H;
    der.add(boxUV(1.0, 0.15, 2 * rbHW, MAT.grating(), rbHW - 0.5 + 1.5, rbY, 0));
    for (let i = 0; i < 10; i++) der.add(box(2.6, 0.12, 0.12, YEL(), rbHW - 1.8, rbY, -4.9 + i * 0.6 - 0.3));
    der.add(railing([V3(rbHW + 1.5, rbY, -rbHW), V3(rbHW + 1.5, rbY, rbHW)]));
    R.add(der);
    this.fingerY = rbY;

    R.add(crownBlock(H, top)); if (cmc) R.add(heaveCompensator(H, top));
    R.add(tag(box(0.5, H - 8, 0.7, D, 0, (H - 8) / 2 + 1.5, -1.65), 'tdrail'));

    // ---- traveling equipment
    this.tdGroup = new THREE.Group(); R.add(this.tdGroup);
    this.tdGroup.add(travelingBlock()); this.tdGroup.add(topDrive(aux));
    const lab = makeLabel(label, 1.0); lab.position.set(2.0, 8.5, 0); this.tdGroup.add(lab);

    // ---- drilling lines
    this.lines = []; const lm = M(0x2b2b2b, { metalness: 0.7, roughness: 0.4 });
    for (const x of [-0.6, -0.36, -0.12, 0.12, 0.36, 0.6]) { const m = cyl(0.04, 1, lm, x, 0, 0); tag(m, 'drillline'); R.add(m); this.lines.push(m); }
    const dw = drawworks(); dw.position.set(-4.6, 0, -6.6); R.add(dw);
    R.add(tag(strutMesh(V3(-0.6, H + 0.5, 0), V3(-4.6, 2.9, -6.0), 0.045, lm), 'drillline'));
    const da = grp('deadline'); da.add(rbox(0.8, 1.0, 0.6, 0.06, M(COL.red), 4.6, 0.5, -6.8)); da.add(cyl(0.35, 0.5, D, 4.6, 1.2, -6.8)); R.add(da);
    R.add(tag(strutMesh(V3(0.6, H + 0.5, 0), V3(4.6, 1.4, -6.8), 0.045, lm), 'drillline'));
    R.add(tag(boxUV(1.4, 2.6, 2.8, MAT.grating(), -4.6, 1.3, -8.3), 'drawworks'));

    // ---- rotary table + power slips
    const rot = grp('rotary');
    rot.add(lathe([[0.3, 0], [1.4, 0], [1.4, 0.35], [0.8, 0.4], [0.4, 0.4]], D, 32));
    rot.add(lathe([[0.4, 0.4], [0.8, 0.4], [0.75, 0.45], [0.35, 0.45]], S, 32));
    R.add(rot);
    this.slipsMesh = new THREE.Group(); tag(this.slipsMesh, 'rotary');
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; this.slipsMesh.add(rbox(0.25, 0.5, 0.25, 0.05, M(0xbfa060, { metalness: 0.6 }), Math.cos(a) * 0.25, 0.65, Math.sin(a) * 0.25)); }
    this.slipsMesh.visible = false; this.slipsMesh.userData.dynamic = true; R.add(this.slipsMesh);

    // ---- iron roughneck on rail
    R.add(tag(boxUV(0.6, 0.15, 4.2, MAT.hazard(), -4.0, 0.08, 1.6), 'roughneck'));
    this.rnGroup = ironRoughneck(); R.add(this.rnGroup);

    // ---- driller's cabin
    const dc = drillersCabin(); dc.position.set(-6.7, 0, 6.2); dc.rotation.y = Math.PI / 2 + 0.4; R.add(dc);

    // ---- setback stands + racker
    const sm = M(0xffffff, { map: stripeTexture('#9aa3ad', '#555', '#9aa3ad', 0.03), metalness: 0.6 });
    this.standMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.1, STAND, 8), sm, 40); tag(this.standMesh, 'setback');
    const mtx = new THREE.Matrix4(); let k = 0; this.slots = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) { const p = V3(2.4 + c * 0.55, STAND / 2 + 0.1, -5.2 + r * 0.55); this.slots.push(p); mtx.makeTranslation(p.x, p.y, p.z); this.standMesh.setMatrixAt(k++, mtx); }
    R.add(this.standMesh);
    R.add(tag(boxUV(2.6, 0.08, 6.0, MAT.grating(), 3.2, 0.04, -2.6), 'setback'));
    const rk = grp('piperacker'); const RO = M(COL.orange, { metalness: 0.4 });
    rk.add(box(0.5, 0.3, 9, RO, 1.4, 0.15, -2)); rk.add(box(0.5, 0.3, 9, RO, 1.4, this.fingerY + 1.2, -2));
    rk.add(rbox(0.7, this.fingerY + 1, 0.7, 0.1, RO, 1.4, (this.fingerY + 1) / 2, -6.2));
    R.add(rk);
    this.rackArms = []; for (const ay of [2.0, this.fingerY - 0.5]) { const a = new THREE.Group(); a.position.set(1.4, ay, -6.2); a.userData.dynamic = true; tag(a, 'piperacker'); a.add(box(1, 0.3, 0.3, RO, 0.5, 0, 0)); a.add(rbox(0.3, 0.6, 0.5, 0.05, D, 1.0, 0, 0)); R.add(a); this.rackArms.push(a); }

    // ---- standpipe & manifold, rotary hose
    const sp = grp('standpipe');
    sp.add(cyl(0.12, 26, M(COL.red, { metalness: 0.5 }), -4.6, 13, -4.6));
    sp.add(pipeRun([V3(-4.6, 1.2, -4.6), V3(-6.5, 1.2, -4.6), V3(-6.5, 1.2, -3.0)], 0.12, M(COL.red, { metalness: 0.5 })));
    for (let i = 0; i < 3; i++) sp.add(valve(-5.4 - i * 0.6, 1.2, -4.6, 0.6, 'x', M(COL.red)));
    sp.add(cyl(0.18, 0.1, M(0xffffff), -5.0, 2.0, -4.4));
    R.add(sp);
    this.hoseMat = M(0x1a1a1a, { roughness: 0.8, metalness: 0.1 }); this.hose = null; this.hoseY = -999;

    // ---- catwalk machine through V-door
    const cw = grp('catwalk');
    const tr = strutMesh(V3(0, 0.2, 7.5), V3(0, -subH + 1.2, 26), 1, YEL(), new THREE.BoxGeometry(1.4, 1, 0.35)); cw.add(tr);
    cw.add(boxUV(2.4, 1.2, 18, M(COL.yellow, { metalness: 0.35 }), 0, -subH + 0.6, 26)); cw.add(strutMesh(V3(0, 0.6, 9), V3(0, -subH + 1.6, 27), 0.11, S));
    R.add(cw);

    // ---- floor tools: manual tongs, TIW valve, tugger winches, mud bucket
    const tg = grp('tongs');
    for (const sx of [-1.8, 1.8]) { tg.add(strutMesh(V3(sx, 1.1, -1.8), V3(sx * 0.5, H - 2, -1.0), 0.015, M(0x222222))); tg.add(rbox(1.3, 0.25, 0.3, 0.05, MAT.dark(), sx, 1.1, -1.8)); tg.add(torus(0.18, 0.07, MAT.dark(), sx + (sx > 0 ? -0.75 : 0.75), 1.1, -1.8, Math.PI * 1.4)); }
    R.add(tg);
    const sv = grp('safetyvalve'); sv.add(box(0.8, 1.0, 0.8, YEL(), 6.5, 0.5, 4.5)); sv.add(lathe([[0.12, 0], [0.17, 0.05], [0.17, 0.75], [0.12, 0.8]], M(COL.red), 16, 6.3, 1.0, 4.4)); sv.add(lathe([[0.12, 0], [0.17, 0.05], [0.17, 0.75], [0.12, 0.8]], M(0x2e86c1), 16, 6.7, 1.0, 4.6)); R.add(sv);
    const tw = grp('tugger'); for (const sx of [6.8, 7.8]) { tw.add(hcyl(0.35, 0.8, M(0x2e86c1), sx, 0.5, -8.2, 'z')); tw.add(box(0.8, 0.2, 1.2, MAT.dark(), sx, 0.1, -8.2)); } R.add(tw);

    // ---- drill string
    this.pipeTex = stripeTexture('#a4acb5', '#2f3439', '#e5e8eb', 0.06);
    const pg = new THREE.CylinderGeometry(0.14, 0.14, 1, 12, 1, true); pg.translate(0, -0.5, 0);
    this.pipe = tag(new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: this.pipeTex, metalness: 0.6, roughness: 0.35 })), 'drillpipe');
    R.add(this.pipe);

    this.update(0);
  }

  get busy() { return this.mode !== 'idle' && this.mode !== 'manual'; }
  setMode(m) {
    if (!this.enabled) return;
    this.mode = m; this.t = 0;
    if (m === 'drill') this.phase = this.attached ? 'drilling' : 'down';
    else if (m === 'tripout') this.phase = this.attached ? 'pull' : 'down';
    else if (m === 'tripin') this.phase = this.attached ? (this.tdY <= this.tdMin + 0.01 ? 'set' : 'lower') : 'up';
    else this.phase = null;
    if (m === 'idle') this.status = this.attached ? 'Stopped – string held by top drive.' : 'Stopped – string held in slips.';
  }
  setManual(norm) { if (!this.enabled) return; this.mode = 'manual'; this.tdTarget = lerp(this.tdMin, this.tdMax, norm); }
  get tdNorm() { return (this.tdY - this.tdMin) / (this.tdMax - this.tdMin); }
  moveTD(target, speed, dt) {
    const prev = this.tdY; this.tdY = approach(this.tdY, target, speed, dt);
    if (this.attached && !this.slips) this.bitDepth = Math.max(0, this.bitDepth - (this.tdY - prev));
    return this.tdY === target;
  }

  update(dt) {
    const s = this; s.t += dt; let rpmT = 0, raT = 0;
    if (s.mode === 'manual') {
      s.slips = false; if (!s.attached && s.tdY <= s.tdMin + 0.05) s.attached = true;
      s.moveTD(s.tdTarget, 5, dt); s.rn = approach(s.rn, 0, 1, dt);
      s.status = s.attached ? 'Manual: moving top drive with string (reaming / working pipe).' : 'Manual: moving top drive (empty elevator).';
    } else if (s.mode === 'drill') {
      switch (s.phase) {
        case 'down': s.slips = true; s.status = 'Lowering top drive to the stump.'; if (s.moveTD(s.tdMin, 4, dt)) { s.phase = 'latch'; s.t = 0; } break;
        case 'latch': if (s.t > 0.8) { s.attached = true; s.slips = false; s.phase = 'drilling'; } break;
        case 'drilling': rpmT = 120; s.slips = false; s.rn = approach(s.rn, 0, 1, dt);
          s.status = 'Drilling ahead: rotating 120 rpm, weight on bit applied, mud circulating.';
          if (s.moveTD(s.tdMin, 1.2, dt)) { s.phase = 'slips'; s.t = 0; } break;
        case 'slips': s.slips = true; s.rn = approach(s.rn, 1, 1, dt); s.status = 'Connection: stop rotation, set slips, iron roughneck breaks out the saver sub.';
          if (s.t > 2.2) { s.attached = false; s.phase = 'up'; } break;
        case 'up': s.rn = approach(s.rn, 0, 1, dt); raT = 1; s.status = 'Connection: top drive hoisted; pipe racker brings a new stand from the setback.';
          if (s.moveTD(s.tdMax, 5, dt)) { s.phase = 'pick'; s.t = 0; } break;
        case 'pick': raT = 1; if (s.t > 1.0) { s.setback = Math.max(0, s.setback - 1); s.attached = true; s.phase = 'makeup'; s.t = 0; } s.status = 'Racker places the stand in the elevator.'; break;
        case 'makeup': s.rn = approach(s.rn, 1, 1, dt); s.status = 'Iron roughneck spins in and torques the connection; pull slips.';
          if (s.t > 2.2) { s.slips = false; s.phase = 'drilling'; } break;
      }
    } else if (s.mode === 'tripout') {
      switch (s.phase) {
        case 'down': s.slips = true; s.rn = approach(s.rn, 0, 1, dt); s.status = 'Tripping out: lowering empty elevator to the stump.'; if (s.moveTD(s.tdMin, 5, dt)) { s.phase = 'latch'; s.t = 0; } break;
        case 'latch': s.status = 'Latch elevator onto the string.'; if (s.t > 0.8) { s.attached = true; s.slips = false; s.phase = 'pull'; } break;
        case 'pull':
          if (s.bitDepth < STAND) { s.mode = 'idle'; s.status = 'Bit at surface – trip out complete.'; break; }
          s.status = 'Tripping out: pulling one stand (watch hook load & trip tank).';
          if (s.moveTD(s.tdMax, 3.5, dt)) { s.phase = 'brk'; s.t = 0; } break;
        case 'brk': s.slips = true; raT = 1; s.rn = approach(s.rn, 1, 1, dt); s.status = 'Set slips, iron roughneck breaks out the stand; racker grips it.';
          if (s.t > 2.0) { s.attached = false; s.setback = Math.min(60, s.setback + 1); s.phase = 'rack'; s.t = 0; } break;
        case 'rack': s.rn = approach(s.rn, 0, 1, dt); s.status = 'Stand racked back in the setback & fingerboard.'; if (s.t > 0.8) s.phase = 'down'; break;
      }
    } else if (s.mode === 'tripin') {
      switch (s.phase) {
        case 'up': s.slips = true; s.rn = approach(s.rn, 0, 1, dt); raT = 1; s.status = 'Tripping in: hoisting empty elevator; racker brings next stand.';
          if (s.moveTD(s.tdMax, 5, dt)) { if (s.setback <= 0) { s.mode = 'idle'; s.status = 'No stands left in the derrick.'; break; } s.phase = 'pick'; s.t = 0; } break;
        case 'pick': raT = 1; s.status = 'Racker places the stand in the elevator.'; if (s.t > 1.0) { s.setback--; s.attached = true; s.phase = 'mu'; s.t = 0; } break;
        case 'mu': s.rn = approach(s.rn, 1, 1, dt); s.status = 'Iron roughneck makes up the stand; pull slips.'; if (s.t > 2.0) { s.slips = false; s.phase = 'lower'; } break;
        case 'lower': s.rn = approach(s.rn, 0, 1, dt); s.status = 'Tripping in: running the stand into the hole.'; if (s.moveTD(s.tdMin, 3.5, dt)) { s.phase = 'set'; s.t = 0; } break;
        case 'set': s.slips = true; s.status = 'Set slips, release elevator.'; if (s.t > 0.8) { s.attached = false; s.phase = 'up'; } break;
      }
    } else { s.rn = approach(s.rn, 0, 1, dt); }
    s.rpm = approach(s.rpm, rpmT, 80, dt); s.ra = approach(s.ra, raT, 0.8, dt);
    this.applyVisuals(dt);
  }

  applyVisuals(dt) {
    const s = this, H = s.H;
    s.tdGroup.position.y = s.tdY;
    const blockTop = s.tdY + 9.3, crownB = H + 1.2;
    for (const l of s.lines) { l.position.y = (blockTop + crownB) / 2; l.scale.y = Math.max(0.1, crownB - blockTop); }
    const top = s.attached ? s.tdY : s.tdMin;
    s.pipe.position.y = top; const len = top - Math.max(s.stringBottomY, -s.bitDepth); s.pipe.scale.y = len;
    s.pipeTex.repeat.set(1, len / 9.5);
    s.pipe.rotation.y += s.rpm / 60 * Math.PI * 2 * dt;
    s.slipsMesh.visible = s.slips;
    s.rnGroup.position.set(lerp(-5.8, -1.9, s.rn), 0, lerp(2.6, 0, s.rn));
    s.standMesh.count = Math.min(40, s.setback);
    // racker arms swing between setback and well center
    const slot = s.slots[Math.min(39, Math.max(0, s.setback))] || s.slots[0];
    const tgt = V3(lerp(slot.x, 0, s.ra), 0, lerp(slot.z, 0, s.ra));
    for (const a of s.rackArms) { const dx = tgt.x - a.position.x, dz = tgt.z - a.position.z; a.rotation.y = -Math.atan2(dz, dx); a.scale.x = Math.hypot(dx, dz) - 0.1; }
    if (Math.abs(s.tdY - s.hoseY) > 0.08) {
      s.hoseY = s.tdY;
      const a = V3(-4.6, 26, -4.6), b = V3(0, s.tdY + 7.0, -0.85);
      const mid = V3().addVectors(a, b).multiplyScalar(0.5); mid.y = Math.min(a.y, b.y) - 6; mid.x -= 1;
      const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 20, 0.1, 6, false);
      if (!s.hose) { s.hose = tag(new THREE.Mesh(g, s.hoseMat), 'rotaryhose'); s.hose.castShadow = true; s.root.add(s.hose); } else { s.hose.geometry.dispose(); s.hose.geometry = g; }
    }
  }
  get hookLoad() { let hl = 35; if (this.attached && !this.slips) hl += this.bitDepth * 0.029 - (this.mode === 'drill' && this.phase === 'drilling' ? 15 : 0); return hl; }
}
