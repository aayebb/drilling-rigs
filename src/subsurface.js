// Subsurface: geological cross-section, reservoir, wellbore cutaways (casing, cement, open hole), live drill string
import * as THREE from 'three';
import { V3, M, tag, grp, makeLabel, lerp, clamp } from './lib.js';

export const RADIAL_EXAG = 10; // wellbore diameters are exaggerated ×10 so they can be seen
const IN = 0.0254 * RADIAL_EXAG / 2; // inches of diameter → exaggerated radius (m)
const DS = THREE.DoubleSide;

// ---------------------------------------------------------------- trajectory
// traj: { kop, build (deg/30 m), inc (deg), td, az (radians, rotation of d about y), drop?: {at, rate, inc} }
export function trajectory(origin, dir, traj, step = 5) {
  const pts = [], inc = [], h = V3(dir.x, 0, dir.z).normalize();
  if (traj.az) h.applyAxisAngle(V3(0, 1, 0), traj.az);
  let p = origin.clone(), i = 0;
  for (let md = 0; md <= traj.td + 1e-6; md += step) {
    let a = 0;
    if (md > traj.kop) a = Math.min(traj.inc, (md - traj.kop) * traj.build / 30);
    if (traj.kop2 !== undefined && md > traj.kop2) a = Math.min(traj.inc2, traj.inc + (md - traj.kop2) * traj.build2 / 30);
    const r = THREE.MathUtils.degToRad(a);
    if (md > 0) p = p.clone().add(V3(h.x * Math.sin(r) * step, -Math.cos(r) * step, h.z * Math.sin(r) * step));
    pts.push(p); inc.push(a); i++;
  }
  return { pts, inc, step, td: traj.td, at(md) { const k = clamp(md / step, 0, pts.length - 1); const i0 = Math.floor(k), i1 = Math.min(pts.length - 1, i0 + 1); return V3().lerpVectors(pts[i0], pts[i1], k - i0); }, incAt(md) { return inc[clamp(Math.round(md / step), 0, inc.length - 1)]; } };
}

