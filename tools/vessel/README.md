# OP/AL — Vessel.2

Audio-reactive drawing instrument
Built for JORDYN (Sugarcane Family) by Sean Fermoyle

## What changed from Vessel.1

The form generator is gone. You and Cass now **draw** every entity.
- Click on the canvas to place anchor points (snap to grid)
- Drag points to move them
- Each anchor can be sharp or smooth (right-click to toggle)
- Each anchor can react to audio (pulse, bloat, or twist)
- Shapes can be open or closed
- Variable depth — from flat 2D line to deep 3D form
- Real cast shadows
- 9 materials, full color picker

## Project structure

```
vessel-2/
├── index.html          ← the tool
├── README.md           ← this file
├── assets/             ← optional brand assets
└── tracks/
    ├── 001.mp3         ← Opitus Session
    ├── 002.mp3         ← Ships in the Night
    ├── 003.mp3         ← Jazz Relapse
    ├── 004.mp3         ← Walk of the Bird
    ├── 005.mp3         ← Good Evening
    ├── 006.mp3         ← Cherry Blossom (Interlude)
    ├── 007.mp3         ← Off In The Distance
    └── 008.mp3         ← A Little Nervous
```

## Setup

1. Drop the eight .mp3 files into `/tracks/` named exactly `001.mp3` through `008.mp3`
2. Serve locally (audio requires a server, not file://):
   ```
   python3 -m http.server 8000
   ```
3. Visit `http://localhost:8000`

## How to draw

- **Click** on the canvas to place an anchor point. Points snap to the grid.
- **Drag** an anchor to move it. Snaps as you drag.
- **Right-click** an anchor to toggle sharp / smooth.
- **Shift-click** an anchor to delete it.
- Toggle **closed/open** path in the panel.
- Adjust **grid density** to control snapping (coarse to fine).
- The grid hides when you press play or export.

## How audio reactivity works

In the **Anchors** panel, each placed point is listed. For each point:
- Toggle **react** on/off
- Choose **mode**: Pulse (rhythmic in-out), Bloat (sustained swell), Twist (rotate around center)
- Choose **band**: Bass, Mid, or High

Hit play. The points you've activated respond.

## Deploy

Push the folder to GitHub, point GitHub Pages at it.
Target URL: `opl.design/lab/vessel-2/`

## For Cass

She picks a track, drops in a quotidian photograph, draws a shape over it,
selects which anchors react, presses play. One drawn entity per track. The
booklet writes itself from the eight exports.

## Vessel.3 (next)

- Video export (canvas + audio muxed)
- Save / load drawings as JSON (so you can return to one)
- Multi-shape compositions
- Symmetry / mirroring while drawing
