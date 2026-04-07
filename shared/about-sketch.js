/* ── O.P/A.L About — 5 Typography Experiments ── */

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/p5.min.js';
function loadP5(cb) {
  if (window.p5) { cb(); return; }
  const s = document.createElement('script'); s.src = CDN; s.onload = cb;
  document.head.appendChild(s);
}

function splitH1(section) {
  const h1 = section.querySelector('h1');
  if (!h1) return [];
  const html = h1.innerHTML;
  h1.innerHTML = '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split('').forEach(ch => {
        const span = document.createElement('span');
        span.textContent = ch;
        span.style.cssText = 'display:inline-block;will-change:transform;';
        h1.appendChild(span);
      });
    } else {
      const clone = node.cloneNode(true);
      clone.style.display = 'inline-block';
      h1.appendChild(clone);
    }
  });
  return Array.from(h1.querySelectorAll('span'));
}

function addCanvas(section) {
  section.style.position = 'relative';
  section.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;';
  section.insertBefore(wrap, section.firstChild);
  return wrap;
}

/* shared: letter centers relative to section */
function letterCentersOf(letters, sec) {
  const sr = sec.getBoundingClientRect();
  return letters.map(sp => {
    const r = sp.getBoundingClientRect();
    return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
  });
}

/* ══════════════════════════════════════════
   1 — MYCELIUM GROWTH
   Black bg. White threads branch from each letter
   like mycorrhizal root networks. Mouse pushes
   the growing tips away. Letters scatter on hover.
   ══════════════════════════════════════════ */
function init1() {
  const sec = document.getElementById('intro-1');
  if (!sec) return;
  const letters = splitH1(sec);
  letters.forEach(s => { s.style.transition = 'transform 0.9s cubic-bezier(0.23,1,0.32,1)'; });

  const RADIUS = 120, STRENGTH = 55;
  document.addEventListener('mousemove', e => {
    letters.forEach(span => {
      const r = span.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      span.style.transform = dist < RADIUS
        ? `translate(${-(dx / dist) * ((RADIUS - dist) / RADIUS) * STRENGTH}px,${-(dy / dist) * ((RADIUS - dist) / RADIUS) * STRENGTH}px)`
        : 'translate(0,0)';
    });
  });

  const wrap = addCanvas(sec);
  loadP5(() => {
    new p5(sk => {
      let W, H, seeds = [], tips = [], segs = [], inited = false;
      const MAX_TIPS = 90, MAX_SEGS = 1800;

      class Tip {
        constructor(x, y, angle) {
          this.x = x; this.y = y;
          this.angle = angle;
          this.life = sk.random(80, 220);
          this.age = 0;
          this.spd = sk.random(0.5, 1.5);
          this.no = sk.random(1000);
        }
        step() {
          const prev = { x: this.x, y: this.y };
          // Perlin steering
          this.angle += (sk.noise(this.x * 0.004, this.y * 0.004, this.no + sk.frameCount * 0.004) - 0.5) * 0.85;
          // Mouse repulsion
          const mdx = this.x - sk.mouseX, mdy = this.y - sk.mouseY;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 130 && md > 0) this.angle += Math.atan2(mdy, mdx) * 0.18;
          this.x += Math.cos(this.angle) * this.spd;
          this.y += Math.sin(this.angle) * this.spd;
          if (segs.length < MAX_SEGS) {
            segs.push({ x1: prev.x, y1: prev.y, x2: this.x, y2: this.y, born: sk.frameCount, ttl: sk.random(200, 480) });
          }
          this.age++;
          if (this.age % 28 === 0 && tips.length < MAX_TIPS && Math.random() < 0.65) {
            tips.push(new Tip(this.x, this.y, this.angle + (Math.random() - 0.5) * 1.3));
          }
        }
        dead() { return this.age > this.life || this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20; }
      }

      function seed() {
        if (!inited) { seeds = letterCentersOf(letters, sec); inited = true; }
        seeds.forEach(c => {
          if (tips.length < MAX_TIPS) {
            tips.push(new Tip(c.x + (Math.random() - 0.5) * 12, c.y + (Math.random() - 0.5) * 12, Math.random() * Math.PI * 2));
          }
        });
      }

      sk.setup = () => {
        W = sec.offsetWidth; H = sec.offsetHeight;
        sk.createCanvas(W, H).parent(wrap);
        sk.strokeWeight(0.55); sk.noFill();
        setTimeout(seed, 350);
      };

      sk.draw = () => {
        sk.clear();
        if (sk.frameCount % 55 === 0) seed();
        for (let i = tips.length - 1; i >= 0; i--) { tips[i].step(); if (tips[i].dead()) tips.splice(i, 1); }
        for (let i = segs.length - 1; i >= 0; i--) {
          const s = segs[i], age = sk.frameCount - s.born;
          if (age > s.ttl) { segs.splice(i, 1); continue; }
          const t = age / s.ttl;
          const a = sk.map(t, 0, 0.08, 0, 30) * sk.map(t, 0.55, 1, 1, 0);
          sk.stroke(255, 255, 255, a);
          sk.line(s.x1, s.y1, s.x2, s.y2);
        }
      };

      sk.windowResized = () => { W = sec.offsetWidth; H = sec.offsetHeight; sk.resizeCanvas(W, H); inited = false; };
    });
  });
}