// half-cut (or full) sweep of a circle along a polyline, cut faces the viewer direction V
function sweep(path, md0, md1, r, V, cut = Math.PI / 2, seg = 20) {
  const s = path.step, i0 = clamp(Math.floor(md0 / s), 0, path.pts.length - 1), i1 = clamp(Math.ceil(md1 / s), 0, path.pts.length - 1);
  const P = []; for (let i = i0; i <= i1; i++) P.push(path.pts[i]);
  if (P.length < 2) return null;
  P[0] = path.at(md0); P[P.length - 1] = path.at(md1);
  const pos = [], nor = [], uv = [], idx = []; const T = V3(), B1 = V3(), B2 = V3(), d = V3();
  const a0 = cut, a1 = Math.PI * 2 - cut;
  for (let i = 0; i < P.length; i++) {
    T.subVectors(P[Math.min(P.length - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
    B1.copy(V).addScaledVector(T, -V.dot(T)); if (B1.lengthSq() < 1e-6) B1.set(0, 0, 1); B1.normalize(); B2.crossVectors(T, B1);
    for (let j = 0; j <= seg; j++) { const a = lerp(a0, a1, j / seg); d.copy(B1).multiplyScalar(Math.cos(a)).addScaledVector(B2, Math.sin(a)); pos.push(P[i].x + d.x * r, P[i].y + d.y * r, P[i].z + d.z * r); nor.push(d.x, d.y, d.z); uv.push(j / seg, i * s / 20); }
  }
  for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- formation textures
function hex(c) { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; }
let _s = 11; const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647;
const PAT = {
  clay: (x, y) => 0,
  shale: (x, y) => ((y % 9) < 1 && ((x + (y * 7) % 23) % 23) < 15 ? -40 : 0),
  sand: (x, y) => (((x * 7 + y * 13) % 17) === 0 || ((x * 11 + y * 5) % 23) === 0 ? -55 : 0),
  sandshale: (x, y) => ((Math.floor(y / 14) % 2) ? PAT.sand(x, y) : PAT.shale(x, y) - 18),
  limestone: (x, y) => ((y % 12) < 1 || ((x + (Math.floor(y / 12) % 2) * 12) % 24) < 1 ? -50 : 0),
  carbonate: (x, y) => ((y % 10) < 1 || ((x + (Math.floor(y / 10) % 2) * 9) % 18) < 1 ? -45 : (((x * 5 + y * 3) % 29) === 0 ? -40 : 0)),
  salt: (x, y) => ((((x + y) % 26) < 1) || (((x - y + 2600) % 26) < 1) ? -22 : 0),
  marl: (x, y) => ((y % 11) < 1 ? -30 : (((x * 3 + y * 7) % 31) === 0 ? -35 : 0)),
  basement: (x, y) => ((((x % 20) < 1 && (y % 20) > 7 && (y % 20) < 13) || ((y % 20) === 10 && (x % 20) > 16)) ? -60 : 0),
};
const FLUID = { gas: [214, 80, 72], oil: [74, 128, 40], water: [58, 122, 168] };

export class Subsurface {
  // cfg: { origin (world, mudline at main well), dir (horizontal), uMin, uMax, depth, wFront, layers:[{key,name,top:(u,w)=>d,color,pat,res?}], contacts:{goc,owc}, lens?, wells:[...], labelAt }
  constructor(cfg) {
    this.cfg = cfg; const O = cfg.origin, d = cfg.dir.clone().normalize(); this.d = d;
    this.V = V3(0, 0, 1); // viewer side (all blocks open toward +z)
    this.root = new THREE.Group(); this.root.visible = false;
    this.labels = [];
    const xA = O.x + d.x * cfg.uMin, xB = O.x + d.x * cfg.uMax; this.xL = Math.min(xA, xB); this.xR = Math.max(xA, xB);
    this.zBack = O.z - 14; this.zFront = O.z + cfg.wFront;
    this.buildWalls(); this.buildSurfaces(); this.buildWells();
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  }
  uw(x, z) { const O = this.cfg.origin; return [(x - O.x) * this.d.x + (z - O.z) * this.d.z, (z - O.z)]; }
  layerAt(u, w, z) {
    const L = this.cfg.layers; let cur = L[0];
    for (const l of L) if (z >= l.top(u, w)) cur = l;
    if (this.cfg.lens) { const ln = this.cfg.lens; const k = 1 - ((u - ln.u) / ln.half) ** 2; if (k > 0 && Math.abs(z - ln.z) < ln.thick * k) return ln; }
    return cur;
  }
  fluidAt(l, z) { if (!l.res) return null; const c = this.cfg.contacts; if (c.goc && z < c.goc) return 'gas'; if (z < c.owc) return 'oil'; return 'water'; }
  paintWall(W, H, map) { // map(px,py) -> [u,w,z]
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const img = g.createImageData(W, H); const D = img.data;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const [u, w, z] = map(px, py); const l = this.layerAt(u, w, z); let col = l.rgb || (l.rgb = hex(l.color));
      const f = this.fluidAt(l, z); let r = col[0], gg = col[1], b = col[2];
      if (f) { const fc = FLUID[f]; r = r * 0.45 + fc[0] * 0.55; gg = gg * 0.45 + fc[1] * 0.55; b = b * 0.45 + fc[2] * 0.55; }
      const p = (PAT[l.pat] || PAT.clay)(px, py) + (rnd() - 0.5) * 16; const k = (py * W + px) * 4;
      D[k] = clamp(r + p, 0, 255); D[k + 1] = clamp(gg + p, 0, 255); D[k + 2] = clamp(b + p, 0, 255); D[k + 3] = 255;
    }
    g.putImageData(img, 0, 0); return { c, g };
  }
  buildWalls() {
    const cfg = this.cfg, O = cfg.origin, Dp = cfg.depth;
    const W = 1024, H = Math.round(1024 * Dp / (this.xR - this.xL) * 1.0); const Hc = clamp(H, 1024, 2048);
    // back wall (behind the well plane)
    const back = this.paintWall(W, Hc, (px, py) => { const x = lerp(this.xL, this.xR, px / W); const [u] = this.uw(x, this.zBack); return [u, -14, py / Hc * Dp]; });
    const g = back.g; g.font = 'bold 22px Arial'; g.fillStyle = 'rgba(255,255,255,.9)'; g.strokeStyle = 'rgba(255,255,255,.55)';
    for (let t = 0; t <= Dp; t += 250) { const y = t / Dp * Hc; g.fillRect(0, y - 1, t % 1000 === 0 ? 46 : 26, 2); if (t % 500 === 0 && t > 0) { g.fillText(`${t} m`, 52, y + 8); } }
    g.setLineDash([10, 8]); g.lineWidth = 2;
    if (cfg.contacts.owc) { const y = cfg.contacts.owc / Dp * Hc; g.strokeStyle = 'rgba(120,200,255,.95)'; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    if (cfg.contacts.goc) { const y = cfg.contacts.goc / Dp * Hc; g.strokeStyle = 'rgba(255,140,120,.95)'; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const bt = new THREE.CanvasTexture(back.c); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(this.xR - this.xL, Dp), new THREE.MeshBasicMaterial({ map: bt, side: DS, fog: false }));
    bw.position.set((this.xL + this.xR) / 2, O.y - Dp / 2, this.zBack); tag(bw, 'formation'); bw.userData.layerAt = (p) => { const [u] = this.uw(p.x, this.zBack); return this.layerAt(u, -14, O.y - p.y); };
    this.root.add(bw);
    // end wall (left), facing +x
    const ew = Math.round(1024 * cfg.wFront / (this.xR - this.xL)) + 64; const EW = clamp(ew, 256, 1024);
    const end = this.paintWall(EW, Hc, (px, py) => { const z = lerp(this.zFront, this.zBack, px / EW); const [u, w] = this.uw(this.xL, z); return [u, w, py / Hc * Dp]; });
    const et = new THREE.CanvasTexture(end.c); et.colorSpace = THREE.SRGBColorSpace;
    const emesh = new THREE.Mesh(new THREE.PlaneGeometry(this.zFront - this.zBack, Dp), new THREE.MeshBasicMaterial({ map: et, side: DS, fog: false }));
    emesh.rotation.y = Math.PI / 2; emesh.position.set(this.xL, O.y - Dp / 2, (this.zBack + this.zFront) / 2); tag(emesh, 'formation');
    emesh.userData.layerAt = (p) => { const [u, w] = this.uw(this.xL, p.z); return this.layerAt(u, w, O.y - p.y); };
    this.root.add(emesh);
    // floor + frame edges
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(this.xR - this.xL, this.zFront - this.zBack), new THREE.MeshBasicMaterial({ color: 0x2a2620, side: DS, fog: false }));
    fl.rotation.x = -Math.PI / 2; fl.position.set((this.xL + this.xR) / 2, O.y - Dp, (this.zBack + this.zFront) / 2); this.root.add(fl);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(this.xR - this.xL, Dp, this.zFront - this.zBack)), new THREE.LineBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.35, fog: false }));
    edge.position.set((this.xL + this.xR) / 2, O.y - Dp / 2, (this.zBack + this.zFront) / 2); this.root.add(edge);
    // layer name labels near left side of back wall
    const seen = new Set();
    for (const l of [...cfg.layers, ...(cfg.lens ? [cfg.lens] : [])]) {
      if (seen.has(l.name)) continue; seen.add(l.name);
      const uL = l.labelU ?? cfg.uMin + (cfg.uMax - cfg.uMin) * 0.12; const zTop = l.top ? l.top(uL, 0) : l.z - l.thick; const next = cfg.layers[cfg.layers.indexOf(l) + 1];
      const zMid = l.labelZ ?? (next ? (zTop + next.top(uL, 0)) / 2 : zTop + 120);
      const x = this.cfg.origin.x + this.d.x * uL; this.addLabel(l.name, V3(x, O.y - zMid, this.zBack + 4), 0.026, { border: 'rgba(255,255,255,.6)', bg: 'rgba(20,16,10,.7)' });
    }
    this.addLabel(`Wellbore diameters exaggerated ×${RADIAL_EXAG}`, V3(this.xR - (this.xR - this.xL) * 0.18, O.y - Dp + 60, this.zBack + 4), 0.022, { border: 'rgba(255,255,255,.4)' });
  }
  surfaceMesh(fn, colorFn, opacity, key) {
    const O = this.cfg.origin, nx = 90, nz = 40; const g = new THREE.PlaneGeometry(1, 1, nx, nz); const p = g.attributes.position; const cols = [];
    for (let i = 0; i < p.count; i++) {
      const fx = p.getX(i) + 0.5, fz = p.getY(i) + 0.5; const x = lerp(this.xL, this.xR, fx), z = lerp(this.zFront, this.zBack, fz);
      const [u, w] = this.uw(x, z); const dd = fn(u, w); p.setXYZ(i, x, O.y - dd, z); const c = colorFn(u, w, dd); cols.push(c[0] / 255, c[1] / 255, c[2] / 255);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity, side: DS, depthWrite: false, fog: false }));
    m.renderOrder = 3; tag(m, key); this.root.add(m); return m;
  }
  buildSurfaces() {
    for (const s of this.cfg.surfaces || []) {
      const l = this.cfg.layers.find(x => x.key === s.layer);
      this.surfaceMesh(l.top, (u, w, z) => { const f = this.fluidAt(l, z); return f ? FLUID[f] : hex(l.color); }, s.opacity ?? 0.5, s.key || l.key);
    }
  }
  addLabel(text, pos, h, opts = {}) { const l = makeLabel(text, h, { ...opts, screen: true }); l.position.copy(pos); l.userData.maxDist = opts.maxDist || 5500; this.root.add(l); this.labels.push(l); return l; }
  buildWells() {
    this.wells = [];
    const steel = (c) => M(c, { metalness: 0.25, roughness: 0.5, side: DS });
    const cementLbl = true; const cementM = M(0xa7a399, { metalness: 0, roughness: 0.95, side: DS });
    const CASE_COL = { conductorcsg: 0x3a4048, surfacecsg: 0x2f6aa8, intermediatecsg: 0x2e9d6a, productioncsg: 0xc0392b, linercsg: 0xc2a46a };
    const holeM = M(0x6e5a44, { metalness: 0, roughness: 1, side: DS });
    const shoeM = M(0xe67e22, { metalness: 0.3 });
    for (const wc of this.cfg.wells) {
      const origin = this.cfg.origin.clone().add(wc.offset || V3());
      const path = trajectory(origin, this.d, wc.traj);
      const W = { cfg: wc, path, group: grp(null), holeTD: wc.holeTD ?? wc.traj.td, pkg: wc.pkg || null, lastBit: -1, lastHole: -1 };
      this.root.add(W.group);
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.pts.filter((_, i) => i % 2 === 0)), new THREE.LineBasicMaterial({ color: wc.simple ? 0xcfe8ff : 0xffe066, fog: false, transparent: true, opacity: 0.9 })); ln.raycast = () => {}; W.group.add(ln);
      if (wc.simple) { // producing / offset well: thin full tube with perforations
        const g = sweep(path, 0, wc.traj.td, wc.r || 7 * IN, this.V, 0, 10); const m = tag(new THREE.Mesh(g, steel(0x8fa3b5)), wc.key || 'producer'); W.group.add(m);
        for (let md = 0; md < wc.traj.td; md += 12) { const pp = path.at(md); const [pu, pw] = this.uw(pp.x, pp.z); if (!this.layerAt(pu, pw, this.cfg.origin.y - pp.y).res) continue; const pg = sweep(path, md, md + 4, (wc.r || 7 * IN) * 1.6, this.V, 0, 10); W.group.add(tag(new THREE.Mesh(pg, M(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 0.6 })), wc.key || 'producer')); }
        if (wc.label) this.addLabel(wc.label, path.at(wc.traj.td * 0.75).add(V3(0, 0, 30)), 0.022);
        this.wells.push(W); continue;
      }
      // cement sheaths (hole radius) then casings, outermost first
      for (const c of wc.casings) {
        if (c.cement !== false) { const g = sweep(path, c.toc ?? 0, c.shoe, c.hole * IN, this.V); if (g) W.group.add(tag(new THREE.Mesh(g, cementM), 'cementsheath')); }
        const g2 = sweep(path, c.top ?? 0, c.shoe, c.od * IN, this.V); W.group.add(tag(new THREE.Mesh(g2, steel(c.color || CASE_COL[c.key] || 0x9aa3ad)), c.key));
        const sg = sweep(path, c.shoe - 6, c.shoe, c.od * IN * 1.12, this.V, 0, 16); W.group.add(tag(new THREE.Mesh(sg, shoeM), c.key));
        const lp = path.at(c.shoe); this.addLabel(c.label, lp.add(V3(this.d.x * (c.od * IN + 6), 0, 25)), 0.022, { maxDist: c.labelDist || 4500 });
        { const ci = wc.casings.indexOf(c); const tp = path.at((c.top ?? 0) + 76 + ci * 5.5); const nm = c.label.split(' @')[0]; this.addLabel(nm, tp.add(V3((ci % 2 ? -1 : 1) * (c.od * IN + 3), 0, 6)), 0.024, { maxDist: 260, border: 'rgba(255,255,255,.7)' }); }
      }
      W.ohStart = wc.casings.length ? wc.casings[wc.casings.length - 1].shoe : 0; W.ohR = wc.openHole * IN;
      W.ohMesh = tag(new THREE.Mesh(new THREE.BufferGeometry(), holeM), 'openhole'); W.group.add(W.ohMesh);
      W.strMesh = tag(new THREE.Mesh(new THREE.BufferGeometry(), M(0x50585f, { metalness: 0.7, roughness: 0.35 })), 'drillpipe'); W.group.add(W.strMesh);
      W.bhaMesh = tag(new THREE.Mesh(new THREE.BufferGeometry(), M(0x2c3e50, { metalness: 0.6, roughness: 0.4 })), 'bha'); W.group.add(W.bhaMesh);
      W.bit = tag(new THREE.Mesh(new THREE.ConeGeometry(wc.openHole * IN * 0.98, wc.openHole * IN * 1.6, 16), M(0xd4ac0d, { metalness: 0.8, roughness: 0.3 })), 'pdcbit'); W.group.add(W.bit);
      this.ohLabel = this.addLabel(wc.ohLabel || `Open hole ${wc.ohText || ''}`, V3(), 0.022);
      W.ohLabel = this.ohLabel;
      for (const a of wc.annotations || []) this.addLabel(a.text, path.at(a.md).add(V3(this.d.x * (a.du || 0), a.dy || 0, 30)), 0.02, { border: 'rgba(120,220,255,.85)' });
      this.wells.push(W); this.setHole(W, W.holeTD); this.setBit(W, wc.bitMD ?? W.holeTD);
    }
  }
  setHole(W, td) {
    td = Math.min(td, W.path.td); if (Math.abs(td - W.lastHole) < 2) return; W.lastHole = td;
    const g = td > W.ohStart + 1 ? sweep(W.path, W.ohStart, td, W.ohR, this.V) : null; W.ohMesh.geometry.dispose(); W.ohMesh.geometry = g || new THREE.BufferGeometry();
    W.ohLabel.position.copy(W.path.at((W.ohStart + td) / 2)).add(V3(this.d.x * 10, 0, 30)); W.ohLabel.visible = !!g;
  }
  setBit(W, md) {
    md = clamp(md, 0, W.path.td); if (Math.abs(md - W.lastBit) < 1.5) return; W.lastBit = md;
    const vis = md > 2; W.strMesh.visible = W.bhaMesh.visible = W.bit.visible = vis; if (!vis) return;
    const bhaLen = Math.min(md, 150);
    const sg = md - bhaLen > 1 ? sweep(W.path, 0, md - bhaLen, 5 * IN, this.V, 0, 10) : null; W.strMesh.geometry.dispose(); W.strMesh.geometry = sg || new THREE.BufferGeometry();
    const bg = sweep(W.path, md - bhaLen, md - 1, 6.75 * IN, this.V, 0, 12); W.bhaMesh.geometry.dispose(); W.bhaMesh.geometry = bg || new THREE.BufferGeometry();
    const p = W.path.at(md), q = W.path.at(Math.max(0, md - 3)); const dir = V3().subVectors(p, q).normalize();
    W.bit.position.copy(p).addScaledVector(dir, -W.ohR * 0.4); W.bit.quaternion.setFromUnitVectors(V3(0, -1, 0), dir);
  }
  // bitMD: measured depth below mudline (from rig package)
  update() {
    for (const W of this.wells) {
      if (!W.pkg || W.cfg.simple) continue;
      const fl = V3(); W.pkg.root.getWorldPosition(fl); const md = W.pkg.bitDepth - (fl.y - (this.cfg.origin.y + (W.cfg.offset ? W.cfg.offset.y : 0)));
      if (md > W.holeTD) { W.holeTD = Math.min(md, W.path.td); this.setHole(W, W.holeTD); }
      this.setBit(W, Math.min(md, W.holeTD));
    }
  }
  bitMDFor(W) { return W.holeTD; }
}

