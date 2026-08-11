# OP/AL Lab — Shell Standard

Every tool in `/lab/` must wear the **same shell**: one white, high-contrast, accessible chrome so the whole Lab reads as a single product. This file is the source of truth. When a tool looks different, it's wrong — bring it here.

The reference implementation is **[attractor/index.html](/lab/attractor/index.html)**. Its `<style>` block is the structural template; copy it. The shared **[shared/tool.css](/lab/shared/tool.css)** is loaded LAST in every tool and paints the light theme + control language on top of that structure.

---

## 1. Non-negotiables

- **Light shell.** White/near-white ground, dark controls, dark `currentColor` wordmark. No dark mode.
- **`tool.css` is the last stylesheet** in `<head>` — after the tool's own `<style>`. It overrides the (formerly dark) chrome and gives every tool identical tokens, buttons, sliders, docks, tooltips.
- **The canvas is the tool's own.** The shell never restyles `#art`/the artwork — only the chrome around it.
- **Accessibility (WCAG AA).** Body/label text ≥ 4.5:1 on the shell; UI outlines (step cells, toggles, dividers) must be visibly filled/bordered, not hairlines. Muted grey is `#585860` (~6:1), never lighter for text.
- **No small body fonts** (never `0.8em`/`0.875em`; omit `font-size` or use the token sizes below). Code/mono may be 12px.
- **No zero-padded numbers** (`1, 2, 3` — never `01, 02`).
- **Plain-language labels** that say what a control does (Width, Softness, Density…), never math/jargon.

---

## 2. Structure (copy from Attractor)

```
<body class="dark">                     ← class name is legacy; tool.css theming keys off it. Keep it.
  <div id="wrap"><canvas id="art"></canvas></div>   ← canvas area, top:var(--top) left:var(--rail) right:0 bottom:0, flex-centered
  <div id="hint">…</div>                ← optional caption pill, centered over the canvas
  <div id="recDot"><i></i><b>0:00</b></div>          ← rec indicator (tools that record)
  <div id="sizeDock"><select id="aspect">…</select></div>   ← canvas-size selector, ALWAYS top-right
  <div id="dock"> … control groups … </div>          ← the LEFT rail
  <script src="/lab/shared/opal.js"></script>
  <script>Opal.mountTopbar({ name, desc, about, version:'v1' });</script>
  <script> … tool … </script>
</body>
```

- `#dock` — the **left rail**, `width:var(--rail)` (300px), `top:var(--top)` (82px), `left:0`, scrolls. A distinct light-grey panel, set apart from the topbar.
- `#wrap` — canvas area to the right of the rail.
- `#sizeDock` — the aspect `<select>` pinned **top-right**, wired to reshape the working canvas. Standard options: `Portrait · 4:5 (1080/1350)`, `Story · 9:16 (1080/1920)`, `Square · 1:1`, `Landscape · 16:9 (1920/1080)`. Image tools may add a `Source · original`.
- `<head>` order: `gate.js` → `opal.css` → tool `<style>` → **`tool.css` last**.

### Layout tokens (in the tool's own `<style> :root`, copied from Attractor)
```
--rail:300px;  --top:82px;
```
The tool defines these + its own art CSS. It should NOT hardcode dark colours — use the tokens below so `tool.css` can theme it.

---

## 3. Theme tokens (owned by `tool.css` — do not redefine per tool)

| token | value | use |
|---|---|---|
| `--ink` | `#16171c` | primary text, slider thumbs, primary-button ground (~15:1) |
| `--dim` / `--mute` | `#585860` | muted labels / captions (~6:1 — AA) |
| `--line` | `rgba(0,0,0,.16)` | borders, dividers |
| `--hair` | `rgba(0,0,0,.18)` | panel edges |
| `--track` | `rgba(0,0,0,.28)` | slider tracks |
| `--paper` | `#f4f4f6` | body / canvas-area ground |
| `--cell` | `rgba(0,0,0,.05)` | button ground |

Chrome painted by `tool.css`: white topbar with a hairline under it; `#dock` = `#e8e9ee` grey panel; `#hint`/`#recDot`/`#sizeDock select`/`.tip` = light frosted with dark text; `#recDot` red = `#c01f34`.

---

## 4. Control language (use these classes)

- **Groups = islands.** `<div class="group">` with a `<div class="group__t">CAPTION</div>`. `tool.css` renders every group as a floating white **island** (Lake-Opeka style) — `border-radius:12px`, `padding:14px`, soft shadow — on the grey rail "water". Spacing is a **consistent 12px gap** between stacked islands (via `#dock { gap }`), the same left/right inset for all (via `#dock` padding). Put each logical section of controls in its own `.group`; do not add manual margins/dividers — the shell handles island radius, padding, margin and gap uniformly.
- **Sliders:** `<div class="knob"><label>Name <b id="xR">val</b></label><input type="range" …></div>` — flat thin track, round `--ink` thumb. Wire the `<b>` readout on `input`.
- **Buttons:** `.btn` (light), `.btn.primary` / `[aria-pressed="true"]` (inverted: `--ink` ground, white text), `.grid2` for two-up, `.btn.full`.
- **Selects:** `select.btn` (full width) or the styled `#sizeDock select`.
- **Colour rows:** `.crow` — label left, `<input type="color">` swatch right.
- **Toggles:** `.tog` — label left, small `.btn` right.
- **Tooltips:** every control gets `data-tip="plain sentence"`. Include the `.tip` element + the tooltip IIFE from Attractor.
- **Text fields:** `textarea`/`input[type=text]` inherit white ground + dark text from `tool.css`.

Any tool with a **dark preview swatch** (e.g. white-on-dark shapes) keeps a dark chip *inside* the light shell — that's allowed; the surrounding chrome stays light.

---

## 5. Export (consistent across tools)

- **Record:** `canvas.captureStream(30)` → `MediaRecorder`, preferring H.264 MP4 (`video/mp4;codecs=avc1…`) then WebM; audio tools add the WebAudio `MediaStreamDestination` track. Show `#recDot` while recording.
- **Save:** PNG via `toDataURL`. Hide any on-canvas edit UI (handles, guides) during record + save.
- Records render to a fixed 1920-long-edge buffer for crisp output.

---

## 6. Conformance status (2026-08)

- **Full standard:** Attractor (ref), Fence, Putty, Sequins, Static, Tape, Halftone, Spectral-Smear, Aura-Maxing, Garden-Variety, Windchime, Visual Poetry, OPEN LAB, Hand Shader.
- **Light-touch** (kept a bespoke rich/instrument layout, but got the shared control language + size dock — a full single-rail rebuild is a follow-up): **Angel** (still rotary dials, not sliders), **Image-Train**, **Second-Thought**.
- **Intentionally outside the shell:** reels/captures with fixed output (open-reel, open-slots, open-capture, scanner, ash, kirlian, letter-strings, lake-opeka, ships-in-the-night, flux) and the full-bleed **Projection** tool. These stay as-is by design.

To bring a light-touch tool to full standard: rebuild its rail to the `#dock` + `.group`/`.knob` structure above, convert dials → sliders, keep the generative/render/record logic and every JS id, verify with a screenshot.
