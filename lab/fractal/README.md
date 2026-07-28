# Fractal — raymarched distance-estimated fractals (WebGL2)

Plain WebGL2 / GLSL ES 3.00. `index.html` + `main.js` + `fractal.frag`. No framework, no
bundler, no npm. The scene shader is fetched at runtime, so you can edit `fractal.frag`
and just refresh.

## Run

`fetch()` needs a server (not `file://`). From this folder:

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

## Architecture

- **`fractal.frag`** — the scene: sphere-traces a distance estimator, shades with
  gradient normals, reflects (2 bounces, Fresnel-Schlick, roughness cone jitter) against
  a procedural studio environment, colours from the orbit-trap distance through a cosine
  palette with thin-film iridescence. Outputs **linear HDR**.
- **`main.js`** — WebGL2 engine. Renders the scene into an HDR framebuffer (render-scaled),
  then a post chain (bright-pass → separable blur → composite with ACES tonemap, vignette,
  ordered dither) draws to the canvas. Also: the control panel, presets, PNG/WebM export,
  and the ms/frame readout.

Edit `fractal.frag` → refresh. Compile/link errors show in a red overlay with the log.

## Controls

Right-side panel, grouped and collapsible: **Fractal / Bevel / Material / Palette / Motion
/ Render**. Four fractals in the dropdown (Mandelbulb, Mandelbox, Menger/KIFS, Extruded
Julia). Keyboard: **space** play/pause, **R** randomize palette, **S** save PNG.

Presets: *Copy current → box* dumps the state as JSON; paste JSON back and *Load from box*.

## Performance

Hold 60fps on an M-series laptop at render scale 1.0. If it dips: lower **Render scale**
(0.5–1.0), **Max steps**, or **Roughness samples**; turn off **Soft shadows** / **AO** /
**2nd reflection bounce**. The ms/frame + fps readout is bottom-left. Respects
`prefers-reduced-motion` (starts paused).

## Export

- **Save PNG · 3×** — renders once into a 3×-canvas framebuffer and downloads the readback.
- **Record** — captures `canvas.captureStream` to a WebM via MediaRecorder.
