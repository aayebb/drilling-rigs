import * as THREE from 'three';
import { V3, M, MAT, COL, TEX, tag, grp, box, boxUV, rbox, cyl, hcyl, sph, cone, lathe, torus, pipeRun, strutMesh, Lattice, railing, rectRail, stairs, ladder, lbl, seabedY, lerp, approach, textTexture } from './lib.js';
import { DrillPackage } from './drilling.js';
import { buildSubseaBOP, buildSurfaceBOP, buildRiser, buildROV, buildTMS, wellheadPlatform } from './bop.js';
import { shipMoonpool, semiMoonpool, riserSpider, riserRunningTool, flowLine, bowAnchor, windlass, bollards, rescueBoat, fireMonitor, floodMast, funnel } from './moonpool.js';
import { mudModule, chokeManifold, accumulatorUnit, mgs, cementUnit, engineRoom, crane, knuckleCrane, lifeboat, liferafts, helideck, quarters, burnerBoom, pipeDeck, containers, bopHandler } from './equipment.js';

const BIG = { always: true, border: 'rgba(80,200,255,.9)' };

function thruster(x, y, z) {
  const g = grp('thruster'); g.position.set(x, y, z);
  g.add(lathe([[0.9, 0], [0.9, 2.2], [1.3, 2.6]], MAT.dark(), 16));
  const n = lathe([[1.8, -1.6], [2.0, -1.4], [2.0, 1.4], [1.85, 1.6]], M(0x7f8c8d, { metalness: 0.6, side: THREE.DoubleSide }), 24); n.rotation.z = Math.PI / 2; g.add(n);
  const hub = lathe([[0, -1.6], [0.6, -1.2], [0.7, 0.8], [0.4, 1.4], [0, 1.6]], MAT.dark(), 16); hub.rotation.z = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 4; i++) { const b = box(0.1, 1.4, 0.5, M(0xb08d57, { metalness: 0.9, roughness: 0.3 }), 0.8, 0, 0); b.rotation.x = i * Math.PI / 2 + 0.3; b.position.set(0.8, Math.cos(i * Math.PI / 2) * 0.9, Math.sin(i * Math.PI / 2) * 0.9); g.add(b); }
  return g;
}

