import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { PARTS } from './parts.js';
import { V3, seabedY, makeLabel, lerp, clamp, bakeParts } from './lib.js';
import { Jackup, Semi, Drillship } from './rigs.js';
import { buildGallery } from './gallery.js';
import { jackupSubsurface, semiSubsurface, shipSubsurface } from './subsurface.js';

// ------------------------------------------------------------ renderer / scene
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.72;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 15000);
const dolly = new THREE.Group(); dolly.add(camera); scene.add(dolly);
camera.position.set(-2300, 520, 900);

// ------------------------------------------------------------ sky + environment lighting
const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 38), THREE.MathUtils.degToRad(210));
const sky = new Sky(); sky.scale.setScalar(10000);
const su = sky.material.uniforms; su.turbidity.value = 8; su.rayleigh.value = 2.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8; su.sunPosition.value.copy(SUN_DIR);
const pmrem = new THREE.PMREMGenerator(renderer); const skyScene = new THREE.Scene(); skyScene.add(sky);
const envTex = pmrem.fromScene(skyScene, 0, 0.1, 20000).texture;
scene.environment = envTex; scene.background = envTex; scene.environmentIntensity = 0.32; scene.backgroundIntensity = 0.32;
const SKY_FOG = new THREE.Color(0x9fbfd6);
const fogAir = new THREE.Fog(SKY_FOG, 1200, 9000); scene.fog = fogAir;

scene.add(new THREE.HemisphereLight(0xdff0ff, 0x4a4a40, 0.45));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.copy(SUN_DIR).multiplyScalar(300);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
const sc = sun.shadow.camera; sc.left = -130; sc.right = 130; sc.top = 130; sc.bottom = -130; sc.near = 10; sc.far = 900;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);

// ------------------------------------------------------------ ocean (PBR water with scrolling normal maps)
function waterNormals() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); const img = g.createImageData(N, N);
  let sd = 3; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const W = []; for (let i = 0; i < 18; i++) { let kx = Math.round(rr() * 12 - 6), ky = Math.round(rr() * 12 - 6); if (!kx && !ky) kx = 1; W.push([kx, ky, rr() * 6.28, 1 / Math.hypot(kx, ky)]); }
  const h = (x, y) => { let v = 0; for (const [a, b, ph, am] of W) v += Math.sin((a * x + b * y) * Math.PI * 2 / N + ph) * am; return v; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1); const n = V3(-dx * 10, -dy * 10, 1).normalize(); img.data.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], (y * N + x) * 4); }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 38); return t;
}
const OW = 8000, OD = 4400;
const oceanGeo = new THREE.PlaneGeometry(OW, OD, 140, 80); oceanGeo.rotateX(-Math.PI / 2);
const wN = waterNormals();
const oceanMat = new THREE.MeshPhysicalMaterial({ color: 0x0c3f5a, roughness: 0.12, metalness: 0.0, normalMap: wN, normalScale: new THREE.Vector2(0.22, 0.22), transparent: true, opacity: 0.9, side: THREE.DoubleSide, envMapIntensity: 0.8 });
const ocean = new THREE.Mesh(oceanGeo, oceanMat); ocean.position.x = 200; ocean.renderOrder = 2; ocean.receiveShadow = true; scene.add(ocean);
const oPos = oceanGeo.attributes.position; const oBase = Float32Array.from(oPos.array);

// ------------------------------------------------------------ seabed
const sbGeo = new THREE.PlaneGeometry(OW, OD, 300, 90); sbGeo.rotateX(-Math.PI / 2);
const sp = sbGeo.attributes.position; const cols = [];
const cShallow = new THREE.Color(0xc8b27c), cDeep = new THREE.Color(0x4b5257), tmp = new THREE.Color();
for (let i = 0; i < sp.count; i++) {
  const x = sp.getX(i) + 200, z = sp.getZ(i); const y = seabedY(x, z); sp.setY(i, y);
  tmp.copy(cShallow).lerp(cDeep, clamp(-y / 1600, 0, 1)); tmp.offsetHSL(0, 0, (Math.sin(x * 0.07) * Math.cos(z * 0.05)) * 0.03); cols.push(tmp.r, tmp.g, tmp.b);
}
sbGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); sbGeo.computeVertexNormals();
const seabed = new THREE.Mesh(sbGeo, new THREE.MeshLambertMaterial({ vertexColors: true })); seabed.position.x = 200; seabed.receiveShadow = true; scene.add(seabed);

