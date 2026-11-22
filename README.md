# Offshore Drilling Rig Explorer (3D + VR)

An interactive teaching tool for petroleum engineering: fly from a **jack-up** in shallow water to a **semi-submersible** and a **dual-derrick drillship** in deep water, click any piece of equipment to learn what it does, and run drilling operations. Works in a normal browser and in VR (WebXR) on headsets such as Meta Quest.

## What's inside
- Jack-up with lattice legs, spudcans, jacking system, cantilever skidding over a fixed wellhead platform (with Christmas trees), surface BOP stack
- Semi-submersible with pontoons, columns, 8-line mooring spread, riser tensioners, telescopic joint, buoyant riser and subsea BOP at 1,500 m
- Drillship with dual derrick (main + auxiliary well centers), a detailed open moonpool (stiffened walls, walkways, wave dampers, sloshing water, moonpool cart), heave compensators, riser spider & gimbal, flow line, bow anchors, bollards, rescue boat, DP thrusters, spare BOP, riser storage, ROV & TMS at a 2,200 m subsea BOP
- Detailed rig equipment: top drive, traveling & crown blocks, drawworks, iron roughneck, pipe racker, driller's cabin, mud pumps, shakers, desander/desilter, centrifuge, degasser, mud pits, trip tank, choke manifold, accumulator unit, mud-gas separator, cement unit, cranes, lifeboats, helidecks and more
- Tool gallery: PDC & tricone bits, mud motor (cutaway), RSS, MWD/LWD, stabilizer, collar, jar, HWDP, drill pipe, casing & float equipment, centralizers, cement plugs, elevator, slips, tongs, safety valves, ram blocks, annular packer, overshot, mud balance, wellhead and casing-program cutaways, subsea and surface trees
- Subsurface: geological cross-sections under each rig with reservoir layers and gas/oil/water contacts, cutaway casing strings with cement and open hole, a directional well from the platform (plus producing wells), a vertical deepwater exploration well, and a horizontal pre-salt well – the drill string and bit in the hole follow the live drilling
- Operations: drill ahead (with connections), trip in / trip out, manual top drive, jack-up jacking sequence

## Publish free on GitHub Pages (no coding needed)
1. Sign in to GitHub → **New repository** (e.g. `rig-explorer`), set it to **Public**, create it.
2. Click **Add file → Upload files**, drag in everything from this folder (at least `index.html`), then **Commit changes**.
3. Go to **Settings → Pages** → *Build and deployment* → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**.
4. After about a minute your site is live at `https://<your-username>.github.io/rig-explorer/`.

## Use it in VR (Meta Quest)
Open the GitHub Pages link in the Quest **Browser** and press **Enter VR**. Left controller holds the menu; point with the right controller and pull the trigger to select parts or press buttons. Right stick moves, left stick up/down and turn, hold grip to move faster. (VR needs an HTTPS site, which GitHub Pages provides.)

## Editing / rebuilding
`index.html` is a self-contained build. To change models or text, edit files in `src/` (`parts.js` holds all the explanations) and rebuild:
```
npm install
npm run build
```
Then upload the new `index.html`.

| File | Contents |
|---|---|
| `src/main.js` | scene, sky/ocean, navigation, picking, UI, VR controls |
| `src/rigs.js` | jack-up, semi-submersible, drillship layouts |
| `src/drilling.js` | drill floor, derrick, top drive, drill-string animation |
| `src/equipment.js` | deck equipment (mud system, cranes, safety, well control) |
| `src/bop.js` | subsea & surface BOPs, riser, ROV, wellhead platform |
| `src/gallery.js` | tool gallery models |
| `src/subsurface.js` | geology, reservoir, casing program, well trajectories |
| `src/parts.js` | educational text for every clickable part |
| `src/lib.js` | modelling helpers, materials, textures |

Values shown are typical figures for teaching; models are simplified and some items (e.g. drill pipe) are exaggerated for visibility. Built with [three.js](https://threejs.org).