// ===================================================================== JACK-UP
export class Jackup {
  constructor(x, z) {
    this.key = 'jackup'; this.name = 'Jack-up rig'; this.zone = 'Shallow water';
    this.root = new THREE.Group(); this.root.position.set(x, 0, z);
    this.seabed = seabedY(x, z); this.waterDepth = -this.seabed;
    this.j = 3; this.jTarget = 3; this.wellX = 44;
    const R = this.root;

    const H = this.hull = new THREE.Group(); R.add(H);
    const sh = new THREE.Shape([new THREE.Vector2(30, -38), new THREE.Vector2(30, 38), new THREE.Vector2(-40, 7), new THREE.Vector2(-40, -7)]);
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }); hg.rotateX(Math.PI / 2); hg.translate(0, 8, 0);
    const hullP = grp('jackuphull'); const hm = new THREE.Mesh(hg, [M(0xffffff, { map: TEX.checker, metalness: 0.4 }), M(0xc0461b, { metalness: 0.3 })]); hm.userData.keep = true; hullP.add(hm);
    TEX.checker.repeat.set(1, 1);
    const deckEdge = [V3(30, 8.4, -37.6), V3(30, 8.4, 37.6), V3(-39.6, 8.4, 7), V3(-39.6, 8.4, -7), V3(30, 8.4, -37.6)];
    hullP.add(railing(deckEdge));
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.2), M(0xffffff, { map: textTexture('UTM EXPLORER I', 1024, 128, '#c0461b', '#ffffff', 'bold 96px Arial') })); nm.position.set(30.45, 4.5, 0); nm.rotation.y = Math.PI / 2; nm.userData.keep = true; hullP.add(nm);
    H.add(hullP);
    this.legPos = [[20, -28], [20, 28], [-30, 0]];
    for (const [lx, lz] of this.legPos) {
      const jh = grp('jackinghouse');
      jh.add(boxUV(14, 12, 14, M(0xc0392b, { metalness: 0.3 }), lx, 14, lz, 0.4));
      for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + k * Math.PI * 2 / 3; for (let u = 0; u < 4; u++) jh.add(rbox(1.2, 1.4, 1.2, 0.1, MAT.dark(), lx + Math.cos(a) * 7.2, 9.5 + u * 1.7, lz + Math.sin(a) * 7.2)); }
      jh.add(rectRail(lx - 7, lz - 7, lx + 7, lz + 7, 20, 1.0));
      H.add(jh);
    }
    H.add(quarters(-10, 8, 0, 14, 14, 22, { bridge: true, name: 'UTM EXPLORER I' }));
    H.add(helideck(-46, 25, 0, 10));
    H.add(crane(6, 8, -24, -2.4, 34)); H.add(crane(6, 8, 24, 2.3, 34));
    H.add(mudModule(-5, 8, 8));
    H.add(engineRoom(-2, 8, -12, 16, 9));
    H.add(pipeDeck(7, 8, -1, 16, 8));
    H.add(lifeboat(-15, 10.5, -15, 0.3)); H.add(lifeboat(-15, 10.5, 15, -0.3));
    H.add(liferafts(-4, 8, 19, 4)); H.add(accumulatorUnit(24, 8, -10, Math.PI / 2)); H.add(containers(-24, 8, -8, 3, 0.3));

    // ---- cantilever (skids in/out)
    const CG = this.cant = new THREE.Group(); H.add(CG);
    const C = new Lattice();
    for (const zz of [-7, 7]) {
      C.add(V3(16, 8.6, zz), V3(56, 8.6, zz), 0.45); C.add(V3(16, 15, zz), V3(56, 15, zz), 0.45);
      for (let xx = 16; xx < 56; xx += 4) { C.add(V3(xx, 8.6, zz), V3(xx, 15, zz), 0.2); C.add(V3(xx, 8.6, zz), V3(xx + 4, 15, zz), 0.15); }
      C.add(V3(56, 8.6, zz), V3(56, 15, zz), 0.2);
    }
    for (let xx = 16; xx <= 56; xx += 8) { C.add(V3(xx, 15, -7), V3(xx, 15, 7), 0.25); C.add(V3(xx, 8.6, -7), V3(xx, 8.6, 7), 0.25); }
    const cp = grp('cantilever'); cp.add(C.build(M(0xf5f5f5, { metalness: 0.4 })));
    cp.add(boxUV(20, 0.3, 14, MAT.grating(), 26, 15.2, 0)); cp.add(rectRail(16, -7, 56, 7, 15.3, 1.1));
    for (const zz of [-7.6, 7.6]) cp.add(boxUV(44, 0.8, 0.8, MAT.hazard(), 34, 8.2, zz));
    CG.add(cp);
    this.pkg = new DrillPackage({ H: 48, subH: 9, bitDepth: 2100, setback: 18, label: 'Top drive' });
    this.pkg.root.position.set(this.wellX, 24.4, 0); CG.add(this.pkg.root);
    const sb = buildSurfaceBOP(); sb.position.set(this.wellX, 21.6, 0); CG.add(sb);
    CG.add(tag(lathe([[0.5, -1], [0.95, -0.9], [0.95, 0.4], [0.6, 0.5]], MAT.dark(), 24, this.wellX, 22.6, 0), 'diverter'));
    CG.add(chokeManifold(26, 15.35, 3.5)); CG.add(mgs(34, 15.35, -4.5)); CG.add(cementUnit(24, 15.35, -3.5));
    this.packages = [this.pkg];

    // ---- legs
    this.legs = [];
    for (const [lx, lz] of this.legPos) {
      const g = new THREE.Group(); g.position.set(lx, 0, lz); R.add(g); this.legs.push(g);
      const leg = grp('jackupleg'); const L = new Lattice(); const LEN = 165, r = 5;
      const pts = [0, 1, 2].map(i => { const a = Math.PI / 2 + i * Math.PI * 2 / 3; return [Math.cos(a) * r, Math.sin(a) * r]; });
      for (let y = 4; y < LEN; y += 5) for (let i = 0; i < 3; i++) {
        const a = pts[i], b = pts[(i + 1) % 3];
        L.add(V3(a[0], y, a[1]), V3(b[0], y, b[1]), 0.16); L.add(V3(a[0], y, a[1]), V3(b[0], y + 5, b[1]), 0.13);
        L.add(V3(a[0], y, a[1]), V3(0, y, 0), 0.08);
      }
      leg.add(L.build(M(0xe67e22, { metalness: 0.4 })));
      const ch = M(0xffffff, { map: TEX.rack, metalness: 0.5 }); TEX.rack.repeat.set(1, 120);
      for (const p of pts) { leg.add(cyl(0.5, LEN - 4, M(0xd35400, { metalness: 0.4 }), p[0], (LEN + 4) / 2, p[1])); const rk = box(0.25, LEN - 4, 1.4, ch, p[0] * 1.1, (LEN + 4) / 2, p[1] * 1.1); rk.rotation.y = -Math.atan2(p[1], p[0]); leg.add(rk); }
      leg.add(sph(0.3, MAT.redLight(), 0, LEN + 0.5, 0));
      g.add(leg);
      const sp = grp('spudcan');
      sp.add(lathe([[0, -1], [3, 0.2], [8.5, 1.8], [8.5, 2.8], [5, 5.2], [3.5, 6.0]], M(0xa04000, { metalness: 0.3 }), 32));
      g.add(sp);
    }
    // ---- fixed wellhead platform + conductor (fixed to seabed)
    R.add(wellheadPlatform(this.seabed, this.wellX, 18));
    this.wellG = new THREE.Group(); R.add(this.wellG);
    const topY = 15 + 21.6 - 6.4;
    this.wellG.add(tag(cyl(0.55, topY - this.seabed, M(0x95a5a6, { metalness: 0.6 }), this.wellX, (topY + this.seabed) / 2, 0), 'conductor'));
    this.wellG.add(tag(lathe([[0.6, 0], [1.3, 0.2], [1.3, 2.5], [0.6, 3]], MAT.dark(), 24, this.wellX, this.seabed, 0), 'mudlinewh'));
    lbl(this.wellG, 'Conductor / HP riser', this.wellX + 1.5, -30, 0, 2.0);
    lbl(R, `Seabed – water depth ${Math.round(this.waterDepth)} m`, this.wellX - 20, this.seabed + 5, 0, 2.5);

    lbl(R, 'JACK-UP RIG', 10, 105, 0, 12, BIG);
    lbl(CG, 'Derrick', this.wellX, 78, 5, 2.6); lbl(CG, 'Cantilever (skids out over platform)', 34, 17, 8.5, 1.8);
    lbl(CG, 'Surface BOP stack', this.wellX + 3, 15.6, 1, 1.2); lbl(H, 'Helideck', -46, 27, 0, 2.4);
    lbl(H, 'Living quarters', -10, 31, 0, 2.4); lbl(H, 'Jacking system', 20, 22, 28, 2.2);
    lbl(H, 'Mud pumps, pits & shakers', 6, 15, 8, 1.8); lbl(H, 'Engine room', -2, 16, -12, 1.8);
    lbl(this.legs[0], 'Leg (lattice, rack & pinion)', 0, 40, -6, 2.2); lbl(this.legs[0], 'Spudcan', 0, 8, -9, 2.4);
    this.update(0);
  }
  jackToggle() { this.jTarget = this.j > 1.5 ? 0 : 3; if (this.pkg.busy) this.pkg.setMode('idle'); }
  get jackStatus() {
    const j = this.j; if (j === 3) return 'On location: jacked up, cantilever skidded out over the platform – ready to drill.';
    if (j === 0) return 'Afloat – legs raised, ready for wet tow to the next location.';
    const up = this.jTarget > j;
    if (j < 1) return up ? 'Lowering legs to the seabed (pinning the spudcans)…' : 'Raising legs from the seabed…';
    if (j < 2) return up ? 'Preloaded – jacking hull out of the water to the air gap…' : 'Jacking hull down into the water…';
    return up ? 'Skidding cantilever out over the wellhead platform…' : 'Skidding cantilever in for the move…';
  }
  update(dt) {
    const rate = this.j < 2 && this.j > 1 ? 0.2 : 0.25;
    this.j = approach(this.j, this.jTarget, rate, dt); const j = this.j;
    const hullY = j <= 1 ? -4 : lerp(-4, 15, Math.min(1, j - 1));
    const legB = j <= 1 ? lerp(-12, this.seabed - 3, j) : this.seabed - 3;
    this.hull.position.y = hullY; for (const l of this.legs) l.position.y = legB;
    this.cant.position.x = j >= 2 ? lerp(-26, 0, j - 2) : -26;
    this.wellG.visible = j >= 2.999;
    this.pkg.enabled = j >= 2.999; if (!this.pkg.enabled && this.pkg.busy) this.pkg.setMode('idle');
    this.pkg.stringBottomY = this.wellG.visible ? this.seabed - (hullY + 24.4) : -1;
    this.pkg.update(dt);
  }
  views() {
    const p = this.root.position, hy = this.hull.position.y, wx = p.x + this.wellX + this.cant.position.x;
    return {
      overview: [V3(p.x + 150, 80, p.z + 160), V3(p.x + 10, 20, p.z)],
      floor: [V3(wx + 5, hy + 33.5, p.z + 22), V3(wx, hy + 33, p.z)],
      bop: [V3(wx + 8, hy + 17.5, p.z + 9), V3(wx, hy + 17, p.z)],
      mud: [V3(p.x + 25, hy + 22, p.z + 30), V3(p.x + 5, hy + 10, p.z + 10)],
      platform: [V3(wx + 40, 30, p.z - 40), V3(wx + 6, 15, p.z)],
      seabed: [V3(wx + 40, this.seabed + 18, p.z + 45), V3(p.x + 20, this.seabed + 6, p.z)],
    };
  }
}

