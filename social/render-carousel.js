/* Render a 10-image Instagram carousel that walks the tone spectrum:
   image 1 = lightest (aura), image 10 = darkest (thermal heatmap).
   Same composition throughout — only the light↔dark tone changes as you swipe.
   Output: social/out/carousel/carousel-01.jpg … carousel-10.jpg (1080×1350). */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HERE = __dirname;
const OUT = path.join(HERE, 'out', 'carousel');
const PAGE = 'file://' + path.join(HERE, 'capture-hero.html');

const W = 1080, H = 1350;      // 4:5 carousel
const FRAMES = 10;
const SEED = 46;               // fixed → identical composition across all 10
const HUE = 265;
const POINTS = 5;
const SNAP_MS = 4200;          // virtual time the field is settled to before the shot
const FPS = 30;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--enable-unsafe-swiftshader', '--no-sandbox', '--force-color-profile=srgb'] });

  for (let i = 0; i < FRAMES; i++) {
    const tone = i / (FRAMES - 1);                 // 0 (light) → 1 (dark)
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    const q = `?capture=1&text=0&motion=calm&points=${POINTS}&seed=${SEED}&hue=${HUE}&tone=${tone.toFixed(4)}`;
    await page.goto(PAGE + q, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true', { timeout: 10000 });
    const steps = Math.round(SNAP_MS / (1000 / FPS));
    for (let f = 0; f < steps; f++) await page.evaluate((t) => window.__render(t), f * (1000 / FPS));
    const out = path.join(OUT, 'carousel-' + String(i + 1).padStart(2, '0') + '.jpg');
    await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
    await page.close();
    console.log(`✓ carousel-${String(i + 1).padStart(2, '0')}.jpg  tone=${tone.toFixed(2)}`);
  }
  await browser.close();
  console.log('\nCarousel → ' + OUT);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
