// Tool gallery: downhole tools, handling tools, well-control and wellhead components on display pedestals
import * as THREE from 'three';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, flange, valve, pipeRun, strutMesh, Lattice, railing, rectRail, stairs, lbl } from './lib.js';
import { xmasTree } from './equipment.js';

const DS = THREE.DoubleSide;
const STEEL = () => M(0xa9b1b9, { metalness: 0.8, roughness: 0.3 });
const DARK = () => M(0x3b4148, { metalness: 0.7, roughness: 0.4 });
const PAINT = (c) => M(c, { metalness: 0.4, roughness: 0.5 });
const CUT = (c) => M(c, { metalness: 0.5, roughness: 0.45, side: DS });
function threads(g, r0, r1, y0, y1, n, mat) { for (let i = 0; i < n; i++) { const t = i / (n - 1); const tr = torus(r0 + (r1 - r0) * t, 0.012, mat, 0, y0 + (y1 - y0) * t, 0, Math.PI * 2, 20); tr.rotation.x = Math.PI / 2; g.add(tr); } }
const horiz = (g) => { g.rotation.z = Math.PI / 2; return g; };

// ---------------------------------------------------------------- BITS
function pdcBit() {
  const g = grp('pdcbit'), B = M(0x4a4f55, { metalness: 0.6, roughness: 0.45 });
  g.add(lathe([[0.18, 0.95], [0.26, 0.55], [0.36, 0.55], [0.36, 0.25], [0.5, 0.2], [0.6, 0.05], [0.62, -0.1], [0.5, -0.3], [0.2, -0.42], [0, -0.45]], B, 40));
  threads(g, 0.26, 0.18, 0.58, 0.92, 8, STEEL());
  const C = M(0x1b1b1b, { metalness: 0.9, roughness: 0.2 }), dia = M(0xe8e8f0, { metalness: 1, roughness: 0.05 });
  for (let b = 0; b < 6; b++) {
    const a = b / 6 * Math.PI * 2; const bl = new THREE.Group(); bl.rotation.y = a; g.add(bl);
    bl.add(rbox(0.6, 0.45, 0.13, 0.04, B, 0.35, -0.15, 0)); bl.add(box(0.1, 0.5, 0.15, B, 0.64, 0.05, 0));
    for (let c = 0; c < 5; c++) { const cx = 0.08 + c * 0.12, cy = -0.38 + Math.pow(c / 4, 2) * 0.25 + (c === 4 ? 0.05 : 0); const cu = hcyl(0.05, 0.06, C, cx, cy, 0.09, 'z'); bl.add(cu); bl.add(hcyl(0.045, 0.012, dia, cx, cy, 0.125, 'z')); }
    bl.add(cyl(0.035, 0.08, DARK(), 0.3, -0.35, -0.12)); // nozzle
  }
  return g;
}
function triconeBit() {
  const g = grp('tricone'), B = M(0x5c6168, { metalness: 0.6 });
  g.add(lathe([[0.18, 1.0], [0.26, 0.6], [0.4, 0.6], [0.45, 0.35], [0.3, 0.2]], B, 32));
  threads(g, 0.26, 0.18, 0.62, 0.95, 8, STEEL());
  const T = M(0xd0d0d0, { metalness: 0.9, roughness: 0.2 });
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2; const leg = new THREE.Group(); leg.rotation.y = a; g.add(leg);
    leg.add(rbox(0.3, 0.6, 0.35, 0.06, B, 0.38, 0.05, 0));
    const cn = new THREE.Group(); cn.position.set(0.28, -0.2, 0); cn.rotation.z = -0.95; leg.add(cn);
    cn.add(lathe([[0.32, 0], [0.3, 0.12], [0.22, 0.3], [0.12, 0.42], [0, 0.48]], M(0x6d6f73, { metalness: 0.7 }), 24));
    for (const [r, y, n] of [[0.31, 0.05, 14], [0.24, 0.26, 10], [0.13, 0.4, 6]]) for (let k = 0; k < n; k++) { const b = k / n * Math.PI * 2; const t = cone(0.035, 0.0, 0.08, T, Math.cos(b) * r, y, Math.sin(b) * r, 8); t.rotation.z = -Math.cos(b) * 1.2; t.rotation.x = Math.sin(b) * 1.2; cn.add(t); }
    leg.add(cyl(0.04, 0.12, DARK(), 0.15, -0.05, 0.25));
  }
  return g;
}
// ---------------------------------------------------------------- BHA (built vertically, displayed horizontally)
function lobed(r, h, lobes, twist, mat) {
  const geo = new THREE.CylinderGeometry(r, r, h, 72, 60, false); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(z, x); const rr = Math.hypot(x, z); if (rr < 1e-4) continue; const k = 1 + 0.2 * Math.cos(lobes * th + y * twist); p.setX(i, x * k); p.setZ(i, z * k); }
  geo.computeVertexNormals(); return new THREE.Mesh(geo, mat);
}
function mudMotor() {
  const g = grp('mudmotor'), H = M(0x6b4f2a, { metalness: 0.5, side: DS }), S = STEEL();
  g.add(lathe([[0.32, 7.6], [0.32, 7.0], [0.4, 6.9], [0.4, 6.4]], DARK(), 28)); threads(g, 0.32, 0.26, 7.65, 7.95, 6, S); g.add(cone(0.32, 0.26, 0.35, DARK(), 0, 7.8, 0));
  g.add(lathe([[0.4, 3.0], [0.4, 6.4]], H, 32, 0, 0, 0, Math.PI * 0.375, Math.PI * 1.25)); // stator housing, cut away
  g.add(lathe([[0.33, 3.0], [0.33, 6.4]], M(0x222222, { roughness: 0.9, side: DS }), 32, 0, 0, 0, Math.PI * 0.375, Math.PI * 1.25)); // elastomer
  const rotor = lobed(0.24, 3.3, 5, 3.2, M(0xd9dee3, { metalness: 0.95, roughness: 0.12 })); rotor.position.y = 4.7; g.add(rotor);
  g.add(lathe([[0.4, 1.8], [0.4, 3.0]], M(0x7f8c8d, { metalness: 0.6 }), 28)); // transmission
  const bent = new THREE.Group(); bent.position.y = 1.8; bent.rotation.z = 0.07; g.add(bent); // bent housing
  bent.add(lathe([[0.42, -1.4], [0.42, 0]], M(0x7f8c8d, { metalness: 0.6 }), 28));
  bent.add(lathe([[0.3, -2.2], [0.36, -1.4]], DARK(), 28));
  bent.add(tag(pdcBitSmall(), 'pdcbit')); bent.children[bent.children.length - 1].position.y = -2.55;
  for (const y of [1.6]) g.add(torus(0.43, 0.04, M(0xf1c40f), 0, y, 0));
  return g;
}
function pdcBitSmall() { const b = pdcBit(); b.scale.setScalar(0.55); b.rotation.x = 0; return b; }
function rss() {
  const g = grp('rss'), C = M(0x34495e, { metalness: 0.6 });
  g.add(lathe([[0.36, 0], [0.38, 0.1], [0.38, 6.0], [0.33, 6.1]], C, 32)); threads(g, 0.3, 0.24, 6.1, 6.4, 6, STEEL());
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.add(rbox(0.16, 0.6, 0.3, 0.04, M(0xe67e22), Math.cos(a) * 0.4, 1.2, Math.sin(a) * 0.4)); }
  g.add(torus(0.39, 0.03, M(0xf1c40f), 0, 2.2, 0)); g.add(box(0.05, 1.2, 0.18, M(0x2c3e50), 0.38, 3.5, 0));
  const b = pdcBit(); b.scale.setScalar(0.6); b.position.y = -0.35; g.add(b);
  return g;
}
function mwd() {
  const g = grp('mwd'), C = M(0x6c7a89, { metalness: 0.7 });
  g.add(lathe([[0.36, 0], [0.38, 0.1], [0.38, 7.0], [0.33, 7.1]], C, 32)); threads(g, 0.3, 0.24, 7.1, 7.4, 6, STEEL());
  for (const y of [1.2, 1.5, 4.8]) g.add(torus(0.39, 0.04, M(0x1abc9c), 0, y, 0));
  for (let i = 0; i < 4; i++) g.add(box(0.06, 0.4, 0.16, M(0x111111), 0.37 * Math.cos(i * 1.57), 3.0, 0.37 * Math.sin(i * 1.57)));
  g.add(box(0.06, 0.8, 0.22, M(0x2c3e50), -0.38, 5.8, 0));
  return g;
}
function stabilizer() {
  const g = grp('stabilizer'), C = M(0x7f8c8d, { metalness: 0.7 });
  g.add(lathe([[0.3, 0], [0.32, 0.1], [0.32, 2.4], [0.28, 2.5]], C, 28)); threads(g, 0.26, 0.2, 2.5, 2.8, 6, STEEL());
  const B = M(0x95a5a6, { metalness: 0.8 });
  for (let b = 0; b < 3; b++) for (let k = 0; k < 12; k++) { const t = k / 11; const a = b / 3 * Math.PI * 2 + t * 1.2; const bl = rbox(0.14, 0.13, 0.22, 0.03, B, Math.cos(a) * 0.4, 0.6 + t * 1.2, Math.sin(a) * 0.4); bl.rotation.y = -a; g.add(bl); }
  for (let b = 0; b < 3; b++) for (let k = 0; k < 6; k++) { const t = k / 5; const a = b / 3 * Math.PI * 2 + t * 1.2; g.add(sph(0.03, M(0xeeeeee, { metalness: 1, roughness: 0.1 }), Math.cos(a) * 0.48, 0.65 + t * 1.1, Math.sin(a) * 0.48)); }
  return g;
}
function collar() {
  const g = grp('collar'), C = M(0x55606b, { metalness: 0.75 });
  g.add(lathe([[0.36, 0], [0.38, 0.1], [0.38, 8.0], [0.33, 8.1]], C, 32)); threads(g, 0.3, 0.24, 8.1, 8.4, 6, STEEL());
  const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200; const a = t * Math.PI * 2 * 9; pts.push(V3(Math.cos(a) * 0.38, 1 + t * 6, Math.sin(a) * 0.38)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.04, 6), M(0x22262a)));
  g.add(box(0.05, 0.5, 0.25, M(0x22262a), 0.37, 7.4, 0)); // elevator recess
  return g;
}
function jar() {
  const g = grp('jar'), C = M(0x2c3e50, { metalness: 0.6 });
  g.add(lathe([[0.34, 0], [0.36, 0.1], [0.36, 3.2], [0.36, 3.3]], C, 28));
  g.add(lathe([[0.25, 3.3], [0.25, 4.2]], MAT.chrome(), 28)); // mandrel stroke
  g.add(lathe([[0.36, 4.2], [0.36, 7.0], [0.31, 7.1]], C, 28)); threads(g, 0.28, 0.22, 7.1, 7.4, 6, STEEL());
  g.add(torus(0.37, 0.04, M(0xe74c3c), 0, 6.5, 0)); g.add(torus(0.37, 0.04, M(0xe74c3c), 0, 0.5, 0));
  return g;
}
function hwdp() {
  const g = grp('hwdp'), C = M(0x8c959e, { metalness: 0.75 }), TJ = M(0x6b737b, { metalness: 0.8 });
  g.add(lathe([[0.2, 0.4], [0.2, 4.0], [0.3, 4.1], [0.3, 4.9], [0.2, 5.0], [0.2, 8.6]], C, 28));
  g.add(lathe([[0.3, -0.5], [0.32, -0.4], [0.32, 0.4], [0.2, 0.5]], TJ, 28)); g.add(lathe([[0.2, 8.5], [0.32, 8.6], [0.32, 9.4], [0.26, 9.5]], TJ, 28));
  threads(g, 0.26, 0.2, 9.5, 9.85, 6, STEEL());
  for (const y of [0, 9.0, 4.5]) for (let k = 0; k < 3; k++) g.add(torus(y === 4.5 ? 0.31 : 0.33, 0.015, M(0xcfd6dc, { metalness: 1, roughness: 0.15 }), 0, y - 0.15 + k * 0.15, 0));
  return g;
}
function pipeJoint() {
  const g = grp('pipejoint'), C = M(0xaab4bd, { metalness: 0.75, roughness: 0.32 }), TJ = M(0x7a838c, { metalness: 0.8 });
  g.add(lathe([[0.12, 0.6], [0.15, 0.7], [0.15, 8.5], [0.12, 8.6]], C, 24));
  g.add(lathe([[0.2, -0.4], [0.22, -0.35], [0.22, 0.4], [0.15, 0.7]], TJ, 24)); g.add(lathe([[0.15, 8.6], [0.22, 8.8], [0.22, 9.4], [0.19, 9.45]], TJ, 24));
  g.add(lathe([[0.19, 9.45], [0.14, 9.85]], STEEL(), 24)); threads(g, 0.185, 0.145, 9.48, 9.82, 9, STEEL());
  g.add(lathe([[0.2, -0.4], [0.15, -0.4], [0.12, 0.0]], M(0x111111, { side: DS }), 24)); // box end bore
  return g;
}
// ---------------------------------------------------------------- CASING & CEMENTING
function casingString() {
  const g = grp('casing'), C = M(0x7d8a96, { metalness: 0.7 }), CP = M(0x5d6d7e, { metalness: 0.7 });
  g.add(lathe([[0.42, 1.0], [0.42, 6.5]], C, 32)); g.add(lathe([[0.47, 6.5], [0.47, 7.1]], CP, 32)); g.add(lathe([[0.42, 7.1], [0.42, 9.5]], C, 32));
  const fs = grp('floatshoe'); fs.add(lathe([[0, 0], [0.25, 0.08], [0.42, 0.35], [0.47, 0.5], [0.47, 1.0]], M(0xe67e22, { metalness: 0.2 }), 32)); fs.add(cyl(0.1, 0.1, M(0x111111), 0, 0.03, 0)); g.add(fs);
  const fc = grp('floatshoe'); fc.add(lathe([[0.47, 3.4], [0.47, 3.9]], M(0xe67e22), 32)); g.add(fc);
  const ce = grp('centralizer'); const S = M(0xcfd6dc, { metalness: 0.9, roughness: 0.25 });
  for (const yc of [2.2, 5.0, 8.2]) { ce.add(torus(0.45, 0.04, S, 0, yc - 0.6, 0)); ce.add(torus(0.45, 0.04, S, 0, yc + 0.6, 0)); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const pts = [0, 0.25, 0.5, 0.75, 1].map(t => V3(Math.cos(a) * (0.45 + Math.sin(t * Math.PI) * 0.2), yc - 0.6 + t * 1.2, Math.sin(a) * (0.45 + Math.sin(t * Math.PI) * 0.2))); ce.add(pipeRun(pts, 0.03, S, 4)); } }
  ce.children.forEach(c => { if (c.rotation) c.rotation.x = c.geometry && c.geometry.type === 'TorusGeometry' ? Math.PI / 2 : c.rotation.x; });
  g.add(ce);
  return g;
}
function cementPlugs() {
  const g = new THREE.Group();
  for (const [c, x, key] of [[0xc0392b, -0.7, 'cementplugs'], [0x111111, 0.7, 'cementplugs']]) {
    const p = grp(key); const R = M(c, { metalness: 0, roughness: 0.8 });
    p.add(cyl(0.22, 1.1, M(0x95a5a6), 0, 0.55, 0)); for (let i = 0; i < 5; i++) p.add(lathe([[0.22, 0], [0.44, 0.12], [0.42, 0.18], [0.22, 0.12]], R, 24, 0, 0.1 + i * 0.2, 0));
    if (c !== 0x111111) p.add(cyl(0.12, 0.05, M(0xbdc3c7), 0, 1.12, 0));
    p.position.x = x; g.add(p);
  }
  return g;
}
// ---------------------------------------------------------------- HANDLING TOOLS
function elevator() {
  const g = grp('elevator'), Y = M(0xb7950b, { metalness: 0.6 });
  const body = torus(0.55, 0.22, Y, 0, 0, 0, Math.PI * 1.75, 32); body.rotation.x = Math.PI / 2; g.add(body);
  const door = torus(0.55, 0.2, M(0x9a7d0a, { metalness: 0.6 }), 0, 0, 0, Math.PI * 0.25, 10); door.rotation.x = Math.PI / 2; door.rotation.z = -Math.PI * 0.25; g.add(door);
  for (const sx of [-1, 1]) { g.add(rbox(0.25, 0.5, 0.3, 0.05, Y, sx * 0.85, 0.15, 0)); g.add(hcyl(0.1, 0.4, STEEL(), sx * 0.95, 0.3, 0)); g.add(strutMesh(V3(sx * 0.95, 0.3, 0), V3(sx * 0.8, 3.0, 0), 0.07, STEEL())); }
  g.add(cyl(0.05, 0.3, DARK(), 0.4, 0.3, 0.45)); g.add(box(0.25, 0.1, 0.1, M(COL.red), 0.4, 0.45, 0.45));
  return g;
}
function slips() {
  const g = grp('slips'), S = M(0x9c8a5a, { metalness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2; const seg = lathe([[0.18, 0], [0.36, 0], [0.42, 0.9], [0.18, 0.9]], S, 12, 0, 0, 0, a + 0.08, Math.PI * 2 / 3 - 0.16); seg.material = M(0x9c8a5a, { metalness: 0.6, side: DS }); g.add(seg);
    for (let k = 0; k < 6; k++) g.add(box(0.03, 0.12, 0.08, M(0x222222), Math.cos(a + 1.05) * 0.18, 0.15 + k * 0.12, Math.sin(a + 1.05) * 0.18));
    const hd = strutMesh(V3(Math.cos(a + 1.05) * 0.42, 0.85, Math.sin(a + 1.05) * 0.42), V3(Math.cos(a + 1.05) * 0.75, 1.35, Math.sin(a + 1.05) * 0.75), 0.03, DARK()); g.add(hd);
  }
  return g;
}
function tongs() {
  const g = grp('tongs'), D = M(0x3d4349, { metalness: 0.6 });
  const jaw = torus(0.35, 0.1, D, 0, 0, 0, Math.PI * 1.3, 24); jaw.rotation.x = Math.PI / 2; g.add(jaw);
  g.add(rbox(2.6, 0.18, 0.22, 0.05, D, 1.5, 0, 0)); g.add(rbox(0.35, 0.3, 0.3, 0.05, M(COL.red), 0.3, 0, -0.3));
  g.add(torus(0.12, 0.03, STEEL(), 2.9, 0, 0)); g.add(strutMesh(V3(1.5, 0, 0), V3(1.5, 3, 0), 0.015, M(0x111111)));
  return g;
}
function safetyValves() {
  const g = new THREE.Group();
  const tiw = grp('safetyvalve'); tiw.add(lathe([[0.15, 0], [0.22, 0.05], [0.22, 1.3], [0.15, 1.35]], M(COL.red, { metalness: 0.5 }), 24)); tiw.add(hcyl(0.07, 0.3, STEEL(), 0.25, 0.7, 0)); tiw.add(box(0.06, 0.06, 0.4, DARK(), 0.4, 0.7, 0)); threads(tiw, 0.15, 0.12, 1.35, 1.6, 5, STEEL()); tiw.position.x = -0.5; g.add(tiw);
  const ib = grp('safetyvalve'); ib.add(lathe([[0.15, 0], [0.2, 0.05], [0.2, 1.1], [0.15, 1.15]], M(0x2e86c1, { metalness: 0.5 }), 24)); ib.add(cone(0.12, 0.0, 0.25, M(0xecf0f1), 0, -0.12, 0)); threads(ib, 0.15, 0.12, 1.15, 1.4, 5, STEEL()); ib.position.x = 0.5; g.add(ib);
  return g;
}
function ramBlocks() {
  const g = grp('ramblocks'), B = M(0x7f8c8d, { metalness: 0.7 }), R = M(0x111111, { roughness: 0.9 });
  for (const sx of [-1, 1]) { // pipe ram pair
    const b = new THREE.Group(); b.position.set(sx * 0.65, 0.25, -0.7); b.rotation.y = sx > 0 ? Math.PI : 0; g.add(b);
    b.add(rbox(0.9, 0.5, 1.0, 0.06, B, -0.2, 0, 0)); b.add(box(0.12, 0.5, 1.0, R, 0.3, 0, 0)); b.add(hcyl(0.18, 0.15, M(0x222222), 0.33, 0, 0));
  }
  for (const sx of [-1, 1]) { // shear rams with blades
    const b = new THREE.Group(); b.position.set(sx * 0.6, 0.25, 0.8); b.rotation.y = sx > 0 ? Math.PI : 0; g.add(b);
    b.add(rbox(0.9, 0.5, 1.0, 0.06, M(0xa93226, { metalness: 0.6 }), -0.2, 0, 0));
    const bl = box(0.35, 0.08, 0.95, M(0xeaeded, { metalness: 1, roughness: 0.1 }), 0.35, sx > 0 ? 0.1 : -0.05, 0); bl.rotation.z = 0.3; b.add(bl);
  }
  return g;
}
function packer() {
  const g = grp('packer'), R = M(0x141414, { roughness: 0.95 });
  g.add(lathe([[0.45, 0], [1.0, 0], [1.05, 0.2], [0.9, 0.7], [0.45, 0.75]], R, 40));
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const f = rbox(0.12, 0.8, 0.5, 0.03, M(0x9aa3ad, { metalness: 0.8 }), Math.cos(a) * 0.7, 0.4, Math.sin(a) * 0.7); f.rotation.y = -a; g.add(f); }
  return g;
}
function overshot() {
  const g = grp('overshot'), C = M(0x5d6d7e, { metalness: 0.6, side: DS });
  g.add(lathe([[0.38, 0], [0.45, 0.1], [0.45, 2.6], [0.3, 2.8], [0.22, 3.0]], C, 32, 0, 0, 0, Math.PI * 0.3, Math.PI * 1.4));
  g.add(lathe([[0.3, 0.5], [0.36, 1.4]], M(0xd4ac0d, { metalness: 0.7, side: DS }), 32, 0, 0, 0, Math.PI * 0.3, Math.PI * 1.4));
  g.add(lathe([[0.15, -0.2], [0.15, 1.2], [0.1, 1.25]], M(0x7f8c8d, { metalness: 0.6 }), 20)); // fish
  g.add(cone(0.36, 0.45, 0.25, M(0x2c3e50), 0, -0.05, 0));
  return g;
}
function mudBalance() {
  const g = grp('mudbalance'), A = M(0xbdc3c7, { metalness: 0.8 });
  g.add(rbox(1.6, 0.1, 0.5, 0.03, M(0x2c3e50), 0, 0.05, 0)); g.add(cone(0.08, 0.1, 0.5, A, 0, 0.35, 0));
  g.add(box(2.2, 0.06, 0.06, A, 0.2, 0.62, 0)); g.add(cyl(0.18, 0.3, A, -0.85, 0.62, 0)); g.add(cyl(0.2, 0.04, A, -0.85, 0.79, 0));
  g.add(box(0.12, 0.12, 0.12, M(0xe74c3c), 0.6, 0.62, 0)); g.add(cyl(0.02, 0.2, M(0x3498db, { emissive: 0x3498db, emissiveIntensity: 0.5 }), 0.1, 0.68, 0));
  return g;
}
// ---------------------------------------------------------------- WELLHEAD & CASING PROGRAM
function wellheadCutaway() {
  const g = grp('wellheadcut'), P = Math.PI * 1.5;
  g.add(lathe([[0.9, 0], [0.9, 2.2], [1.0, 2.3], [1.0, 3.0], [0.8, 3.0], [0.8, 0]], CUT(0x7f8c8d), 40, 0, 0, 0, Math.PI * 0.25, P)); // 36" LP housing
  g.add(lathe([[0.6, 1.0], [0.6, 4.4], [0.68, 4.5], [0.68, 5.0], [0.5, 5.0], [0.5, 1.0]], CUT(0xa9b1b9), 40, 0, 0, 0, Math.PI * 0.25, P)); // HP housing
  const hangers = [[0.48, 0.42, 4.6, 0xe67e22], [0.4, 0.33, 4.1, 0x3498db], [0.32, 0.26, 3.6, 0x27ae60]];
  for (const [ro, ri, y, c] of hangers) { g.add(lathe([[ri, y - 0.4], [ro, y - 0.4], [ro, y], [ri, y]], CUT(c), 40, 0, 0, 0, Math.PI * 0.25, P)); g.add(lathe([[ri, -1.5], [ri + 0.03, -1.5], [ri + 0.03, y - 0.4], [ri, y - 0.4]], CUT(c), 40, 0, 0, 0, Math.PI * 0.25, P)); }
  g.add(lathe([[0.8, -1.5], [0.9, -1.5], [0.9, 0], [0.8, 0]], CUT(0x6c7a89), 40, 0, 0, 0, Math.PI * 0.25, P));
  g.add(lathe([[0.62, 4.98], [0.66, 4.98], [0.66, 5.02], [0.62, 5.02]], CUT(0x111111), 40, 0, 0, 0, Math.PI * 0.25, P));
  return g;
}
function casingProgram() {
  const g = grp('casingprogram'), P = Math.PI * 1.5, H = 12;
  // formation strata (half cylinder background)
  const strata = [[0, 2, 0xc8b27c], [2, 4.5, 0x9c8562], [4.5, 7, 0x7f7a6a], [7, 9.5, 0x8e735b], [9.5, 12, 0x5f5a50]];
  for (const [a, b, c] of strata) g.add(lathe([[2.2, H - b], [2.2, H - a]], M(c, { metalness: 0, roughness: 1, side: DS }), 32, 0, 0, 0, Math.PI * 0.5, Math.PI));
  const strings = [ // [outer r, depth bottom, color, cement color]
    [1.1, 2.5, 0x6c7a89], [0.85, 5.5, 0x7f8c8d], [0.62, 8.5, 0x95a5a6], [0.42, 11.0, 0xa9b1b9],
  ];
  strings.forEach(([r, bot, c], i) => {
    g.add(lathe([[r - 0.05, H - bot], [r, H - bot], [r, H], [r - 0.05, H]], CUT(c), 40, 0, 0, 0, Math.PI * 0.25, P));
    const cTop = i === 0 ? H : H - strings[i - 1][1] + 0.6; const rOut = (i === 0 ? r + 0.35 : strings[i - 1][0] - 0.05);
    g.add(lathe([[r, H - bot], [rOut, H - bot], [rOut, cTop], [r, cTop]], CUT(0xbfbfbf), 40, 0, 0, 0, Math.PI * 0.25, P));
    g.add(lathe([[r - 0.05, H - bot - 0.15], [r + 0.08, H - bot - 0.15], [r + 0.08, H - bot], [r - 0.05, H - bot]], CUT(0xe67e22), 40, 0, 0, 0, Math.PI * 0.25, P));
  });
  g.add(lathe([[0.3, 0], [0.32, 0], [0.32, H - 10.5], [0.3, H - 10.5]], CUT(0xc0392b), 40, 0, 0, 0, Math.PI * 0.25, P)); // liner
  g.add(lathe([[0.32, 0], [0.4, 0], [0.4, H - 11.0], [0.32, H - 10.5]], CUT(0xbfbfbf), 40, 0, 0, 0, Math.PI * 0.25, P));
  g.add(cyl(0.08, H + 0.5, M(0xd5d8dc, { metalness: 0.8 }), 0, H / 2 + 0.25, 0));
  return g;
}
function subseaTree() {
  const g = grp('subseatree'), Y = M(0xf1c40f, { metalness: 0.35 }), S = STEEL();
  const F = new Lattice(); for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) F.add(V3(x, 0, z), V3(x, 3.2, z), 0.1, new THREE.BoxGeometry(1, 1, 1));
  for (const y of [0.05, 3.15]) for (const [a, b] of [[[-1.6, -1.6], [1.6, -1.6]], [[1.6, -1.6], [1.6, 1.6]], [[1.6, 1.6], [-1.6, 1.6]], [[-1.6, 1.6], [-1.6, -1.6]]]) F.add(V3(a[0], y, a[1]), V3(b[0], y, b[1]), 0.08, new THREE.BoxGeometry(1, 1, 1));
  g.add(F.build(Y));
  g.add(lathe([[0.5, 0], [0.75, 0.1], [0.75, 0.8], [0.6, 0.9]], DARK(), 24)); g.add(rbox(1.1, 1.3, 1.1, 0.08, S, 0, 1.6, 0));
  for (const sx of [-1, 1]) g.add(valve(sx * 0.85, 1.6, 0, 0.9, 'x', M(COL.red), false));
  g.add(rbox(0.7, 0.9, 0.7, 0.08, M(0x2e86c1), 1.1, 2.3, 0.9)); g.add(pipeRun([V3(0.6, 1.6, 0), V3(1.1, 1.8, 0.9)], 0.1, S));
  g.add(boxUV(1.2, 0.9, 0.1, M(0xf4d03f), 0, 1.6, 1.62)); g.add(lathe([[0.4, 2.3], [0.4, 3.0], [0.2, 3.2]], M(0x5d6d7e), 20));
  return g;
}