// ===================================================================== SEMI-SUB
export class Semi {
  constructor(x, z) {
    this.key = 'semi'; this.name = 'Semi-submersible'; this.zone = 'Deepwater';
    this.root = new THREE.Group(); this.root.position.set(x, 0, z);
    this.seabed = seabedY(x, z); this.waterDepth = -this.seabed;
    const R = this.root, OR = M(0xe0661b, { metalness: 0.3 });
    const pon = grp('pontoon');
    for (const zz of [-32, 32]) { pon.add(rbox(112, 9, 16, 2.5, OR, 0, -18, zz)); pon.add(boxUV(112, 0.6, 16.2, M(0x922b21), 0, -22.2, zz)); }
    for (const xx of [-20, 20]) pon.add(hcyl(1.4, 48, OR, xx, -16, 0, 'z'));
    for (const xx of [-38, 38]) pon.add(hcyl(1.1, 64, OR, xx, 8, 0, 'z'));
    R.add(pon);
    const col = grp('column');
    for (const xx of [-38, 38]) for (const zz of [-32, 32]) { col.add(rbox(15, 26, 15, 3.5, OR, xx, -1, zz)); col.add(boxUV(15.1, 1.2, 15.1, M(0xffffff), xx, 0, zz)); for (let d = -12; d <= 8; d += 2) col.add(box(0.6, 0.1, 0.05, MAT.white ? M(0xffffff) : M(0xffffff), xx + 7.55, d, zz + (zz > 0 ? 4 : -4))); }
    R.add(col);
    const dk = grp('semideck');
    for (const [w, d, x, z] of [[38, 80, -27, 0], [38, 80, 27, 0], [16, 33, 0, 23.5], [16, 33, 0, -23.5]]) { dk.add(boxUV(w, 8, d, M(0xd6dbdf, { metalness: 0.3 }), x, 16, z, 0.3)); dk.add(boxUV(w, 0.2, d, MAT.checker(), x, 20.1, z, 0.4)); }
    dk.add(rectRail(-46, -40, 46, 40, 20.2, 1.1));
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), M(0xffffff, { map: textTexture('UTM DEEPSTAR', 1024, 128, '#d6dbdf', '#1b2a41', 'bold 96px Arial') })); nm.position.set(0, 16, 40.05); nm.userData.keep = true; dk.add(nm);
    R.add(dk);
    this.pkg = new DrillPackage({ H: 56, subH: 10, bitDepth: 3600, setback: 22, label: 'Top drive', cmc: true });
    this.pkg.root.position.set(0, 30, 0); R.add(this.pkg.root);
    this.pkg.stringBottomY = this.seabed - 30;
    this.packages = [this.pkg];
    const bop = buildSubseaBOP(); bop.position.y = this.seabed; R.add(bop);
    R.add(buildRiser(30, 12, this.seabed + 17.4));
    semiMoonpool(R); R.add(riserSpider(6, 30, 5.5)); R.add(riserRunningTool(-6.2, 30, -2.5));
    R.add(flowLine([V3(0.8, 27.6, -0.8), V3(-2, 27, -7), V3(-10, 25.5, -30), V3(-14, 24.6, -36.6)]));
    R.add(fireMonitor(-8.5, 30, 8.5, 0.8)); R.add(fireMonitor(8.5, 30, -8.5, -2.3)); R.add(floodMast(44, 20, -38)); R.add(floodMast(-44, 20, -38)); R.add(floodMast(44, 20, 38));
    lbl(R, 'Moonpool', -9.5, 21, -8, 0.9);
    R.add(quarters(-36, 20, 0, 16, 14, 50, { bridge: true })); R.add(helideck(-52, 36, 0, 12));
    R.add(crane(36, 20, -36, -1.2, 36)); R.add(crane(-24, 20, 37, 2.0, 36)); R.add(crane(38, 20, 35, 0.8, 30));
    R.add(mudModule(-20, 20, -35)); R.add(engineRoom(22, 20, -32, 16, 9));
    R.add(pipeDeck(22, 20, 24, 24, 12)); R.add(pipeDeck(-12, 20, 26, 20, 10, 0xf1c40f, 'riserrack', 0.9, 2));
    R.add(accumulatorUnit(13, 20, 13)); R.add(chokeManifold(13, 20, -14)); R.add(mgs(-12, 20, -12)); R.add(cementUnit(32, 20, 6));
    R.add(lifeboat(-24, 18.5, -42.5, 0)); R.add(lifeboat(-12, 18.5, -42.5, 0)); R.add(liferafts(-4, 20, 38, 4)); R.add(containers(-20, 20, 9, 4));
    R.add(burnerBoom(46, 18, -26, -0.5, 30)); R.add(burnerBoom(-46, 18, -26, Math.PI + 0.5, 30));
    for (const xx of [-52, 52]) for (const zz of [-32, 32]) R.add(thruster(xx, -25, zz));
    // mooring: winches, fairleads, catenary lines, anchors
    for (const [cx, cz] of [[38, 32], [-38, 32], [-38, -32], [38, -32]]) {
      const base = Math.atan2(cz, cx);
      for (const da of [-0.22, 0.22]) {
        const a = base + da, dx = Math.cos(a), dz = Math.sin(a);
        const fair = V3(cx + dx * 7.8, -9, cz + dz * 7.8);
        const anc = V3(dx * 1300, 0, dz * 1300); anc.y = seabedY(x + anc.x, z + anc.z);
        const pts = [];
        for (let i = 0; i <= 60; i++) { const t = i / 60; const px = lerp(fair.x, anc.x, t), pz = lerp(fair.z, anc.z, t); const sb = seabedY(x + px, z + pz) + 0.6; pts.push(V3(px, Math.max(fair.y + (anc.y - fair.y) * (1 - Math.pow(1 - t, 2.4)), sb), pz)); }
        const mg = grp('mooring');
        mg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.45, 5), M(0x2b2b2b, { metalness: 0.6 })));
        mg.add(pipeRun([V3(cx + dx * 5, 21, cz + dz * 5), V3(cx + dx * 7.9, 10, cz + dz * 7.9), fair], 0.4, M(0x2b2b2b, { metalness: 0.6 })));
        mg.add(hcyl(1.2, 2.2, M(COL.yellow), cx + dx * 4, 21.5, cz + dz * 4, 'x')); mg.add(rbox(2, 1.8, 3, 0.2, MAT.dark(), cx + dx * 2.5, 21, cz + dz * 2.5));
        mg.add(lathe([[0.9, -1], [0.9, 1], [1.2, 1.3]], MAT.dark(), 12, fair.x, fair.y, fair.z));
        R.add(mg);
        const an = grp('anchor'); an.add(rbox(6, 2.4, 5, 0.4, M(0x4d5656), anc.x, anc.y + 1, anc.z)); const fl = box(0.4, 5, 7, M(0x4d5656), anc.x + dx * 3, anc.y + 1.5, anc.z + dz * 3); fl.rotation.y = -a; an.add(fl); R.add(an);
      }
    }
    lbl(R, 'SEMI-SUBMERSIBLE', 0, 112, 0, 14, BIG);
    lbl(R, 'Derrick', 0, 91, 5, 2.6); lbl(R, 'Column', 38, 8, 41, 2.6); lbl(R, 'Pontoon', 0, -11, 42, 2.6);
    lbl(R, 'Mooring line', 60, -20, 75, 2.6); lbl(R, 'Marine riser', 1.5, -60, 0, 2.6);
    lbl(R, 'Riser buoyancy modules', 1.5, -300, 0, 2.6); lbl(R, 'Telescopic joint & tensioners', 3, -3, 4, 1.6);
    lbl(R, 'Subsea BOP stack', 6, this.seabed + 19, 0, 1.4); lbl(R, `Seabed – water depth ${Math.round(this.waterDepth)} m`, 0, this.seabed + 24, 0, 2.4);
    lbl(R, 'Helideck', -52, 38, 0, 2.4); lbl(R, 'Living quarters', -36, 38, 26, 2.4); lbl(R, 'Burner boom (well test)', 58, 26, -32, 2.0);
    lbl(R, 'Mud module', -8, 27, -35, 2.0); lbl(R, 'Riser storage', -12, 25, 26, 2.0); lbl(R, 'Mooring winch', 42, 25, 36, 1.6);
  }
  update(dt) { this.pkg.update(dt); }
  views() {
    const p = this.root.position, sb = this.seabed;
    return {
      overview: [V3(p.x + 170, 85, p.z + 170), V3(p.x, 15, p.z)],
      floor: [V3(p.x + 5, 39, p.z + 22), V3(p.x, 38.5, p.z)],
      mud: [V3(p.x + 10, 34, p.z - 10), V3(p.x - 10, 22, p.z - 34)],
      hull: [V3(p.x + 95, -32, p.z + 95), V3(p.x, -12, p.z)],
      moonpool: [V3(p.x + 3.5, 27, p.z + 4.5), V3(p.x - 1.5, 6, p.z - 2.5)],
      bop: [V3(p.x + 20, sb + 13, p.z + 22), V3(p.x, sb + 9, p.z)],
    };
  }
}

