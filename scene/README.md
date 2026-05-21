# Homepage hero scene

This folder powers the full-bleed 3D scene embedded on the homepage
(`index.html` loads it in an `<iframe src="/scene/">`).

## Two modes

| URL | What you get |
|-----|--------------|
| `/scene/` | Clean, full-bleed hero. All controls hidden. This is what the homepage shows. |
| `/scene/?edit` | The **full studio UI** — every panel: lighting, motion, words, physics/vortex, materials, objects. Zoom/pan enabled. |

## How to change the live scene

1. Run the site locally (so `fetch` works):
   ```
   cd /Users/christiansolorzano/Documents/OPL
   python3 -m http.server 8000
   ```
   Then open **http://localhost:8000/scene/?edit**

2. Tweak whatever you want with the panel on the right:
   - **Word Groups** — change the words / colors / layout
   - per-object **Spin Speed / Orbit Speed / Orbit Radius / Tilt** — the motion
   - **Auto Rotate** (under Lighting & Environment) — global camera spin on the live hero
   - **Physics / Vortex** — alternate motion modes
   - **Lighting & Environment**, **Material** — look & feel

3. Click **⬇ Save Live Scene (scene.json)** (bottom of the panel, under
   "My Saved Designs"). This downloads `scene.json`.

4. Move that file to **`/scene/scene.json`** (replace the old one), then commit & push:
   ```
   git add scene/scene.json
   git commit -m "Update homepage scene"
   git push
   ```
   GitHub Pages redeploys and the homepage hero uses the new look on next load.

## How it loads

On boot, `bootScene()` tries to `fetch('scene.json')`.
- **If present** → it restores that exact state (words, motion, lighting, layout, etc.).
- **If absent** → it falls back to the built-in `defaultScene()` (the current look).

So you can delete `scene.json` at any time to revert to the coded default.

## Notes

- The live hero (`/scene/`) always re-frames the camera to fill the viewport, so the
  composition stays responsive across screen sizes. In `?edit` the camera you leave is
  kept while composing.
- Motion that persists in `scene.json`: per-object spin/orbit/tilt, word layout,
  auto-rotate, lighting, materials, links, camera. (Physics/vortex slider values are
  not yet serialized — they're live-only for experimenting.)
- The default font is embedded (`assets/font-data.js`) so glyphs render even before
  the network font loads.