function zoneSign(text, x, y, z, h) { const l = makeLabel(text, h, { always: true, border: 'rgba(255,255,255,.7)', bg: 'rgba(10,40,70,.75)' }); l.userData.hideNear = 750; l.position.set(x, y, z); scene.add(l); }
zoneSign('SHALLOW WATER · continental shelf · ~90 m', -1500, 170, -260, 22);
zoneSign('DEEPWATER · ~1,500 m', 600, 190, -260, 22);
zoneSign('ULTRA-DEEPWATER · ~2,200 m', 1800, 200, -60, 22);
zoneSign('Continental slope ↓', -300, 60, -200, 18);

// ------------------------------------------------------------ rigs + gallery
const rigs = [new Jackup(-1500, 0), new Semi(600, 0), new Drillship(1800, 220)];
const galleryRoot = buildGallery(-1500, -460);
const gallery = { key: 'gallery', name: 'Tool gallery', zone: 'Training', root: galleryRoot, packages: [], waterDepth: 90,
  views() { const p = galleryRoot.position; return {
    overview: [V3(p.x + 10, 48, p.z + 62), V3(p.x, 14, p.z)],
    bits: [V3(p.x - 37, 19, p.z - 5.5), V3(p.x - 37, 15.2, p.z - 13)],
    motor: [V3(p.x - 30, 18.2, p.z - 7.5), V3(p.x - 28.5, 15.6, p.z - 13)],
    bha: [V3(p.x + 4, 22, p.z + 2), V3(p.x + 8, 15.5, p.z - 13)],
    tools: [V3(p.x - 18, 19.5, p.z + 9), V3(p.x - 18, 15.5, p.z)],
    tools2: [V3(p.x + 14, 20.5, p.z + 10), V3(p.x + 14, 15.5, p.z)],
    wellhead: [V3(p.x - 20, 25, p.z + 36), V3(p.x - 20, 18, p.z + 13)],
  }; } };
