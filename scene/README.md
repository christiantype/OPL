# Homepage hero scene

This folder powers the full-bleed 3D scene embedded on the homepage
(`index.html` loads it in an `<iframe src="/scene/">`).

## Two modes

| URL | What you get |
|-----|--------------|
| `/scene/` | Clean, full-bleed hero. All controls hidden. This is what the homepage shows. |
| `/scene/?edit` | The **full studio UI** — lighting, motion, words, physics/vortex, materials, objects. Zoom/pan enabled. |

## Statements

A **statement** is a published, named scene — a visual message you can revisit,
re-publish, and enhance over time. They live in `scene/statements/`:

```
scene/statements/
  manifest.json        ← the list of statements + which one is "active" (live)
  boundless.json       ← one statement (a full serialized scene)
  mindful.json         ← another …
```

`manifest.json` looks like:

```json
{
  "active": "boundless",
  "items": [
    { "slug": "boundless", "title": "Boundless", "date": "2026-05-20" },
    { "slug": "mindful",   "title": "Mindful",   "date": "2026-06-01" }
  ]
}
```

The live homepage hero loads `items` → finds `active` → loads `statements/<active>.json`.
If there's no active statement, it falls back to the built-in default scene.

## Workflow (save / revisit / publish)

1. Run the site locally so `fetch` works:
   ```
   cd /Users/christiansolorzano/Documents/OPL
   python3 -m http.server 8000
   ```
   Open **http://localhost:8000/scene/?edit**

2. **Revisit** a past statement: pick it in the **Statements → Revisit** dropdown and
   click **Load**. Tweak / enhance it with the panel (words, motion, lighting, etc.).

3. **Save**: click **＋ Save as Statement…**, give it a name. This downloads
   `<slug>.json` and marks it as the live one.

4. **Publish**: 
   - Move the downloaded `<slug>.json` into `scene/statements/`
   - Click **⬇ Download manifest.json** and replace `scene/statements/manifest.json`
   - Commit & push both:
     ```
     git add scene/statements/
     git commit -m "Publish statement: <name>"
     git push
     ```
   GitHub Pages redeploys and the homepage shows the new statement on next load.

5. To re-publish an **older** statement without changing it: select it, click
   **Set Live**, then **Download manifest.json** and commit just the manifest.

## What persists in a statement

Per-object spin / orbit / tilt (the motion), word groups & layout, auto-rotate,
lighting & environment, materials, links, and camera. (Physics/vortex slider values
are live-only for experimenting — not yet serialized.)

## Notes

- The live hero (`/scene/`) always re-frames the camera to fill the viewport, so the
  composition stays responsive. In `?edit`, the camera you leave is kept while composing.
- `My Saved Designs` (in the panel) is a separate, browser-local scratchpad
  (localStorage) — handy for quick drafts, but **not** published. Statements are the
  published, committed archive.
- The default font is embedded (`assets/font-data.js`) so glyphs render even before
  the network font loads.