/* ══════════════════════════════════════════
   2 — GRAVITY COLLAPSE
   White bg. Letters oscillate with slow sine drift.
   On mouseenter: they collapse into center with
   gravity. On leave: spring back and resume drift.
   Dark dust motes float throughout.
   ══════════════════════════════════════════ */
function init2() {
  const sec = document.getElementById('intro-2');
  if (!sec) return;
  const letters = splitH1(sec);
  const phys = letters.map((_, i) => ({
    px: 0, py: 0, vx: 0, vy: 0,
    phase: Math.random() * Math.PI * 2,
    amp: 3 + Math.random() * 4,
    freq: 0.011 + Math.random() * 0.009
  }));
  let collapsed = false, t = 0, centers = null;

  function tick() {
    t++;
    if (!centers) centers = letterCentersOf(letters, sec);
    const cx = centers.reduce((s, c) => s + c.x, 0) / centers.length;
    const cy = centers.reduce((s, c) => s + c.y, 0) / centers.length;
    letters.forEach((s, i) => {
      const p = phys[i], c = centers[i];
      if (collapsed) {
        const tx = cx - c.x - p.px, ty = cy - c.y - p.py;
        const d = Math.sqrt(tx * tx + ty * ty) + 0.1;
        p.vx += (tx / d) * Math.min(d * 0.12, 3.5);
        p.vy += (ty / d) * Math.min(d * 0.12, 3.5);
      } else {
        p.vx += (-p.px) * 0.045 + Math.sin(t * p.freq + p.phase) * 0.07;
        p.vy += (-p.py) * 0.045 + Math.cos(t * p.freq * 0.7 + p.phase) * 0.055;
      }
      p.vx *= 0.80; p.vy *= 0.80;
      p.px += p.vx; p.py += p.vy;
      s.style.transform = `translate(${p.px}px,${p.py}px)`;
    });
    requestAnimationFrame(tick);
  }
  setTimeout(tick, 300);
  sec.addEventListener('mouseenter', () => { collapsed = true; });
  sec.addEventListener('mouseleave', () => { collapsed = false; });

  const wrap = addCanvas(sec);
  loadP5(() => {
    new p5(sk => {
      let W, H;
      const dust = [];
      const ND = 200;

      function makeDust() {
        return {
          x: sk.random(W), y: sk.random(H),
          vx: sk.random(-0.18, 0.18), vy: sk.random(-0.14, -0.04),
          sz: sk.random(0.8, 2.4), al: sk.random(12, 45), ph: sk.random(sk.TWO_PI)
        };
      }

      sk.setup = () => {
        W = sec.offsetWidth; H = sec.offsetHeight;
        sk.createCanvas(W, H).parent(wrap); sk.noStroke();
        for (let i = 0; i < ND; i++) dust.push(makeDust());
      };

      sk.draw = () => {
        sk.clear();
        dust.forEach((d, i) => {
          d.x += d.vx + Math.sin(sk.frameCount * 0.009 + d.ph) * 0.09;
          d.y += d.vy;
          if (d.y < -8) dust[i] = { ...makeDust(), x: sk.random(W), y: H + 4 };
          const fl = 0.65 + 0.35 * Math.sin(sk.frameCount * 0.038 + d.ph);
          sk.fill(13, 12, 10, d.al * fl);
          sk.ellipse(d.x, d.y, d.sz);
        });
      };

      sk.windowResized = () => { W = sec.offsetWidth; H = sec.offsetHeight; sk.resizeCanvas(W, H); };
    });
  });
}

