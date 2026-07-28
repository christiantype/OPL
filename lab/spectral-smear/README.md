# Spectral smear — local harness

WebGL1 harness for `../02_spectral_smear.frag`. Plain HTML + JS, no framework, no build.

## Run

`fetch()` needs a server (not `file://`). From this folder:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
# or: npx serve .
```

The shader is fetched from `../02_spectral_smear.frag`, so edit that file and press **R**
to reload it live. Drop any image on the window to swap the source (or replace `source.jpg`).

## Panel → uniforms (all hoisted out of the shader)

| Control          | Uniform        | Shader default (was) |
|------------------|----------------|----------------------|
| Smear amount     | `u_smear`      | `0.030` |
| Sample count     | `u_samples`    | `28` |
| Flow scale       | `u_flowScale`  | `2.6` |
| Flow speed       | `u_flowSpeed`  | `0.06` |
| Contrast         | `u_contrast`   | `1.45` |
| Saturation floor | `u_satFloor`   | `0.25` |
| Grain            | `u_grain`      | `0.022` |

The base uniforms are unchanged: `u_res`, `u_texRes` (set from the image's natural size),
`u_time`, `u_tex` (source, uploaded with `UNPACK_FLIP_Y_WEBGL = true`).

## Changes made inside the shader (math preserved)

Each hoist just swapped a literal for a uniform of the same default (marked `// was …`
in the file). The **one structural change**: GLSL ES 1.0 forbids a non-constant loop
bound, so the spectral loop can't read `u_samples` directly. It now runs to a constant
`const int MAX_SAMPLES = 64` and `break`s once `i >= int(u_samples)`, and the step
fraction uses `float(i)/max(u_samples-1.0, 1.0)` (the `max` guards divide-by-zero at
count 1). For any given sample count the output is identical to the original loop.
If you ever need more than 64 steps, raise `MAX_SAMPLES` and the slider's max in
`main.js` (`CTRLS`).

Secondary fbm detail frequencies inside the effect (`uv*3.4`, `uv*4.0`, `uv*1.6`) were
left as literals — they're separate features, not the flow-field scale, so `Flow scale`
maps only to the primary `2.6` term.

## Save PNG · 3×

Renders once into an offscreen framebuffer at 3× the canvas (clamped to
`MAX_TEXTURE_SIZE`), reads it back, flips rows, and downloads — for print-res frames.