const selectables = [...rigs, gallery];
for (const r of selectables) { bakeParts(r.root); scene.add(r.root); r.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
const byKey = Object.fromEntries(selectables.map(r => [r.key, r]));
// ---- subsurface: geology + wellbores beneath each rig
scene.updateMatrixWorld(true);
const [JU, SS, DSH] = rigs;
JU.sub = jackupSubsurface(V3(JU.root.position.x + JU.wellX, JU.seabed, JU.root.position.z), JU.pkg);
SS.sub = semiSubsurface(V3(SS.root.position.x, SS.seabed, SS.root.position.z), SS.pkg);
DSH.sub = shipSubsurface(V3(DSH.root.position.x - 8, DSH.seabed, DSH.root.position.z), DSH.main, DSH.aux);
const subs = [JU.sub, SS.sub, DSH.sub];
for (const r of rigs) { r.sub.rig = r; scene.add(r.sub.root);
  for (const W of r.sub.wells) if (W.pkg) { const fl = V3(); W.pkg.root.getWorldPosition(fl); const mud = r.sub.cfg.origin.y; W.pkg.bitDepth = (fl.y - mud) + W.holeTD; } }
let subsurfaceOn = false;
function setSubsurface(on) {
  subsurfaceOn = on; for (const sb of subs) sb.root.visible = on;
  seabed.material.transparent = on; seabed.material.opacity = on ? 0.28 : 1; seabed.material.depthWrite = !on; seabed.material.needsUpdate = true;
  const b = document.getElementById('btnSub'); if (b) b.classList.toggle('on', on);
}
function subViews(r) {
  const O = r.sub.cfg.origin, k = r.key;
  const W = r.sub.wells.find(w => w.pkg === pkg()) || r.sub.wells[0];
  const bp = W.path.at(Math.max(5, W.lastBit)); const bit = [V3(bp.x + 12, bp.y + 14, bp.z + 55), bp.clone()];
  const shoes = [V3(O.x + 9, O.y - 82, O.z + 26), V3(O.x, O.y - 96, O.z)];
  if (k === 'jackup') return { well: [V3(O.x - 820, O.y - 1250, O.z + 2450), V3(O.x - 820, O.y - 1250, O.z)], reservoir: [V3(O.x - 1350, O.y - 1700, O.z + 900), V3(O.x - 1450, O.y - 2250, O.z)], shoes, bit };
  if (k === 'semi') return { well: [V3(O.x, O.y - 1880, O.z + 3400), V3(O.x, O.y - 1880, O.z)], reservoir: [V3(O.x + 250, O.y - 2850, O.z + 800), V3(O.x, O.y - 3250, O.z)], shoes, bit };
  return { well: [V3(O.x + 700, O.y - 1680, O.z + 2950), V3(O.x + 700, O.y - 1680, O.z)], reservoir: [V3(O.x + 900, O.y - 2600, O.z + 900), V3(O.x + 900, O.y - 3020, O.z)], shoes, bit };
}
let active = rigs[0]; let activePkg = 0;

// ------------------------------------------------------------ controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxDistance = 9000; controls.minDistance = 0.5;
controls.target.set(-1500, 20, 0); controls.screenSpacePanning = true;

// ------------------------------------------------------------ fly-to
let fly = null;
function flyTo(pos, target, dur) {
  const from = camera.position.clone(), fromT = controls.target.clone(); const dist = from.distanceTo(pos);
  dur = dur ?? clamp(1.2 + dist / 1200, 1.2, 4.5);
  fly = { from, fromT, pos: pos.clone(), target: target.clone(), t: 0, dur, arc: dist > 600 ? Math.min(dist * 0.25, 700) : 0 };
  controls.enabled = false;
}
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function updateFly(dt) {
  if (!fly) return; fly.t += dt / fly.dur; const k = ease(Math.min(1, fly.t));
  camera.position.lerpVectors(fly.from, fly.pos, k); camera.position.y += Math.sin(Math.PI * k) * fly.arc;
  controls.target.lerpVectors(fly.fromT, fly.target, k); camera.lookAt(controls.target);
  if (fly.t >= 1) { fly = null; controls.enabled = true; }
}
function goView(key, view) {
  const r = byKey[key]; setActive(r);
  const sv = r.sub && subViews(r)[view];
  if (sv) setSubsurface(true); else if (subsurfaceOn && view !== 'bop' && view !== 'seabed' && view !== 'hull') setSubsurface(false);
  const v = sv || r.views()[view] || r.views().overview;
  if (renderer.xr.isPresenting) { vrTeleport(v[0], v[1]); return; }
  flyTo(v[0], v[1]);
}
function goOverview() { flyTo(V3(-2300, 520, 900), V3(-1500, 20, 0)); }
function goAll() { flyTo(V3(200, 2200, 3400), V3(300, -600, 0)); }

// ------------------------------------------------------------ picking & info (highlight by material swap)
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let selected = null; const swapped = []; const hlCache = new Map();
function hlMat(m) { if (!hlCache.has(m)) { const c = m.clone(); if (c.emissive) { c.emissive.setHex(0x8a6a00); c.emissiveIntensity = 0.9; } hlCache.set(m, c); } return hlCache.get(m); }
function partOf(obj) { while (obj) { if (obj.userData && obj.userData.part) return obj; obj = obj.parent; } return null; }
function highlight(obj) {
  for (const [o, m] of swapped) o.material = m; swapped.length = 0; selected = obj; if (!obj) return;
  obj.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && (o === obj || partOf(o) === obj)) { swapped.push([o, o.material]); o.material = hlMat(o.material); } });
}
function pickFromRay(rc) {
  const hits = rc.intersectObjects([...selectables.map(r => r.root), ...subs.map(s => s.root)], true);
  for (const h of hits) { if (!h.object.visible) continue; let v = true, a = h.object; while (a) { if (!a.visible) { v = false; break; } a = a.parent; } if (!v) continue; const p = partOf(h.object); if (p) return { obj: p, point: h.point }; }
  return null;
}
function selectPart(hit) {
  if (!hit) { highlight(null); showInfo(null); return; }
  if (hit.obj.userData.layerAt) { highlight(null); const l = hit.obj.userData.layerAt(hit.point); showInfo(l.key, l.name); }
  else { highlight(hit.obj); showInfo(hit.obj.userData.part); }
  const owner = (root) => { let o = hit.obj; while (o) { if (o === root) return true; o = o.parent; } return false; };
  const r = selectables.find(r => owner(r.root) || (r.sub && owner(r.sub.root)));
  if (r && r !== active) setActive(r);
}
const infoEl = document.getElementById('info');
function showInfo(key, title) {
  let p = key && PARTS[key]; if (p && title && title !== p.name) p = { ...p, name: title, cat: p.cat };
  if (!p) { infoEl.classList.add('hidden'); vrInfo(null); return; }
  infoEl.classList.remove('hidden');
  infoEl.innerHTML = `<button class="x" onclick="this.parentNode.classList.add('hidden')">×</button>
    <div class="cat">${p.cat}</div><h2>${p.name}</h2>
    <h4>What it is</h4><p>${p.what}</p><h4>How it works</h4><p>${p.how}</p>
    ${p.facts.length ? '<h4>Key facts</h4><ul>' + p.facts.map(f => `<li>${f}</li>`).join('') + '</ul>' : ''}`;
  vrInfo(p);
}
let downPos = null;
renderer.domElement.addEventListener('pointerdown', e => { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downPos || Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 5) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera); selectPart(pickFromRay(ray));
});

