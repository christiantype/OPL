/* Render Instagram-sized MP4s of the OP/AL thermal hero.
   Usage: node social/render.js            (renders the VARIANTS batch below)
   Requires: puppeteer-core (repo node_modules), ffmpeg on PATH, Google Chrome. */
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const PAGE = 'file://' + path.join(HERE, 'capture-hero.html');

// Each variant → one mp4. hue is 0–360 (tints the deep base + cool band); '' = random.
const VARIANTS = [
  // ── Reels — 9:16 (1080×1920) ──
  { name: 'reel-1-warm',      w: 1080, h: 1920, text: 0, motion: 'calm',   hue: 12,  points: 4, seconds: 22, seed: 7 },
  { name: 'reel-2-text',      w: 1080, h: 1920, text: 1, motion: 'calm',   hue: 262, points: 3, seconds: 22, seed: 3 },
  { name: 'reel-3-cool',      w: 1080, h: 1920, text: 0, motion: 'active', hue: 205, points: 5, seconds: 22, seed: 21 },
  { name: 'reel-4-green',     w: 1080, h: 1920, text: 0, motion: 'calm',   hue: 150, points: 4, seconds: 22, seed: 14 },
  { name: 'reel-5-amber-text',w: 1080, h: 1920, text: 1, motion: 'calm',   hue: 30,  points: 5, seconds: 22, seed: 9 },
  // ── Portrait feed — 4:5 (1080×1350) ──
  { name: 'portrait-1-warm',      w: 1080, h: 1350, text: 0, motion: 'calm',   hue: 12,  points: 4, seconds: 22, seed: 31 },
  { name: 'portrait-2-text',      w: 1080, h: 1350, text: 1, motion: 'calm',   hue: 262, points: 3, seconds: 22, seed: 5 },
  { name: 'portrait-3-cool',      w: 1080, h: 1350, text: 0, motion: 'active', hue: 205, points: 5, seconds: 22, seed: 44 },
  { name: 'portrait-4-green',     w: 1080, h: 1350, text: 0, motion: 'calm',   hue: 150, points: 4, seconds: 22, seed: 18 },
  { name: 'portrait-5-amber-text',w: 1080, h: 1350, text: 1, motion: 'calm',   hue: 30,  points: 5, seconds: 22, seed: 27 },
  // ── Aura — inverted heatmap: rainbow on light (9:16 + 4:5) ──
  { name: 'reel-aura-1',       w: 1080, h: 1920, text: 0, motion: 'active', ramp: 'aura', hue: 300, points: 5, seconds: 22, seed: 51 },
  { name: 'reel-aura-2-text',  w: 1080, h: 1920, text: 1, motion: 'calm',   ramp: 'aura', hue: 40,  points: 4, seconds: 22, seed: 62 },
  { name: 'reel-aura-3',       w: 1080, h: 1920, text: 0, motion: 'calm',   ramp: 'aura', hue: 200, points: 5, seconds: 22, seed: 73 },
  { name: 'portrait-aura-1',   w: 1080, h: 1350, text: 0, motion: 'active', ramp: 'aura', hue: 300, points: 5, seconds: 22, seed: 95 },
  { name: 'portrait-aura-2-text',w:1080, h: 1350, text: 1, motion: 'calm',   ramp: 'aura', hue: 40,  points: 4, seconds: 22, seed: 106 },
  { name: 'portrait-aura-3',   w: 1080, h: 1350, text: 0, motion: 'calm',   ramp: 'aura', hue: 200, points: 5, seconds: 22, seed: 117 },
  // ── Light → dark (animated tone over the clip) ──
  { name: 'reel-light-to-dark',     w: 1080, h: 1920, text: 0, motion: 'calm', hue: 265, points: 5, seconds: 24, seed: 46, toneAnim: [0, 1] },
  { name: 'portrait-light-to-dark', w: 1080, h: 1350, text: 0, motion: 'calm', hue: 265, points: 5, seconds: 24, seed: 46, toneAnim: [0, 1] },
];

const FPS = 30;
const WARMUP_S = 2.6;   // virtual seconds simmered before capture, so the field is full

async function renderVariant(browser, cfg) {
  const outFile = path.join(OUT, cfg.name + '.mp4');
  if (fs.existsSync(outFile)) { console.log('· skip (exists) ' + cfg.name); return; }
  const dtMs = 1000 / FPS;
  const warm = Math.round(WARMUP_S * FPS);
  const total = Math.round(cfg.seconds * FPS);
  const framesDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'opal-frames-'));

  const page = await browser.newPage();
  await page.setViewport({ width: cfg.w, height: cfg.h, deviceScaleFactor: 1 });
  const q = `?capture=1&text=${cfg.text}&motion=${cfg.motion}&seed=${cfg.seed}&points=${cfg.points || 4}&ramp=${cfg.ramp || 'thermal'}` + (cfg.hue === '' ? '' : `&hue=${cfg.hue}`);
  await page.goto(PAGE + q, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 10000 });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}

  const anim = Array.isArray(cfg.toneAnim) ? cfg.toneAnim : null;   // [from, to] to animate light↔dark
  if (anim) await page.evaluate((v) => window.__setTone(v), anim[0]);
  // warm-up (no capture)
  for (let f = 0; f < warm; f++) await page.evaluate((t) => window.__render(t), f * dtMs);
  // capture
  for (let f = 0; f < total; f++) {
    const t = (warm + f) * dtMs;
    if (anim) { const prog = total > 1 ? f / (total - 1) : 0; await page.evaluate((v) => window.__setTone(v), anim[0] + (anim[1] - anim[0]) * prog); }
    await page.evaluate((tt) => window.__render(tt), t);
    await page.screenshot({ path: path.join(framesDir, 'f_' + String(f + 1).padStart(5, '0') + '.png') });
  }
  await page.close();

  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f_%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outFile],
    { stdio: 'ignore' });
  fs.rmSync(framesDir, { recursive: true, force: true });
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`✓ ${cfg.name}.mp4  ${cfg.w}x${cfg.h}  ${cfg.seconds}s  (${kb} KB)`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--enable-unsafe-swiftshader', '--no-sandbox', '--force-color-profile=srgb'] });
  for (const cfg of VARIANTS) { console.log('rendering ' + cfg.name + ' …'); await renderVariant(browser, cfg); }
  await browser.close();
  console.log('\nAll done → ' + OUT);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