// ---------------------------------------------------------------- GALLERY PLATFORM
export function buildGallery(x, z) {
  const R = new THREE.Group(); R.position.set(x, 0, z);
  const deckY = 14, W = 96, D = 44;
  const st = grp('gallerydeck');
  st.add(boxUV(W, 1.2, D, MAT.checker(), 0, deckY - 0.6, 0, 0.4));
  const J = new Lattice(); for (const sx of [-1, -1 / 3, 1 / 3, 1]) for (const sz of [-1, 1]) J.add(V3(sx * (W / 2 - 3), deckY - 1.2, sz * (D / 2 - 3)), V3(sx * (W / 2 - 3), -95, sz * (D / 2 - 3)), 0.9, new THREE.CylinderGeometry(1, 1, 1, 12));
  for (const y of [-60, -25, 4]) { J.add(V3(-W / 2 + 3, y, -D / 2 + 3), V3(W / 2 - 3, y, -D / 2 + 3), 0.35); J.add(V3(-W / 2 + 3, y, D / 2 - 3), V3(W / 2 - 3, y, D / 2 - 3), 0.35); for (const sx of [-1, -1 / 3, 1 / 3, 1]) J.add(V3(sx * (W / 2 - 3), y, -D / 2 + 3), V3(sx * (W / 2 - 3), y, D / 2 - 3), 0.35); }
  st.add(J.build(M(COL.yellow, { metalness: 0.35 })));
  st.add(rectRail(-W / 2, -D / 2, W / 2, D / 2, deckY, 1.1));
  // canopy roof frame
  const C = new Lattice(); for (const sx of [-1, -0.5, 0, 0.5, 1]) for (const sz of [-1, 1]) C.add(V3(sx * (W / 2 - 2), deckY, sz * (D / 2 - 2)), V3(sx * (W / 2 - 2), deckY + 12, sz * (D / 2 - 2)), 0.25);
  for (const sx of [-1, -0.5, 0, 0.5, 1]) C.add(V3(sx * (W / 2 - 2), deckY + 12, -D / 2 + 2), V3(sx * (W / 2 - 2), deckY + 12, D / 2 - 2), 0.2);
  st.add(C.build(M(0xffffff, { metalness: 0.4 })));
  R.add(st);
  lbl(R, 'TOOL GALLERY', 0, deckY + 16, 0, 9, { always: true, border: 'rgba(120,255,160,.9)' });
  const items = [];
  const put = (model, px, pz, { scale = 1, horizontal = false, h = 0.6, label, pw = 3.2, pd = 3.2, ry = 0 } = {}) => {
    const ped = grp('gallerydeck'); ped.add(rbox(pw, h, pd, 0.12, M(0x2c3e50, { metalness: 0.3 }), px, deckY + h / 2, pz)); ped.add(box(pw + 0.05, 0.06, pd + 0.05, M(0xf1c40f), px, deckY + h, pz)); R.add(ped);
    const holder = new THREE.Group(); holder.position.set(px, deckY + h, pz); R.add(holder);
    const inner = new THREE.Group(); inner.add(model);
    if (horizontal) model.rotation.z = Math.PI / 2;
    model.scale.multiplyScalar(scale);
    inner.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(inner); const c = bb.getCenter(new THREE.Vector3());
    model.position.x -= c.x; model.position.z -= c.z; model.position.y -= bb.min.y - (horizontal ? 0.55 : 0.02);
    inner.rotation.y = ry; holder.add(inner);
    if (horizontal) { const L = bb.max.x - bb.min.x; for (const k of [-1, 1]) { const sp = box(0.25, 0.55, 0.9, M(0x7f8c8d), k * (L / 2 - 0.7), 0.27, 0); inner.add(sp); } }
    const tall = bb.max.y - bb.min.y + (horizontal ? 0.55 : 0);
    if (label) lbl(R, label, px, deckY + h + tall + 0.4, pz, 0.6);
    items.push(holder); return holder;
  };
  // Row A – bits & BHA (z = -13)
  { const b = pdcBit(); b.rotation.x = Math.PI; put(grp(null, b), -40, -13, { scale: 1.6, label: 'PDC bit (cutting face up)' }); }
  { const b = triconeBit(); b.rotation.x = Math.PI; put(grp(null, b), -34, -13, { scale: 1.6, label: 'Roller-cone (tricone) bit' }); }
  put(mudMotor(), -26, -13, { horizontal: true, pw: 10, pd: 2.4, label: 'Mud motor (PDM) – cutaway', ry: 0 });
  put(rss(), -14, -13, { horizontal: true, pw: 8, pd: 2.4, label: 'Rotary steerable system' });
  put(mwd(), -3, -13, { horizontal: true, pw: 8.5, pd: 2.4, label: 'MWD / LWD tool' });
  put(stabilizer(), 6, -13, { scale: 1.2, label: 'Stabilizer' });
  put(collar(), 15, -13, { horizontal: true, pw: 9.5, pd: 2.4, label: 'Drill collar (spiral)' });
  put(jar(), 27, -13, { horizontal: true, pw: 8.5, pd: 2.4, label: 'Drilling jar' });
  put(hwdp(), 39, -13, { horizontal: true, pw: 11, pd: 2.4, label: 'Heavy-weight drill pipe' });
  // Row B – handling & well-control tools (z = 0)
  put(pipeJoint(), -36, 0, { horizontal: true, pw: 11, pd: 2.4, label: 'Drill pipe joint (box & pin)' });
  put(elevator(), -24, 0, { scale: 1.2, label: 'Side-door elevator' });
  put(slips(), -18, 0, { scale: 1.8, label: 'Rotary slips' });
  put(tongs(), -12, 0, { scale: 1.0, label: 'Manual tongs', pw: 4.2 });
  put(safetyValves(), -5, 0, { scale: 1.5, label: 'TIW valve & IBOP' });
  put(ramBlocks(), 1, 0, { scale: 1.4, label: 'BOP ram blocks (pipe & shear)' });
  put(packer(), 8, 0, { scale: 1.3, label: 'Annular packing element' });
  put(overshot(), 14, 0, { scale: 1.2, label: 'Overshot (fishing tool)' });
  put(mudBalance(), 20, 0, { scale: 1.2, label: 'Mud balance' });
  put(cementPlugs(), 26, 0, { scale: 1.5, label: 'Cement wiper plugs (bottom red, top black)' });
  put(casingString(), 34, 0, { scale: 1.0, label: 'Casing, float shoe & centralizers', pw: 3.2 });
  // Row C – wellhead & completion (z = +13)
  put(wellheadCutaway(), -30, 13, { scale: 1.2, label: 'Subsea wellhead – cutaway', pw: 4, pd: 4 });
  put(casingProgram(), -16, 13, { scale: 0.9, label: 'Casing program – cutaway', pw: 5, pd: 5 });
  put(subseaTree(), 0, 13, { scale: 1.2, label: 'Subsea Christmas tree', pw: 5, pd: 5 });
  put(xmasTree(0, 0, 0), 14, 13, { scale: 1.3, label: 'Surface Christmas tree' });
  const sign = grp('gallerydeck'); for (const [t, zz] of [['BITS & BOTTOM-HOLE ASSEMBLY', -17.5], ['PIPE HANDLING & WELL-CONTROL TOOLS', -4.5], ['CASING, WELLHEAD & COMPLETION', 8.5]]) lbl(R, t, -44, deckY + 0.3, zz, 1.3, { border: 'rgba(120,255,160,.9)' });
  R.userData.deckY = deckY;
  return R;
}