/* ══════════════════════════════════════════
   3 — WAVE INTERFERENCE FIELD
   Yellow bg. Each letter position is a wave source.
   Canvas draws the real-time interference pattern
   as curved scanlines. Letters vibrate at their
   local wave phase. Mouse adds a dynamic source.
   ══════════════════════════════════════════ */
function init3() {
  const sec = document.getElementById('intro-3');
  if (!sec) return;
  const letters = splitH1(sec);
  const wrap = addCanvas(sec);

  loadP5(() => {
    new p5(sk => {
      let W, H, sources = [], inited = false;
      const LAMBDA = 125, STEP = 11, AMP = 7;

      sk.setup = () => {
        W = sec.offsetWidth; H = sec.offsetHeight;
        sk.createCanvas(W, H).parent(wrap); sk.noFill();
        setTimeout(() => { sources = letterCentersOf(letters, sec); inited = true; }, 350);
      };

      sk.draw = () => {
        sk.clear();
        if (!inited || sources.length === 0) return;
        const tt = sk.frameCount * 0.038;

        function waveAt(x, y) {
          let w = 0;
          sources.forEach((c, i) => {
            const d = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
            w += Math.sin((d / LAMBDA) * sk.TWO_PI - tt + i * 0.45) / (0.5 + d * 0.004);
          });
          // Mouse as extra source
          const md = Math.sqrt((x - sk.mouseX) ** 2 + (y - sk.mouseY) ** 2);
          w += Math.sin((md / LAMBDA) * sk.TWO_PI - tt * 1.4) * 0.6;
          return w;
        }

        // Draw interference scanlines
        for (let y = 0; y < H; y += STEP) {
          const pts = [];
          for (let x = 0; x <= W; x += 7) pts.push({ x, y: y + waveAt(x, y) * AMP });
          // Line alpha based on wave amplitude at midpoint
          const midW = waveAt(W / 2, y);
          sk.stroke(13, 12, 10, sk.map(Math.abs(midW), 0, sources.length * 0.6, 6, 58));
          sk.strokeWeight(0.75);
          sk.beginShape();
          pts.forEach(p => sk.curveVertex(p.x, p.y));
          sk.endShape();
        }

        // Vibrate letter spans vertically
        letters.forEach((span, i) => {
          if (!sources[i]) return;
          const c = sources[i];
          let w = 0;
          sources.forEach((c2, j) => {
            if (j === i) return;
            const d = Math.sqrt((c.x - c2.x) ** 2 + (c.y - c2.y) ** 2);
            w += Math.sin((d / LAMBDA) * sk.TWO_PI - tt + j * 0.45) / (0.5 + d * 0.004);
          });
          span.style.transform = `translateY(${w * 3.5}px)`;
        });
      };

      sk.windowResized = () => {
        W = sec.offsetWidth; H = sec.offsetHeight; sk.resizeCanvas(W, H);
        inited = false;
        setTimeout(() => { sources = letterCentersOf(letters, sec); inited = true; }, 100);
      };
    });
  });
}

/* ══════════════════════════════════════════
   4 — INK EXHALE
   Pink bg. Each letter breathes dark ink smoke
   upward. Mouse proximity intensifies the exhale.
   Puffs spiral and diffuse as they rise.
   Letters pulse with a slow breath rhythm.
   ══════════════════════════════════════════ */