// ================================================================ well & geology definitions per rig
const sin = Math.sin;
export function jackupSubsurface(origin, pkg) {
  const crestU = 1350;
  const dome = (u, w, amp, sd = 700) => amp * Math.exp(-((u - crestU) ** 2 + (w * 1.3) ** 2) / (2 * sd * sd));
  const layers = [
    { key: 'lyr_clay', name: 'Seabed clays & silts', top: () => 0, color: 0x9c8b6e, pat: 'clay' },
    { key: 'lyr_sandshale', name: 'Interbedded sand & shale', top: (u) => 140 + 10 * sin(u / 160), color: 0xb59a6a, pat: 'sandshale' },
    { key: 'lyr_shale', name: 'Marine shale', top: (u, w) => 620 + 15 * sin(u / 230) - dome(u, w, 40), color: 0x6f6a62, pat: 'shale' },
    { key: 'lyr_limestone', name: 'Limestone stringer', top: (u, w) => 1180 - dome(u, w, 80), color: 0xa7a28c, pat: 'limestone' },
    { key: 'lyr_shale', name: 'Shale (cap rock / seal)', top: (u, w) => 1300 - dome(u, w, 100), color: 0x5f5a54, pat: 'shale' },
    { key: 'lyr_reservoir_sand', name: 'Reservoir sandstone', top: (u, w) => 2320 - dome(u, w, 180), color: 0xd6b56f, pat: 'sand', res: true },
    { key: 'lyr_shale', name: 'Underlying shale', top: (u, w) => 2450 - dome(u, w, 170), color: 0x5a554f, pat: 'shale' },
  ];
  return new Subsurface({
    origin, dir: V3(-1, 0, 0), uMin: -250, uMax: 1900, depth: 2650, wFront: 650,
    layers, contacts: { goc: 2200, owc: 2280 }, surfaces: [{ layer: 'lyr_reservoir_sand', key: 'reservoir', opacity: 0.55 }],
    wells: [
      { key: 'main', pkg, traj: { kop: 500, build: 3, inc: 52, td: 3150 }, holeTD: 2950, openHole: 8.5, ohLabel: 'Open hole 8-1/2" (reservoir section)',
        casings: [
          { key: 'conductorcsg', od: 30, hole: 36, shoe: 120, label: '30" conductor @ 120 m' },
          { key: 'surfacecsg', od: 20, hole: 26, shoe: 550, label: '20" surface casing @ 550 m' },
          { key: 'intermediatecsg', od: 13.375, hole: 17.5, shoe: 1450, toc: 300, label: '13-3/8" intermediate @ 1,450 m MD' },
          { key: 'productioncsg', od: 9.625, hole: 12.25, shoe: 2500, toc: 1700, label: '9-5/8" production casing @ 2,500 m MD' },
        ],
        annotations: [{ md: 500, text: 'Kick-off point (KOP) 500 m', du: 20 }, { md: 900, text: 'Build section 3°/30 m', du: -60 }, { md: 1800, text: 'Tangent (hold) section 52°', du: -40 }] },
      ...[0.12, 0.38, 0.62, 0.9].map((az, i) => ({
        simple: true, key: 'producer', offset: V3(3.5, 0, -5 + i * 2.5), traj: { kop: 250 + i * 60, build: 2.5, inc: 35 + i * 6, td: 2650 + i * 80, az }, 
        label: i === 1 ? 'Producing wells from the platform (perforated in reservoir)' : null })),
    ],
  });
}
export function semiSubsurface(origin, pkg) {
  const dome = (u, w, amp, sd = 450) => amp * Math.exp(-(u * u + w * w) / (2 * sd * sd));
  const layers = [
    { key: 'lyr_clay', name: 'Soft seabed mud', top: () => 0, color: 0x8a7d66, pat: 'clay' },
    { key: 'lyr_shale', name: 'Young shale', top: (u) => 260 + 12 * sin(u / 120), color: 0x77716a, pat: 'shale' },
    { key: 'lyr_turbidite', name: 'Turbidite sands & shales', top: (u, w) => 1150 + 25 * sin(u / 140) - dome(u, w, 40), color: 0xa58e64, pat: 'sandshale' },
    { key: 'lyr_shale', name: 'Shale', top: (u, w) => 1950 - dome(u, w, 70), color: 0x625d56, pat: 'shale' },
    { key: 'lyr_marl', name: 'Marl', top: (u, w) => 2550 - dome(u, w, 100), color: 0x8f8a78, pat: 'marl' },
    { key: 'lyr_shale', name: 'Shale (seal)', top: (u, w) => 2850 - dome(u, w, 120), color: 0x55504a, pat: 'shale' },
    { key: 'lyr_turbidite_res', name: 'Turbidite reservoir sand', top: (u, w) => 3260 - dome(u, w, 160), color: 0xd2b06a, pat: 'sand', res: true },
    { key: 'lyr_shale', name: 'Shale', top: (u, w) => 3420 - dome(u, w, 150), color: 0x4f4a44, pat: 'shale' },
  ];
  return new Subsurface({
    origin, dir: V3(1, 0, 0), uMin: -600, uMax: 600, depth: 3800, wFront: 600,
    layers, contacts: { owc: 3200 }, surfaces: [{ layer: 'lyr_turbidite_res', key: 'reservoir', opacity: 0.55 }],
    lens: { key: 'lyr_shallowgas', name: 'Shallow gas pocket (hazard)', u: 260, z: 470, half: 160, thick: 22, color: 0xe6c84d, pat: 'sand', labelU: 260, labelZ: 470, top: null },
    wells: [{ key: 'main', pkg, traj: { kop: 1e9, build: 0, inc: 0, td: 3780 }, holeTD: 3650, openHole: 8.5, ohLabel: 'Open hole 8-1/2" – exploration target',
      casings: [
        { key: 'conductorcsg', od: 36, hole: 42, shoe: 80, cement: false, label: '36" conductor (jetted) @ 80 m' },
        { key: 'surfacecsg', od: 20, hole: 26, shoe: 900, label: '20" surface casing @ 900 m' },
        { key: 'intermediatecsg', od: 13.375, hole: 17.5, shoe: 2050, toc: 600, label: '13-3/8" intermediate @ 2,050 m' },
        { key: 'productioncsg', od: 9.625, hole: 12.25, shoe: 3000, toc: 2300, label: '9-5/8" casing @ 3,000 m' },
      ], annotations: [{ md: 3300, text: 'Vertical exploration well – discovery!', du: 40 }] }],
  });
}
export function shipSubsurface(origin, pkgMain, pkgAux) {
  const crestU = 900;
  const dome = (u, w, amp, sd = 650) => amp * Math.exp(-((u - crestU) ** 2 + (w * 1.2) ** 2) / (2 * sd * sd));
  const layers = [
    { key: 'lyr_clay', name: 'Seabed ooze & mud', top: () => 0, color: 0x857a68, pat: 'clay' },
    { key: 'lyr_shale', name: 'Post-salt shale & marl', top: (u) => 220 + 15 * sin(u / 150), color: 0x6d675f, pat: 'shale' },
    { key: 'lyr_salt', name: 'Salt (halite) – ~1,800 m thick', top: (u, w) => 1000 + 120 * sin(u / 260 + 1) + 60 * sin(w / 200), color: 0xe8e2dc, pat: 'salt' },
    { key: 'lyr_carbonate', name: 'Pre-salt carbonate reservoir', top: (u, w) => 3030 - dome(u, w, 120), color: 0xb9c7cf, pat: 'carbonate', res: true },
    { key: 'lyr_basement', name: 'Volcanics / basement', top: (u, w) => 3260 - dome(u, w, 100), color: 0x4b3f45, pat: 'basement' },
  ];
  return new Subsurface({
    origin, dir: V3(1, 0, 0), uMin: -450, uMax: 1900, depth: 3450, wFront: 650,
    layers, contacts: { goc: 2960, owc: 3080 }, surfaces: [{ layer: 'lyr_carbonate', key: 'reservoir', opacity: 0.55 }, { layer: 'lyr_salt', key: 'lyr_salt', opacity: 0.16 }],
    wells: [
      { key: 'main', pkg: pkgMain, traj: { kop: 2560, build: 4, inc: 90, td: 4500 }, holeTD: 4250, openHole: 8.5, ohLabel: 'Horizontal open hole 8-1/2" in reservoir',
        casings: [
          { key: 'conductorcsg', od: 36, hole: 42, shoe: 90, cement: false, label: '36" conductor (jetted) @ 90 m' },
          { key: 'surfacecsg', od: 22, hole: 26, shoe: 950, label: '22" surface casing @ 950 m' },
          { key: 'intermediatecsg', od: 13.625, hole: 17.5, shoe: 2400, toc: 700, label: '13-5/8" casing through salt @ 2,400 m' },
          { key: 'linercsg', od: 10.75, hole: 12.25, top: 2300, shoe: 3350, toc: 2300, label: '10-3/4" liner (landed at horizontal) @ 3,350 m MD', color: 0xb0a080 },
        ],
        annotations: [{ md: 2560, text: 'KOP 2,560 m (near base of salt)', du: -30 }, { md: 2900, text: 'Build 4°/30 m to 90°', du: -40, dy: -40 }, { md: 3900, text: 'Horizontal section in reservoir', dy: -60 }] },
      { key: 'aux', pkg: pkgAux, offset: V3(16, 0, 0), traj: { kop: 1e9, build: 0, inc: 0, td: 650 }, holeTD: 420, openHole: 26, ohLabel: 'Aux well: riserless 26" top-hole', ohText: '26"',
        casings: [{ key: 'conductorcsg', od: 36, hole: 42, shoe: 90, cement: false, label: 'Aux well 36" conductor', labelDist: 1500 }] },
    ],
  });
}
