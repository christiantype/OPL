# OP/AL Lab — Shell Standard

Every tool in `/lab/` must wear the **same shell**: one white, high-contrast, accessible chrome so the whole Lab reads as a single product. This file is the source of truth. When a tool looks different, it's wrong — bring it here.

The reference implementation is **[attractor/index.html](/lab/attractor/index.html)**. Its `<style>` block is the structural template; copy it. The shared **[shared/tool.css](/lab/shared/tool.css)** is loaded LAST in every tool and is the **complete component layer** — it paints the light theme *and* owns the geometry of every control (buttons, sliders, group headings, colour rows, swatches, toggles). A tool supplies its canvas + layout; it should not need to restyle a control.

The living spec is **[lab-design-system/](/lab/lab-design-system/)** (LAB Design System, OP-LAB-028) — it renders every token, element and pattern live through this same `tool.css`, with the standing audit. When in doubt, open it.

**Skin — in the vein of IBM (Carbon).** The shell is typeset in **IBM Plex Sans** (interface) + **IBM Plex Mono** (labels, readouts, code), self-hosted at `/shared/fonts/ibm-plex-*.woff2`. **Corners are square** — every radius token is `0`. A single interactive accent, **IBM Blue `#0f62fe`**, carries primary buttons, the selected/pressed state, and the 2px focus ring; greys are neutral (no blue tint); spacing is an 8/16/24 grid; tooltips are solid dark. Only the round slider thumb and record dot are curved.

---

## 1. Non-negotiables

- **Light shell.** White/near-white ground, dark controls, dark `currentColor` wordmark. No dark mode.
- **`tool.css` is the last stylesheet** in `<head>` — after the tool's own `<style>`. It overrides the (formerly dark) chrome and gives every tool identical tokens, buttons, sliders, docks, tooltips.
- **The canvas is the tool's own** artwork — the shell doesn't touch what's *drawn*. But the **artboard frame is standard**: the canvas (`#art`/`#gl`) is a **white** board (default) with a **thin `--line` border** and **NEVER a drop shadow**, sitting on a **light-grey mat** (`#wrap` background). A tool may paint its own ground inside `render()` (cream, dark paper, etc.); the CSS default stays white.
- **No floating control islands over the canvas, and no bottom button bars over the artwork.** All controls live in the left `#dock` rail. The only things allowed over/around the canvas are the centered `#hint` pill, the top-right `#sizeDock`, and the `#recDot` — nothing else should overlap the artboard.
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
| `--font` | `'IBM Plex Sans', system-ui…` | interface type |
| `--mono` | `'IBM Plex Mono', ui-monospace…` | labels, readouts, code |
| `--accent` | `#0f62fe` | primary, selected, focus (IBM Blue 60); `--accent-hover` `#0353e9`, `--accent-active` `#002d9c` |
| `--ink` | `#161616` | primary text, slider thumbs (~16:1) |
| `--dim` / `--mute` | `#525252` | muted labels / captions (~7:1 — AA) |
| `--line` | `rgba(0,0,0,.16)` | borders, dividers |
| `--hair` | `rgba(0,0,0,.18)` | panel edges |
| `--track` | `rgba(0,0,0,.28)` | slider tracks |
| `--paper` | `#f4f4f4` | body ground (Gray 10) |
| `--cell` | `rgba(0,0,0,.05)` | button / input ground |
| `--mat` / `--rail-bg` / `--island` | `#e0e0e0` / `#e8e8e8` / `#fff` | canvas mat / left rail / control card |
| `--rec` | `#da1e28` | record indicator (Carbon Red 60) |
| `--r-island` … `--r-seg` | `0` | all radii are zero — corners are square |

Chrome painted by `tool.css`: white topbar with a hairline under it; `#dock` = `#e8e8e8` grey panel; `#hint`/`#recDot`/`#sizeDock select` = light frosted with dark text; `.tip` = solid dark (Carbon); `#recDot` red = `#da1e28`.

---

## 4. Control language (use these classes)

- **Groups = islands.** `<div class="group">` with a `<div class="group__t">CAPTION</div>`. `tool.css` renders every group as a **square white island** — `border-radius:0`, `padding:16px`, a hairline border, no shadow — on the grey rail. Spacing is a **consistent 16px gap** between stacked islands (via `#dock { gap }`), the same inset for all (via `#dock` padding 16px). Put each logical section of controls in its own `.group`; do not add manual margins/dividers — the shell handles it uniformly.
- **Sliders:** `<div class="knob"><label>Name <b id="xR">val</b></label><input type="range" …></div>` — flat 2px track, round `--ink` thumb (blue on focus), mono readout. Wire the `<b>` readout on `input`.
- **Buttons:** `.btn` (quiet grey), `.btn.primary` / `[aria-pressed="true"]` / `.btn.on` (**IBM Blue `--accent` ground, white text** — this is the selected/primary state), `.grid2` for two-up, `.btn.full`. **All corners are square (0 radius)** on every `.btn` + `select` (enforced `!important`). Segmented buttons fill blue when active; square colour swatches (`.sw`) get a blue outline when selected. Focus shows a 2px blue ring.
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

## 6. Conformance status (2026-08 audit)

All 17 interactive tools passed a full component audit: **Attractor** (ref), **Fence, Putty, Sequins, Static, Tape, Halftone, Spectral-Smear, Aura-Maxing, Garden-Variety, Windchime, Visual Poetry, OPEN LAB, Hand Shader, Angel, Image-Train, Second-Thought**. The audit promoted every control's geometry (headings, sliders, colour rows, swatches, toggles) into `tool.css` so it can't drift, unified button/select radius to 5px, relit tools that had leaked their old dark theme (notably Spectral-Smear, which was rendering fully dark), and raised sub-10px labels (Image-Train, Angel, Tape) to the 10px floor. Full findings + conformance table live in the **[LAB Design System](/lab/lab-design-system/)** tool.

- **Outside the full shell, but wearing the IBM look:** the bespoke / full-bleed / experiential tools — open-reel, open-slots, open-capture, scanner, ash, kirlian, letter-strings, lake-opeka, ships-in-the-night, flux, and the full-bleed **Projection** tool — keep their own layout + (for the dark art pieces) their own theme, but link **[shared/ibm.css](/lab/shared/ibm.css)** LAST to adopt the family look: **IBM Plex, square corners, the blue accent, and `accent-color`**. `ibm.css` is the portable *look only* — type, tokens, square control corners, blue selected/focus — it never sets page/panel backgrounds or layout, so these tools stay themselves. A tool graduates to the full shell (tool.css) only if a rail-and-artboard structure genuinely fits it.

**Two stylesheets:** shelled tools link **`tool.css`** (the complete component layer); bespoke tools link **`ibm.css`** (the look only). Both share the same fonts, tokens and accent, so the whole Lab reads as one system.

To bring a light-touch tool to full standard: rebuild its rail to the `#dock` + `.group`/`.knob` structure above, convert dials → sliders, keep the generative/render/record logic and every JS id, verify with a screenshot.