// ------------------------------------------------------------ UI
const $ = id => document.getElementById(id);
function setActive(r) {
  active = r; activePkg = 0; buildOps();
  document.querySelectorAll('.rigbtn').forEach(b => b.classList.toggle('on', !!r && b.dataset.rig === r.key));
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { const [rig, view] = b.dataset.view.split(':'); goView(rig, view); }));
$('btnHome').onclick = goOverview; $('btnAll').onclick = goAll;
let labelsOn = true, shadowsOn = true;
$('btnLabels').onclick = () => { labelsOn = !labelsOn; $('btnLabels').classList.toggle('on', labelsOn); setLabels(); };
$('btnShadows').onclick = () => { shadowsOn = !shadowsOn; $('btnShadows').classList.toggle('on', shadowsOn); sun.castShadow = shadowsOn; };
$('btnSub').onclick = () => setSubsurface(!subsurfaceOn);
$('btnHelp').onclick = () => $('help').classList.toggle('hidden');
$('help').onclick = () => $('help').classList.add('hidden');
const bigLabels = []; scene.traverse(o => { if (o.userData.isLabel && o.userData.always) bigLabels.push(o); });
function updateBigLabels() { const cp = V3(); camera.getWorldPosition(cp); const wp = V3(); for (const l of bigLabels) { l.getWorldPosition(wp); l.visible = cp.y > 0 && cp.distanceTo(wp) > (l.userData.hideNear || 260); }
  if (subsurfaceOn) for (const sb of subs) for (const l of sb.labels) { if (l.userData.forceHidden) continue; l.getWorldPosition(wp); l.visible = labelsOn && cp.distanceTo(wp) < l.userData.maxDist && l.userData.okVis !== false; } }
function setLabels() { scene.traverse(o => { if (o.userData.isLabel && !o.userData.always) o.visible = labelsOn; }); }

