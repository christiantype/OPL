/* Render an Instagram reel of the OP/AL screensaver: logo + flashing words,
   alternating Sanzo colour pairs. Output: social/out/reel-screensaver.mp4 (9:16). */
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const PAGE = 'file://' + path.join(HERE, 'capture-screensaver.html');

const W = 1080, H = 1920, FPS = 30, SECONDS = 79, SEED = 7;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const outFile = path.join(OUT, 'reel-screensaver.mp4');
  const framesDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'opal-ss-'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(PAGE + `?capture=1&seed=${SEED}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 10000 });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}

  const dtMs = 1000 / FPS, total = SECONDS * FPS;
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.__render(t), f * dtMs);
    await page.screenshot({ path: path.join(framesDir, 'f_' + String(f + 1).padStart(5, '0') + '.png') });
  }
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f_%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outFile], { stdio: 'ignore' });
  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log('✓ reel-screensaver.mp4  ' + W + 'x' + H + '  ' + SECONDS + 's  (' + Math.round(fs.statSync(outFile).size / 1024) + ' KB)');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