function init4() {
  const sec = document.getElementById('intro-4');
  if (!sec) return;
  const letters = splitH1(sec);

  // Breath pulse on letters
  const bPhases = letters.map((_, i) => i * 0.28);
  let bt = 0;
  function breathe() {
    bt += 0.018;
    letters.forEach((s, i) => {
      const sc = 1 + Math.sin(bt + bPhases[i]) * 0.016;
      s.style.transform = `scale(${sc})`;
    });
    requestAnimationFrame(breathe);
  }
  setTimeout(breathe, 300);

  const wrap = addCanvas(sec);
  loadP5(() => {
    new p5(sk => {
      let W, H, sources = [], inited = false;
      const puffs = [];
      const MAX_PUFFS = 500;

      class Puff {
        constructor(x, y, intensity) {
          this.x = x + sk.random(-10, 10);
          this.y = y;
          this.vx = sk.random(-0.35, 0.35);
          this.vy = sk.random(-1.4, -0.5) * sk.map(intensity, 0.3, 2.5, 0.5, 1.4);
          this.sz = sk.random(10, 32) * sk.map(intensity, 0.3, 2.5, 0.5, 1.3);
          this.al = sk.random(22, 68) * sk.map(intensity, 0.3, 2.5, 0.5, 1);
          this.life = sk.random(55, 170);
          this.age = 0;
          this.spin = sk.random(-0.025, 0.025);
          this.ang = 0;
        }
        step() {
          this.vx += sk.random(-0.04, 0.04);
          this.vy *= 0.987;
          this.x += this.vx;
          this.y += this.vy;
          this.sz += 0.28;
          this.ang += this.spin;
          this.age++;
        }
        draw() {
          const t = this.age / this.life;
          const a = this.al * (1 - t) * sk.map(t, 0, 0.12, 0, 1);
          sk.fill(13, 12, 10, a);
          sk.noStroke();
          sk.push();
          sk.translate(this.x, this.y);
          sk.rotate(this.ang);
          sk.ellipse(0, 0, this.sz, this.sz * 0.68);
          sk.pop();
        }
        dead() { return this.age > this.life; }
      }

      sk.setup = () => {
        W = sec.offsetWidth; H = sec.offsetHeight;
        sk.createCanvas(W, H).parent(wrap);
        setTimeout(() => { sources = letterCentersOf(letters, sec); inited = true; }, 350);
      };

      sk.draw = () => {
        sk.clear();
        if (!inited) return;

        // Spawn puffs from each letter
        if (puffs.length < MAX_PUFFS && sk.frameCount % 2 === 0) {
          sources.forEach(c => {
            const mdx = sk.mouseX - c.x, mdy = sk.mouseY - c.y;
            const md = Math.sqrt(mdx * mdx + mdy * mdy);
            const intensity = sk.map(md, 0, 280, 2.5, 0.3, true);
            if (Math.random() < 0.55) puffs.push(new Puff(c.x, c.y, intensity));
          });
        }

        for (let i = puffs.length - 1; i >= 0; i--) {
          puffs[i].step();
          puffs[i].draw();
          if (puffs[i].dead()) puffs.splice(i, 1);
        }
      };

      sk.windowResized = () => {
        W = sec.offsetWidth; H = sec.offsetHeight; sk.resizeCanvas(W, H);
        inited = false;
        setTimeout(() => { sources = letterCentersOf(letters, sec); inited = true; }, 100);
      };
    });
  });
}

/* ══════════════════════════════════════════
   5 — CONSTELLATION SWARM
   Black bg, outlined type. Firefly particles
   drift via Perlin noise, pulse brightness, and
   form constellation lines when close together.
   Particles are drawn toward the letterform zone.
   Mouse scatters the swarm.
   ══════════════════════════════════════════ */