// ===================================================================== DRILLSHIP
export class Drillship {
  constructor(x, z) {
    this.key = 'ship'; this.name = 'Drillship (dual derrick)'; this.zone = 'Ultra-deepwater';
    this.root = new THREE.Group(); this.root.position.set(x, 0, z);
    this.seabed = seabedY(x, z); this.waterDepth = -this.seabed;
    const R = this.root;
    const sh = new THREE.Shape(); sh.moveTo(-114, -21); sh.lineTo(70, -21); sh.quadraticCurveTo(108, -19, 116, 0); sh.quadraticCurveTo(108, 19, 70, 21); sh.lineTo(-114, 21); sh.lineTo(-114, -21);
    const hole = new THREE.Path(); hole.moveTo(-20, -6.5); hole.lineTo(-20, 6.5); hole.lineTo(20, 6.5); hole.lineTo(20, -6.5); hole.lineTo(-20, -6.5); sh.holes.push(hole);
    const lo = new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: false, curveSegments: 20 }); lo.rotateX(Math.PI / 2); lo.translate(0, -2, 0);
    const up = new THREE.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 20 }); up.rotateX(Math.PI / 2); up.translate(0, 7, 0);
    const hull = grp('shiphull');
    const l1 = new THREE.Mesh(lo, [M(0x922b21), M(0x922b21)]); l1.userData.keep = true; hull.add(l1);
    const u1 = new THREE.Mesh(up, [M(0xffffff, { map: TEX.checker, metalness: 0.4 }), M(0x1b2a41, { metalness: 0.3 })]); u1.userData.keep = true; hull.add(u1);
    hull.add(railing([V3(-113, 7.3, -20.6), V3(70, 7.3, -20.6), V3(100, 7.3, -14), V3(115, 7.3, 0), V3(100, 7.3, 14), V3(70, 7.3, 20.6), V3(-113, 7.3, 20.6), V3(-113, 7.3, -20.6)]));
    for (const sz of [-1, 1]) { const nm = new THREE.Mesh(new THREE.PlaneGeometry(50, 5), M(0xffffff, { map: textTexture('UTM OCEAN PIONEER', 1024, 128, '#1b2a41', '#ffffff', 'bold 90px Arial') })); nm.position.set(-20, 3.5, sz * 21.05); nm.rotation.y = sz > 0 ? 0 : Math.PI; nm.userData.keep = true; hull.add(nm); }
    const bow = lathe([[0, -6], [3.5, -5], [4, -3], [3, 0]], M(0x922b21), 16, 116, -8, 0); bow.rotation.z = -Math.PI / 2; hull.add(bow); // bulbous bow
    R.add(hull);
    this.mpUpdate = shipMoonpool(R);
    R.add(riserSpider(-15, 21, 2.2)); R.add(riserRunningTool(-1.5, 21, -7.2));
    R.add(flowLine([V3(-7, 18.6, -1), V3(2, 18, -4), V3(18, 14.5, -10), V3(25, 12.2, -13.6)]));
    for (const sd of [-1, 1]) { R.add(bowAnchor(100, 3, sd * 13.6, sd)); R.add(windlass(98, 7, sd * 7)); }
    R.add(bollards([-100, -80, -60, -40, -20, 0, 20, 40].flatMap(x => [V3(x, 7, 19.6), V3(x, 7, -19.6)])));
    R.add(rescueBoat(90, 9.5, -22.5)); R.add(funnel(-100, 13, -14));
    R.add(fireMonitor(-16.5, 21, 8.5, 0.8)); R.add(fireMonitor(16.5, 21, -8.5, -2.3)); R.add(fireMonitor(98, 29, 11, 2.5));
    R.add(floodMast(-80, 7, -19)); R.add(floodMast(-40, 7, 19)); R.add(floodMast(12, 7, 19));
    // dual derrick
    this.main = new DrillPackage({ H: 62, subH: 14, bitDepth: 4200, setback: 24, label: 'Main top drive', cmc: true });
    this.main.root.position.set(-8, 21, 0); R.add(this.main.root);
    this.main.stringBottomY = this.seabed - 21;
    this.aux = new DrillPackage({ H: 62, subH: 14, bitDepth: 160, setback: 30, aux: true, label: 'Aux top drive', cmc: true });
    this.aux.root.position.set(8, 21, 0); this.aux.root.rotation.y = Math.PI; R.add(this.aux.root);
    this.aux.stringBottomY = this.seabed - 21;
    this.packages = [this.main, this.aux];
    const bop = buildSubseaBOP(); bop.position.set(-8, this.seabed, 0); R.add(bop);
    const riser = buildRiser(21, 7, this.seabed + 17.4); riser.position.x = -8; R.add(riser);
    // spare BOP on deck + BOP gantry
    const spare = buildSubseaBOP({ labels: false }); spare.position.set(-26, 7.3, -10); spare.children[0].visible = false; R.add(spare);
    R.add(bopHandler(-26, 7, -10));
    // ROV system
    this.rov = buildROV(); R.add(this.rov); this.rovBase = V3(-16, this.seabed + 7, 5);
    this.tether = tag(cyl(0.04, 400, M(0x222222), 0, 0, 0), 'rov'); R.add(this.tether);
    const tms = buildTMS(); tms.position.set(-16, this.seabed + 40, 5); R.add(tms);
    const rl = new THREE.PointLight(0xfff2cc, 80, 70, 1.5); rl.position.set(-12, this.seabed + 14, 8); R.add(rl);
    const hangar = grp('rovhangar'); hangar.add(boxUV(12, 8, 10, M(0xecf0f1, { metalness: 0.3 }), 38, 11, 15, 0.4)); const af = new Lattice(); af.add(V3(42, 15, 19), V3(44, 22, 23), 0.3); af.add(V3(34, 15, 19), V3(36, 22, 23), 0.3); af.add(V3(36, 22, 23), V3(44, 22, 23), 0.3); hangar.add(af.build(M(COL.yellow))); R.add(hangar);
    // forward accommodation
    R.add(quarters(84, 7, 0, 22, 18, 36, { bridge: true, name: 'UTM OCEAN PIONEER' })); R.add(helideck(108, 29, 0, 12));
    const dp = grp('dpsystem');
    dp.add(cyl(0.4, 10, M(COL.white), 78, 33, 8)); dp.add(sph(1.4, M(COL.white), 78, 38.5, 8)); dp.add(cyl(0.4, 8, M(COL.white), 78, 32, -8)); dp.add(box(3, 0.4, 0.4, M(COL.white), 78, 36, -8));
    dp.add(sph(0.9, M(COL.white), 88, 30, 12)); R.add(dp);
    R.add(pipeDeck(-50, 7, 0, 24, 30, 0xf1c40f, 'riserrack', 0.9, 3));
    R.add(pipeDeck(-90, 7, 0, 30, 28)); R.add(knuckleCrane(-70, 7, 15, -1.5));
    R.add(crane(-68, 7, -18, -1.6, 40)); R.add(crane(46, 7, -18, -1.4, 36)); R.add(crane(-104, 7, 16, 2.5, 34));
    R.add(mudModule(19, 7, -12)); R.add(chokeManifold(24, 7, 9)); R.add(accumulatorUnit(55, 7, 12)); R.add(cementUnit(56, 7, 0)); R.add(mgs(18, 7, 12));
    R.add(engineRoom(-100, 7, -14, 16, 10)); R.add(engineRoom(60, 7, -14, 18, 10));
    R.add(lifeboat(66, 10, 22.5, 0)); R.add(lifeboat(76, 10, 22.5, 0)); R.add(lifeboat(66, 10, -22.5, Math.PI)); R.add(lifeboat(76, 10, -22.5, Math.PI));
    R.add(liferafts(96, 7, 17, 4)); R.add(containers(-30, 7, 12, 4));
    this.thrusters = [];
    for (const [tx, tz] of [[88, -9], [88, 9], [100, 0], [-96, -11], [-96, 11], [-106, 0]]) { const t = thruster(tx, -16, tz); R.add(t); this.thrusters.push(t); }
    lbl(R, 'DRILLSHIP – DUAL DERRICK', 0, 118, 0, 14, BIG);
    lbl(R, 'Main well center', -8, 93, 6, 2.6); lbl(R, 'Auxiliary well center', 8, 93, -6, 2.6);
    lbl(R, 'Moonpool', -14, 8.5, 9.5, 1.0); lbl(R, 'Riser storage', -50, 14, 0, 2.6); lbl(R, 'Helideck', 108, 31, 0, 2.4);
    lbl(R, 'Azimuth thrusters (DP)', 92, -12, 18, 2.4); lbl(R, 'Marine riser (~2.2 km)', -6.5, -80, 0, 2.6);
    lbl(R, 'Spare BOP stack & gantry', -26, 28, -10, 2.0); lbl(R, 'ROV hangar', 38, 17, 15, 1.8); lbl(R, 'Mud module', 30, 15, -12, 1.8);
    lbl(R, 'Subsea BOP stack', -2, this.seabed + 19, 0, 1.4); lbl(R, `Seabed – water depth ${Math.round(this.waterDepth)} m`, -8, this.seabed + 24, 0, 2.4);
    lbl(R, 'Work-class ROV', -16, this.seabed + 9.5, 5, 1.0); lbl(R, 'Tether management system', -16, this.seabed + 44, 5, 1.0);
    this.time = 0;
  }
  update(dt) {
    this.time += dt; for (const p of this.packages) p.update(dt); this.mpUpdate(this.time);
    this.thrusters.forEach((t, i) => t.rotation.y = Math.sin(this.time * 0.2 + i) * 0.6);
    this.rov.position.set(this.rovBase.x + Math.sin(this.time * 0.3) * 1.5, this.rovBase.y + Math.sin(this.time * 0.5) * 0.4, this.rovBase.z);
    this.rov.rotation.y = Math.PI + Math.sin(this.time * 0.2) * 0.3;
    const top = this.seabed + 40; const len = top - this.rov.position.y - 0.9; this.tether.position.set(this.rov.position.x, this.rov.position.y + 0.9 + len / 2, this.rov.position.z); this.tether.scale.y = len;
  }
  views() {
    const p = this.root.position, sb = this.seabed;
    return {
      overview: [V3(p.x + 230, 95, p.z + 230), V3(p.x, 15, p.z)],
      floor: [V3(p.x - 3, 30, p.z + 22), V3(p.x - 8, 29.5, p.z)],
      dual: [V3(p.x + 40, 60, p.z + 60), V3(p.x, 40, p.z)],
      moonpool: [V3(p.x - 25, 12, p.z + 10), V3(p.x - 5, -1, p.z - 1)],
      moonpoolbelow: [V3(p.x + 6, -26, p.z + 26), V3(p.x - 2, -4, p.z)],
      mud: [V3(p.x + 40, 26, p.z - 34), V3(p.x + 26, 9, p.z - 6)],
      hull: [V3(p.x + 120, -28, p.z + 90), V3(p.x, -10, p.z)],
      bop: [V3(p.x + 14, sb + 13, p.z + 22), V3(p.x - 8, sb + 9, p.z)],
    };
  }
}
