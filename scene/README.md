# Homepage hero scene

This folder powers the full-bleed 3D scene embedded on the homepage
(`index.html` loads it in an `<iframe src="/scene/">`).

## Two modes

| URL | What you get |
|-----|--------------|
| `/scene/` | Clean, full-bleed hero. All controls hidden. This is what the homepage shows. |
| `/scene/?edit` | The **full studio UI** — lighting, motion, words, physics/vortex, materials, objects. Zoom/pan enabled. |

## The workflow: you compose, Claude publishes

1. **Compose** — open the studio (locally is easiest):
   ```
   cd /Users/christiansolorzano/Documents/OPL
   python3 -m http.server 8000
   ```
   Go to **http://localhost:8000/scene/?edit** and design the scene
   (words, motion, lighting, etc.).

2. **Save a version** — in the **Save / Publish** panel, type an optional title and
   click **⬇ Save version**. This downloads `opal-scene-<timestamp>[-title].json`
   to your Downloads.

3. **Tell Claude to publish** — say *"publish"* (or "publish the boundless one").
   Claude will:
   - move the file into `scene/statements/<id>.json`
   - add it to `manifest.json` and set it as `active` (the live one)
   - commit & push → the homepage updates in ~1 min.

You don't commit anything yourself — Claude handles publishing.

## Version history & reverting

Every published scene is kept as its own timestamped file in `scene/statements/`,
listed in `manifest.json`:

```json
{
  "active": "20260520-2106-boundless",
  "versions": [
    { "id": "20260520-2106-boundless", "title": "Boundless", "ts": "2026-05-20T21:06:00.000Z" },
    { "id": "20260514-0930-mindful",   "title": "Mindful",   "ts": "2026-05-14T09:30:00.000Z" }
  ]
}
```

- **Revisit / enhance an old one:** in `?edit`, pick it under **Revisit a published
  version → Load**, tweak it, then Save version again (a new timestamp — the old one
  stays).
- **Revert the live scene:** just tell Claude *"revert the homepage to <version>"* and
  it re-points `active` and pushes. Nothing is ever overwritten.

## How the live hero loads

`bootScene()` reads `statements/manifest.json` → finds `active` → loads
`statements/<active>.json`. If there's no active version it falls back to the built-in
`defaultScene()` (the current default look).

## What persists in a version

Per-object spin / orbit / tilt (the motion), word groups & layout, auto-rotate,
lighting & environment, materials, links, and camera. (Physics/vortex slider values
are live-only for experimenting — not yet serialized.)

## Notes

- The live hero (`/scene/`) always re-frames the camera to fill the viewport, so the
  composition stays responsive. In `?edit`, the camera you leave is kept while composing.
- `My Saved Designs` in the panel is a separate, browser-local scratchpad (localStorage)
  for quick drafts — not published.
- The default font is embedded (`assets/font-data.js`) so glyphs render even before
  the network font loads.