const pkg = () => active ? active.packages[activePkg] : null;
function buildOps() {
  const el = $('ops');
  if (!active || !active.packages.length) { el.innerHTML = active ? `<div class="opsHead"><b>${active.name}</b> <span class="dim">· click any tool to learn how it works</span></div><div class="dim" style="font-size:12px">Tools are shown enlarged and not to scale with each other.</div>` : '<div class="dim">Fly to a rig to operate it.</div>'; return; }
  let h = `<div class="opsHead"><b>${active.name}</b> <span class="dim">· ${active.zone} · WD ${Math.round(active.waterDepth)} m</span></div>`;
  if (active.packages.length > 1) h += `<div class="seg"><button data-pk="0" class="${activePkg === 0 ? 'on' : ''}">Main well center</button><button data-pk="1" class="${activePkg === 1 ? 'on' : ''}">Aux well center</button></div>`;
  h += `<div class="row"><button data-op="drill">▶ Drill ahead</button><button data-op="tripout">⬆ Trip out</button><button data-op="tripin">⬇ Trip in</button><button data-op="idle">■ Stop</button></div>
  <label class="sl">Top drive position <input id="tdSlider" type="range" min="0" max="1" step="0.001"></label>`;
  if (active.key === 'jackup') h += `<div class="row"><button id="btnJack">⇅ Jack down / up (with cantilever skid)</button></div>`;
  h += `<div id="readout" class="readout"></div><div id="status" class="status"></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => { activePkg = +b.dataset.pk; buildOps(); });
  el.querySelectorAll('[data-op]').forEach(b => b.onclick = () => doOp(b.dataset.op));
  $('tdSlider').oninput = e => pkg().setManual(+e.target.value);
  if ($('btnJack')) $('btnJack').onclick = () => active.jackToggle();
}
function doOp(op) { const p = pkg(); if (!p) return; if (!p.enabled) { flash('Jack the rig up and skid the cantilever out before drilling.'); return; } p.setMode(op); }
function flash(t) { const s = $('status'); if (s) { s.textContent = t; s.classList.add('warn'); setTimeout(() => s.classList.remove('warn'), 1800); } }
function bitBML(p) { if (!active.sub) return ''; const W = active.sub.wells.find(w => w.pkg === p); if (!W) return ''; const fl = V3(); p.root.getWorldPosition(fl); const md = p.bitDepth - (fl.y - active.sub.cfg.origin.y); const inc = md > 0 ? W.path.incAt(md) : 0; return `<span>Below mudline <b>${Math.max(0, Math.round(md)).toLocaleString()} m MD</b></span><span>Inclination <b>${inc.toFixed(0)}°</b></span>`; }
function updateOps() {
  const p = pkg(); if (!p) return;
  const sl = $('tdSlider'); if (sl && document.activeElement !== sl) sl.value = p.tdNorm;
  const ro = $('readout');
  if (ro) ro.innerHTML = `<span>Bit depth <b>${Math.round(p.bitDepth).toLocaleString()} m</b></span><span>RPM <b>${Math.round(p.rpm)}</b></span><span>Hook load <b>${Math.round(p.hookLoad)} t</b></span><span>Stands racked <b>${p.setback}</b></span><span>Block height <b>${p.tdY.toFixed(1)} m</b></span>${bitBML(p)}`;
  const st = $('status'); if (st && !st.classList.contains('warn')) st.textContent = (active.key === 'jackup' && active.j !== 3 ? active.jackStatus : p.status) + (p.busy ? '  (time accelerated)' : '');
}
buildOps();

// ------------------------------------------------------------ keyboard fly
const keys = {};
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys[e.code] = true; });
addEventListener('keyup', e => { keys[e.code] = false; });
function keyFly(dt) {
  if (renderer.xr.isPresenting || fly) return;
  const f = V3(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const r = V3().crossVectors(f, V3(0, 1, 0));
  const spd = (keys.ShiftLeft || keys.ShiftRight ? 300 : 30) * dt; const mv = V3();
  if (keys.KeyW) mv.add(f); if (keys.KeyS) mv.sub(f); if (keys.KeyD) mv.add(r); if (keys.KeyA) mv.sub(r);
  if (keys.KeyE) mv.y += 1; if (keys.KeyQ) mv.y -= 1;
  if (mv.lengthSq()) { mv.normalize().multiplyScalar(spd); camera.position.add(mv); controls.target.add(mv); }
}

// ------------------------------------------------------------ underwater environment + shadow follow
const UW_TOP = new THREE.Color(0x1b6a8a), UW_DEEP = new THREE.Color(0x02101c);
const fogUW = new THREE.FogExp2(0x0b3a55, 0.0045); const uwBg = new THREE.Color(); const UNDERGROUND = new THREE.Color(0x15120e);
function updateEnv() {
  const p = V3(); camera.getWorldPosition(p);
  const sbY = seabedY(p.x, p.z);
  if (p.y < sbY - 1) { scene.fog = null; scene.background = UNDERGROUND; scene.environmentIntensity = 0.3; }
  else if (p.y < 0) { const k = clamp(-p.y / 1200, 0, 1); uwBg.copy(UW_TOP).lerp(UW_DEEP, k); scene.fog = fogUW; fogUW.color.copy(uwBg); fogUW.density = lerp(0.006, 0.0035, k) * (subsurfaceOn ? 0.15 : 1); scene.background = uwBg; scene.environmentIntensity = lerp(0.3, 0.08, k); }
  else { scene.fog = fogAir; scene.background = envTex; scene.environmentIntensity = 0.32; }
  const sb = seabedY(p.x, p.z);
  if (p.y < sbY - 1) $('pos').innerHTML = `Underground: <b>${(sbY - p.y).toFixed(0)} m</b> below mudline (TVD) · water depth ${(-sbY).toFixed(0)} m`; else $('pos').innerHTML = p.y >= 0 ? `Elevation <b>+${p.y.toFixed(0)} m</b> · Water depth here <b>${(-sb).toFixed(0)} m</b>` : `Depth <b>${(-p.y).toFixed(0)} m</b> below sea level · Seabed <b>${(-sb).toFixed(0)} m</b>`;
  // keep the shadow box around what we're looking at
  const focus = renderer.xr.isPresenting ? p : controls.target; const f = V3(focus.x, Math.max(0, focus.y), focus.z);
  const d = Math.min(camera.position.distanceTo(controls.target), 400);
  const half = clamp(d * 0.9, 40, 160); sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix();
  sun.target.position.copy(f); sun.position.copy(f).addScaledVector(SUN_DIR, 400);
}

// ------------------------------------------------------------ WebXR (VR mode)
const vrBtn = VRButton.createButton(renderer); vrBtn.id = 'vrbtn'; document.body.appendChild(vrBtn);
const menuCanvas = document.createElement('canvas'); menuCanvas.width = 1024; menuCanvas.height = 1000;
const menuTex = new THREE.CanvasTexture(menuCanvas); menuTex.colorSpace = THREE.SRGBColorSpace;
const menu = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42 * 1000 / 1024), new THREE.MeshBasicMaterial({ map: menuTex, transparent: true, fog: false, depthTest: false }));
menu.renderOrder = 1000;
const infoCanvas = document.createElement('canvas'); infoCanvas.width = 1024; infoCanvas.height = 900;
const infoTex = new THREE.CanvasTexture(infoCanvas); infoTex.colorSpace = THREE.SRGBColorSpace;
const infoPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9 * 900 / 1024), new THREE.MeshBasicMaterial({ map: infoTex, transparent: true, fog: false, depthTest: false }));
infoPanel.renderOrder = 1000; infoPanel.visible = false; dolly.add(infoPanel);
const MENU = [
  ['Jack-up', () => goView('jackup', 'overview')], ['Semi-sub', () => goView('semi', 'overview')], ['Drillship', () => goView('ship', 'overview')],
  ['Drill floor', () => goView(active?.packages.length ? active.key : 'jackup', 'floor')], ['BOP stack', () => goView(active?.packages.length ? active.key : 'jackup', 'bop')], ['Mud system', () => goView(active?.packages.length ? active.key : 'jackup', 'mud')],
  ['Tool gallery', () => goView('gallery', 'overview')], ['Bits & BHA', () => goView('gallery', 'bits')], ['Wellhead', () => goView('gallery', 'wellhead')],
  ['▶ Drill', () => doOp('drill')], ['⬆ Trip out', () => doOp('tripout')], ['⬇ Trip in', () => doOp('tripin')],
  ['TD up', () => pkg()?.setManual(Math.min(1, pkg().tdNorm + 0.25))], ['TD down', () => pkg()?.setManual(Math.max(0, pkg().tdNorm - 0.25))], ['■ Stop', () => doOp('idle')],
  ['Main/Aux', () => { if (active?.packages.length > 1) { activePkg = 1 - activePkg; buildOps(); } }], ['Jack ⇅', () => active?.jackToggle?.()], ['Labels', () => { labelsOn = !labelsOn; setLabels(); }],
  ['Wellbore', () => goView(active?.sub ? active.key : 'jackup', 'well')], ['Reservoir', () => goView(active?.sub ? active.key : 'jackup', 'reservoir')], ['Subsurface ⇅', () => setSubsurface(!subsurfaceOn)],
];
function drawMenu() {
  const g = menuCanvas.getContext('2d'); g.clearRect(0, 0, 1024, 1000);
  g.fillStyle = 'rgba(10,20,32,.92)'; g.beginPath(); g.roundRect(0, 0, 1024, 1000, 30); g.fill();
  g.fillStyle = '#ffc83c'; g.font = '600 40px Arial'; g.textAlign = 'left'; g.fillText('RIG EXPLORER  ·  ' + (active ? active.name : ''), 30, 60);
  const p = pkg(); g.fillStyle = '#cfe3f2'; g.font = '30px Arial';
  g.fillText(p ? `Bit ${Math.round(p.bitDepth)} m · ${Math.round(p.rpm)} rpm · Hook ${Math.round(p.hookLoad)} t · ${activePkg ? 'AUX' : 'MAIN'}` : 'Point & pull trigger on any part', 30, 105);
  MENU.forEach(([t], i) => { const c = i % 3, r = Math.floor(i / 3); const x = 30 + c * 325, y = 130 + r * 122;
    g.fillStyle = i < 3 ? '#1f5f8b' : i < 6 ? '#2d6a4f' : i < 9 ? '#7a5c1f' : i < 18 ? '#5a3d7a' : '#6b4226'; g.beginPath(); g.roundRect(x, y, 305, 105, 18); g.fill();
    g.fillStyle = '#fff'; g.font = '600 38px Arial'; g.textAlign = 'center'; g.fillText(t, x + 152, y + 66); g.textAlign = 'left'; });
  menuTex.needsUpdate = true;
}
function menuHit(uv) { const x = uv.x * 1024, y = (1 - uv.y) * 880; const c = Math.floor((x - 30) / 325), r = Math.floor((y - 130) / 122); if (c < 0 || c > 2 || r < 0) return; MENU[r * 3 + c]?.[1](); }
function wrap(g, text, x, y, w, lh) { const words = text.split(' '); let line = ''; for (const wd of words) { const t = line + wd + ' '; if (g.measureText(t).width > w && line) { g.fillText(line, x, y); y += lh; line = wd + ' '; } else line = t; } g.fillText(line, x, y); return y + lh; }
function vrInfo(p) {
  if (!p) { infoPanel.visible = false; return; }
  const g = infoCanvas.getContext('2d'); g.clearRect(0, 0, 1024, 900);
  g.fillStyle = 'rgba(10,20,32,.92)'; g.beginPath(); g.roundRect(0, 0, 1024, 900, 30); g.fill();
  g.fillStyle = '#ffc83c'; g.font = '28px Arial'; g.fillText(p.cat.toUpperCase(), 36, 54);
  g.fillStyle = '#fff'; g.font = '600 50px Arial'; g.fillText(p.name, 36, 112);
  g.font = '29px Arial'; g.fillStyle = '#dfe9f2'; let y = wrap(g, p.what, 36, 170, 950, 38);
  g.fillStyle = '#9fd3ff'; y = wrap(g, p.how, 36, y + 14, 950, 38);
  g.fillStyle = '#c8e6c9'; for (const f of p.facts.slice(0, 3)) y = wrap(g, '• ' + f, 36, y + 6, 950, 36);
  infoTex.needsUpdate = true;
  if (renderer.xr.isPresenting) {
    const head = renderer.xr.getCamera(); const pos = V3(), q = new THREE.Quaternion(); head.getWorldPosition(pos); head.getWorldQuaternion(q);
    const fwd = V3(0, 0, -1).applyQuaternion(q); fwd.y = 0; fwd.normalize();
    const wp = pos.clone().addScaledVector(fwd, 1.6); dolly.worldToLocal(wp); infoPanel.position.copy(wp);
    infoPanel.lookAt(pos); infoPanel.visible = true;
  }
}
const controllers = [];
const rayGeo = new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(0, 0, -1)]);
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i); dolly.add(c);
  const line = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: 0xffd34d })); line.scale.z = 30; c.add(line);
  c.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.12), new THREE.MeshStandardMaterial({ color: 0x333333 })));
  c.addEventListener('connected', e => { c.userData.hand = e.data.handedness; if (e.data.handedness === 'left' || (!menu.parent && i === 0)) { c.add(menu); menu.position.set(0, 0.12, -0.12); menu.rotation.x = -0.7; } });
  c.addEventListener('selectstart', () => onVRSelect(c));
  controllers.push(c);
}
function onVRSelect(c) {
  const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
  const rc = new THREE.Raycaster(); rc.ray.origin.setFromMatrixPosition(c.matrixWorld); rc.ray.direction.set(0, 0, -1).applyMatrix4(m);
  if (menu.parent && menu.parent !== c) { const h = rc.intersectObject(menu); if (h.length) { menuHit(h[0].uv); drawMenu(); return; } }
  if (infoPanel.visible && rc.intersectObject(infoPanel).length) { infoPanel.visible = false; return; }
  selectPart(pickFromRay(rc));
}
function vrTeleport(pos, target) { dolly.position.set(pos.x, pos.y - 1.6, pos.z); dolly.rotation.y = Math.atan2(-(target.x - pos.x), -(target.z - pos.z)); }
let savedCam = null;
renderer.xr.addEventListener('sessionstart', () => {
  savedCam = [camera.position.clone(), controls.target.clone()]; controls.enabled = false; fly = null;
  vrTeleport(camera.position, controls.target); drawMenu(); document.body.classList.add('invr');
  sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
});
renderer.xr.addEventListener('sessionend', () => {
  dolly.position.set(0, 0, 0); dolly.rotation.set(0, 0, 0); infoPanel.visible = false; controls.enabled = true;
  if (savedCam) { camera.position.copy(savedCam[0]); controls.target.copy(savedCam[1]); } document.body.classList.remove('invr');
  sun.shadow.mapSize.set(4096, 4096); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
});
function vrLocomotion(dt) {
  const session = renderer.xr.getSession(); if (!session) return;
  const head = renderer.xr.getCamera(); const q = new THREE.Quaternion(); head.getWorldQuaternion(q);
  const fwd = V3(0, 0, -1).applyQuaternion(q); fwd.y = 0; fwd.normalize(); const right = V3().crossVectors(fwd, V3(0, 1, 0));
  for (const src of session.inputSources) {
    const gp = src.gamepad; if (!gp || gp.axes.length < 4) continue;
    const x = gp.axes[2], y = gp.axes[3]; const dead = v => Math.abs(v) < 0.15 ? 0 : v;
    const boost = gp.buttons[1]?.pressed ? 8 : 1;
    if (src.handedness === 'right') { dolly.position.addScaledVector(fwd, -dead(y) * 5 * boost * dt); dolly.position.addScaledVector(right, dead(x) * 5 * boost * dt); }
    else { dolly.position.y += -dead(y) * 4 * boost * dt; dolly.rotation.y -= dead(x) * 1.5 * dt; }
  }
}

// ------------------------------------------------------------ loop
const timer = new THREE.Timer(); let menuTimer = 0, time = 0;
renderer.setAnimationLoop((ts) => {
  timer.update(ts); const dt = Math.min(timer.getDelta(), 0.05); time += dt;
  for (let i = 0; i < oPos.count; i++) { const x = oBase[i * 3], z = oBase[i * 3 + 2]; oPos.array[i * 3 + 1] = Math.sin(x * 0.03 + time * 0.9) * 0.6 + Math.sin(z * 0.045 - time * 1.3) * 0.4; }
  oPos.needsUpdate = true; wN.offset.set(time * 0.004, time * 0.0025);
  for (const r of rigs) r.update(dt);
  if (subsurfaceOn) { let best = null, bd = 1e9; for (const sb of subs) { const c = sb.cfg.origin; const dd = Math.hypot(controls.target.x - c.x - sb.d.x * (sb.cfg.uMin + sb.cfg.uMax) / 2, controls.target.z - c.z); if (dd < bd) { bd = dd; best = sb; } }
    for (const sb of subs) { sb.root.visible = sb === best; if (sb === best) sb.update(); } }
  updateFly(dt); keyFly(dt);
  if (renderer.xr.isPresenting) { vrLocomotion(dt); menuTimer += dt; if (menuTimer > 0.25) { menuTimer = 0; drawMenu(); } }
  else controls.update();
  if (renderer.xr.isPresenting) { const cp = V3(); camera.getWorldPosition(cp); for (const r of selectables) r.root.visible = Math.hypot(cp.x - r.root.position.x, cp.z - r.root.position.z) < 1400 || cp.y > 400; }
  else for (const r of selectables) r.root.visible = true;
  updateOps(); updateEnv(); updateBigLabels();
  renderer.render(scene, camera);
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

window.__rig = { setSubsurface, subs, jumpSub: (rk, v) => { const r = byKey[rk]; setActive(r); setSubsurface(true); const w = subViews(r)[v]; camera.position.copy(w[0]); controls.target.copy(w[1]); fly = null; }, jump: (rk, v) => { const r = byKey[rk]; setActive(r); const w = r.views()[v]; camera.position.copy(w[0]); controls.target.copy(w[1]); fly = null; controls.enabled = true; }, goView, rigs, camera, controls, selectPart, showInfo, doOp: (o) => doOp(o), setActive, renderer, scene };
setActive(rigs[0]);
