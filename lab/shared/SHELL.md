# OP/AL Lab — Shell Standard

Every tool in `/lab/` wears the **same shell** so the whole Lab reads as one product. This file is the source of truth. When a tool looks different, it's wrong — bring it here.

**One stylesheet.** Every tool loads **[shared/OPALAB.css](/lab/shared/OPALAB.css)** — the single shared layer that carries the tokens, the flat component library, and the geometry of every control (buttons, sliders, group headings, colour rows, swatches, toggles, size dock, Output island). A tool supplies its canvas + layout; it should not restyle a control. (The older `shared/opal.css` still loads first as the topbar/chrome base that `opal.js`'s generated markup depends on — see §2. The retired `tool.css` / `ibm.css` / `tokens.css` no longer exist.)

A clean `#dock` reference implementation is **[offset/index.html](/lab/offset/index.html)** — copy its `<style>` block as the structural template. The living, rendered spec is **[lab-design-system/](/lab/lab-design-system/)** — it draws every token, element and pattern live through OPALAB.css. When in doubt, open it.

**Skin — flat.** One white surface (`--paper`); **no shadows, no gradients, nothing 3D — anywhere.** Every edge is drawn with a hairline (`--hair`): islands and buttons are white, hairline-edged, with crisp corners (`--r-island 6px`, `--r-control 6px`). Type is **IBM Plex Sans** (interface) + **IBM Plex Mono** (readouts), self-hosted at `/shared/fonts/ibm-plex-*.woff2`. A single interactive accent (`--accent`) carries the selected/pressed state as a **solid fill with white ink**, the slider dot, and the focus ring; greys are neutral. Buttons are flat and go solid-accent when on; sliders are a **thin flat line with a flat accent dot**; checkboxes are **flat pill switches** (grey track, accent when on, plain white knob); fields are flat and hairline-edged. Accordion carets are drawn triangles, never a glyph. The canvas mat (`--mat`) is a step darker than the surface so the white artboard reads.

---

## 1. Non-negotiables

- **One white surface, flat.** `--paper` ground, hairline-edged islands, `--ink` text, dark `currentColor` wordmark. No shadows, gradients, or 3D — ever.
- **`OPALAB.css` is the last stylesheet** in `<head>` — after the tool's own `<style>` — so it wins. It gives every tool identical tokens, buttons, sliders, docks, tooltips and the flat surface.
- **The canvas is the tool's own** artwork — the shell doesn't touch what's *drawn*. The **artboard frame is standard**: the canvas (`#art`/`#gl`/`#stage`/`#view`) is a **white** board with a **thin border** and **NEVER a drop shadow**, on the **grey mat** (`#wrap`/`#stagewrap`/`#canvasArea` background). A tool may paint its own ground inside `render()`.
- **One left rail of controls; one bottom-right Output island; a top-left size dock; top-right Sessions.** Nothing else floats over the artwork except the `#recDot` timer.
- **Accessibility (WCAG AA).** Body/label text ≥ 4.5:1; muted grey `--mute #6b7280`; focus shows a 2px blue ring.
- **No small body fonts** (never `0.8em`/`0.875em`; omit `font-size` or use `1em`). Mono may be 12px.
- **No zero-padded numbers** (`1, 2, 3` — never `01, 02`).
- **Plain-language labels** that say what a control does (Width, Softness, Density…), never math/jargon.

---

## 2. Structure

```
<body class="dark">                     ← class name is legacy; kept for tools that key off it.
  <div id="wrap"><canvas id="art"></canvas></div>   ← canvas area, top:var(--top) left:var(--rail) right:0 bottom:0, flex-centered
  <div id="recDot"><i></i><b>0:00</b></div>          ← rec indicator (tools that record)
  <div id="sizeDock"><select id="aspect">…</select></div>   ← canvas-size selector, TOP-LEFT
  <div id="dock"> … control groups … </div>          ← the LEFT rail  (#rail / #panel for bespoke tools)
  <div class="group out" id="output"> … Record + Save … </div>   ← bottom-right OUTPUT island
  <script src="/lab/shared/opal.js"></script>
  <script>Opal.mountTopbar({ name, desc, about, version:'v1' });</script>
  <script> … tool … </script>
</body>
```

- `<head>` order: `gate.js` → **`opal.css`** → tool `<style>` → **`OPALAB.css` last**.
- `#dock` — the **left rail**, `width:var(--rail)` (≈300px), `top:var(--top)` (120px = 82 topbar + 38 sub-header), `left:0`, scrolls. Bespoke/full-bleed tools may use `#rail` or `#panel` instead — OPALAB styles all three the same.
- `#sizeDock` — the aspect `<select id="aspect">` pinned **top-left** of the canvas (`top:calc(var(--top)+14px); left:calc(var(--rail)+16px)`). `opal.js` rebuilds its options to the **canonical presets** (Square 1:1 default · 4:5 · 2:3 · 9:16 · 16:9 · 3:2 · 1.91:1) and shows the `#dimReadout`. Fixed-format tools (the reels) show a static readout.
- `opal.js` auto-wires the shell on load: segmented→select, accordions, the size dock, the Output island (collapse), and **Sessions** (top-right, cross-tool — a session saved in one tool opens and restores in another).

### Layout tokens (in the tool's own `<style> :root`)
```
--rail:300px;  --top:120px;
```

---

## 3. Theme tokens (owned by `OPALAB.css` — do not redefine per tool)

| token | value | use |
|---|---|---|
| `--font` | `'IBM Plex Sans', system-ui…` | interface type |
| `--mono` | `'IBM Plex Mono', ui-monospace…` | readouts, code |
| `--accent` | `#000000` | selected, pressed, focus, slider dot; `--accent-hover` `#2b00ff` |
| `--ink` | `#000000` | primary text |
| `--dim` / `--mute` | `#454545` | muted labels / captions |
| `--line` / `--hair` | `rgba(0,0,0,.16)` / `.18` | the hairlines that draw every edge — there are no shadows |
| `--track` | `rgba(0,0,0,.18)` | the slider's thin line |
| `--paper` / `--cell` / `--island` | `#ffffff` | the one surface — page, rail, buttons, cards |
| `--mat` | `#ebecef` | canvas mat behind the artboard (a step darker, so the white board reads) |
| `--rec` | `#da1e28` | record indicator |
| `--r-island` / `--r-control` / `--r-input` / `--r-seg` | `6px` | crisp corners, one value |
| `--shadow*` / `--nm-lo` / `--nm-hi` | `none` / `transparent` | **kept only so old references resolve — nothing may reintroduce a shadow** |

There is no dark shell and no theme toggle. A tool paints its own artwork dark if it wants to; the chrome stays white. Tools must not redefine any token above.

---

## 4. Control language (use these classes)

- **Groups = islands.** `<div class="group">` + `<div class="group__t">Caption</div>`. OPALAB renders each as a **white, hairline-edged card** on the rail, with a consistent gap between them — don't add manual margins/dividers (a `.group + .group` spacer is drift). `#dock` groups are collapsible accordions: the caption is the handle and carries a **drawn triangle**, never a glyph.
- **Sliders:** `<div class="knob"><label>Name <b id="xR">val</b></label><input type="range" …></div>` — a 3px flat line + a 16px flat **accent dot**, mono readout. Wire the `<b>` on `input`.
- **Buttons:** `.btn` — a white face with a hairline edge; selected/primary via `[aria-pressed="true"]` / `.primary` / `.on` fill **solid accent with white ink**. `.grid2` for two-up. `.seg` is gapped pills (no wrapper) and auto-collapses to a select above 3 options.
- **Selects / fields:** flat and hairline-edged, with the shared chevron — **never give a `<select>` `class="btn"`**, the button face wipes the chevron. `#sizeDock select` is the canonical size chooser.
- **Colour rows:** `.crow` — label left, `<input type="color" class="sw">` right (a 26px round well). A selected `.sw` takes a 2px accent **outline**, never a ring drawn with a shadow.
- **Toggles:** `<input type="checkbox">` renders as a **flat pill switch** (grey track, accent when on, plain white knob).
- **Tooltips:** `.tip` (solid dark, no blur).

---

## 5. Output — Record + Export (IDENTICAL on every tool)

Every tool carries **one Output island**, pinned to the **bottom-right of the screen**, **collapsed** until clicked. It holds the universal actions; any richer export config lives inside it via `Opal.mountOutput`.

```html
<div class="group out" id="output"><!-- bespoke tools: body-level <div id="output"> -->
  <div class="group__t">Output</div>
  <div class="grid2">
    <button class="btn" id="recBtn">Record</button>
    <button class="btn" id="saveBtn">Save</button>
  </div>
</div>
```

- **`Opal.mountOutput(canvas, name, opts)`** turns the island into the persistent export panel — format (PNG · JPG · PDF · **SVG** when `opts.svg` is supplied), pixel size, DPI. `opts.render(px)` lets shader/vector tools **re-render at the true target long-edge** for crisp print instead of upscaling; `opts.pdf(px)` supplies a real **vector PDF** for line-art. Default the pixel size high for print.
- **`#recBtn` — Record.** `canvas.captureStream(30)` → `MediaRecorder`, H.264 MP4 then WebM. Toggles to "Stop".
- **`#saveBtn` — Save.** Wired by `mountOutput` to the export panel.
- **`#recDot`** — the recording timer, pinned near the canvas top edge.
- No over-canvas icon clusters; the only things over the canvas are `#recDot` and `#sizeDock`.

---

## 6. Conformance (2026-08)

All ~30 tools share the shell — one left rail (`#dock`, or `#rail`/`#panel` for bespoke tools), the white artboard on the grey mat, the top-left size dock, top-right cross-tool Sessions, and the identical bottom-right Output island — on the single **OPALAB.css**, flat. Zero console errors across the fleet.

**Drift to watch for** (found across the fleet in the 2026-09 flat audit, and the reason for most of the `!important`s in OPALAB): a tool redefining shell tokens in its own `:root`/`html:root`/`body` scope; a leftover `body.dark` theme or a Theme toggle; `.rail`/`#dock` frosted backgrounds and `backdrop-filter`; `box-shadow` on the artboard or on a popover; `.group + .group` margins; 8–10px uppercase labels; `<select class="btn">`; controls floating over the canvas; a hand-wired Save instead of `Opal.mountOutput`.

**Intentional exceptions** (different tool *categories*, not the parametric instruments): **open-capture** is a 4-clip batch-recorder gallery, and **open-reel** is an immersive fixed-format 9:16 reel (a locked size readout, no rail).

To bring a light-touch tool to standard: rebuild its rail to the `#dock` + `.group`/`.knob` structure, load `OPALAB.css` last, keep the generative/render/record logic and every JS id, and verify with a screenshot.
