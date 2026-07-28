# Spectral smear

An OP/AL Lab tool wrapping the WebGL1 fragment shader `../02_spectral_smear.frag`.
Single-file `index.html` (shared Lab chrome + inline engine); the shader stays external
so you can edit it and reload live.

## Editing the shader

The tool fetches `../02_spectral_smear.frag` at startup and whenever you press **R**.
Edit that file and hit R — no rebuild. It needs a server (fetch won't run from
`file://`); from the repo root:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/lab/spectral-smear/
```

Live on the site at `/lab/spectral-smear/`.

## Panel → uniforms

The rail knobs are friendly 0–100 values mapped to the shader's real uniforms (defaults
land on the shader's original numbers):

| Knob            | Uniform        | Real range (default) |
|-----------------|----------------|----------------------|
| Smear · Amount  | `u_smear`      | 0 – 0.15 (0.030) |
| Smear · Steps   | `u_samples`    | 1 – 64 (28) |
| Flow · Scale    | `u_flowScale`  | 0.5 – 8 (2.6) |
| Flow · Speed    | `u_flowSpeed`  | 0 – 0.5 (0.06) |
| Grade · Contrast| `u_contrast`   | 0.5 – 3 (1.45) |
| Grade · Sat floor| `u_satFloor`  | 0 – 1 (0.25) |
| Grade · Grain   | `u_grain`      | 0 – 0.15 (0.022) |

Base uniforms unchanged: `u_res`, `u_texRes` (source's natural size), `u_time`,
`u_tex` (uploaded with `UNPACK_FLIP_Y_WEBGL = true`).

## Changes made inside the shader (math preserved)

Each hoist swapped a literal for a uniform of the same default (marked `// was …` in the
`.frag`). The **one structural change**: GLSL ES 1.0 forbids a non-constant loop bound, so
the spectral loop runs to `const int MAX_SAMPLES = 64` and `break`s once
`i >= int(u_samples)`; the step fraction uses `float(i)/max(u_samples-1.0, 1.0)`. Output
is identical to the original 28-step loop for any given count. For more than 64 steps,
raise `MAX_SAMPLES` (and the Steps knob's max in the tool). Secondary fbm detail
frequencies (`uv*3.4`, `uv*4.0`, `uv*1.6`) were left literal — they're separate features,
so Flow · Scale maps only to the primary `2.6` term.

## Save PNG

Renders the current frame into an offscreen framebuffer at the chosen Pixels size (canvas
aspect, clamped to `MAX_TEXTURE_SIZE`), reads it back, and downloads — for print-res frames.
