/* ── OPL Custom Cursor — tapering canvas trail (no pointer mark) ── */
(function () {
  /* Hide default cursor */
  document.documentElement.style.cursor = 'none';

  /* Full-page canvas for the trail */
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    pointerEvents: 'none',
    zIndex:        '99998',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* Trail state */
  const trail   = [];
  const MAX     = 180;
  let trailAlpha = 0;
  let idleTimer  = null;
  let animating  = false;

  /* Draw one frame */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (trail.length < 2 || trailAlpha <= 0) {
      animating = false;
      return;
    }

    for (let i = 1; i < trail.length; i++) {
      const progress = i / trail.length;
      // yellow at tail (progress=0) → red at head (progress=1)
      const r = 255;
      const g = Math.round(255 * (1 - progress));
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.globalAlpha = progress * 0.8 * trailAlpha;
      ctx.strokeStyle = `rgb(${r},${g},0)`;
      ctx.lineWidth   = progress * 1.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  /* Fade out trail when mouse is idle */
  function startFade() {
    (function fade() {
      trailAlpha -= 0.018;
      if (trailAlpha > 0) {
        requestAnimationFrame(fade);
      } else {
        trailAlpha   = 0;
        trail.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animating = false;
      }
    })();
  }

  document.addEventListener('mousemove', function (e) {
    /* Accumulate trail points */
    trail.push({ x: e.clientX, y: e.clientY });
    if (trail.length > MAX) trail.shift();

    trailAlpha = 1;

    /* Reset idle timer */
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startFade, 900);

    /* Kick off draw loop if not already running */
    if (!animating) {
      animating = true;
      requestAnimationFrame(draw);
    }
  });

})();