function init5() {
  const sec = document.getElementById('intro-5');
  if (!sec) return;
  const wrap = addCanvas(sec);

  loadP5(() => {
    new p5(sk => {
      let W, H, anchors = [];
      const N = 240;
      const stars = [];

      class Star {
        constructor() { this.init(); }
        init() {
          this.x = sk.random(W); this.y = sk.random(H);
          this.vx = sk.random(-0.3, 0.3); this.vy = sk.random(-0.3, 0.3);
          this.ph = sk.random(sk.TWO_PI);
          this.freq = sk.random(0.016, 0.055);
          this.sz = sk.random(1.5, 4.5);
          this.no = sk.random(1000);
          this.color = Math.random() < 0.5 ? 0 : 1; // 0=pink, 1=white
        }
        step() {
          // Perlin drift
          const a = sk.noise(this.x * 0.003, this.y * 0.003, this.no + sk.frameCount * 0.002) * sk.TWO_PI * 2;
          this.vx += Math.cos(a) * 0.028;
          this.vy += Math.sin(a) * 0.028;

          // Pull toward nearest anchor
          if (anchors.length > 0) {
            let bd = 9999, bc = null;
            anchors.forEach(c => {
              const d = Math.hypot(c.x - this.x, c.y - this.y);
              if (d < bd) { bd = d; bc = c; }
            });
            if (bc && bd < 320 && bd > 12) {
              this.vx += ((bc.x - this.x) / bd) * 0.035;
              this.vy += ((bc.y - this.y) / bd) * 0.035;
            }
          }

          // Mouse scatter
          const mdx = this.x - sk.mouseX, mdy = this.y - sk.mouseY;
          const md = Math.hypot(mdx, mdy);
          if (md < 170 && md > 0) {
            this.vx += (mdx / md) * sk.map(md, 0, 170, 1.4, 0);
            this.vy += (mdy / md) * sk.map(md, 0, 170, 1.4, 0);
          }

          this.vx *= 0.93; this.vy *= 0.93;
          this.x += this.vx; this.y += this.vy;
          if (this.x < -60 || this.x > W + 60 || this.y < -60 || this.y > H + 60) this.init();
        }
        draw() {
          const pulse = 0.45 + 0.55 * Math.sin(sk.frameCount * this.freq + this.ph);
          const speed = Math.hypot(this.vx, this.vy);
          let r, g, b;
          if (this.color === 0) {
            // pink
            r = 255; g = sk.map(speed, 0, 2.5, 148, 80); b = sk.map(speed, 0, 2.5, 201, 140);
          } else {
            // cool white
            r = sk.map(speed, 0, 2.5, 220, 180); g = r; b = 255;
          }
          const a = 140 * pulse;
          sk.noStroke();
          // halo
          sk.fill(r, g, b, a * 0.12);
          sk.ellipse(this.x, this.y, this.sz * 4.5);
          // core
          sk.fill(r, g, b, a);
          sk.ellipse(this.x, this.y, this.sz);
        }
      }

      sk.setup = () => {
        W = sec.offsetWidth; H = sec.offsetHeight;
        sk.createCanvas(W, H).parent(wrap);
        for (let i = 0; i < N; i++) stars.push(new Star());
        setTimeout(() => {
          // Sample anchor points across the h1 text area
          const h1 = sec.querySelector('h1');
          if (!h1) return;
          const secR = sec.getBoundingClientRect();
          const hr = h1.getBoundingClientRect();
          const cols = 24, rows = 2;
          for (let ci = 0; ci < cols; ci++) {
            for (let ri = 0; ri < rows; ri++) {
              anchors.push({
                x: (hr.left - secR.left) + hr.width * (ci / (cols - 1)),
                y: (hr.top - secR.top) + hr.height * (ri / (rows - 1))
              });
            }
          }
        }, 400);
      };

      sk.draw = () => {
        sk.clear();

        // Constellation connections
        sk.strokeWeight(0.4);
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 85) {
              sk.stroke(255, 148, 201, sk.map(d, 0, 85, 40, 0));
              sk.line(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
            }
          }
        }

        stars.forEach(s => { s.step(); s.draw(); });
      };

      sk.windowResized = () => { W = sec.offsetWidth; H = sec.offsetHeight; sk.resizeCanvas(W, H); };
    });
  });
}

/* ── Boot all ── */
loadP5(() => {
  init1();
  init2();
  init3();
  init4();
  init5();
});
