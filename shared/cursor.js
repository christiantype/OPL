/* ── OPL Custom Cursor — dot + tapering canvas trail ── */
(function () {
  /* Hide default cursor */
  document.documentElement.style.cursor = 'none';

  /* Cross cursor that tracks the pointer */
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position:      'fixed',
    pointerEvents: 'none',
    zIndex:        '99999',
    width:         '14px',
    height:        '14px',
    transform:     'translate(-50%, -50%)',
    top:           '-100px',
    left:          '-100px',
  });
  dot.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <line x1="7" y1="0" x2="7" y2="14" stroke="#0000FF" stroke-width="1.5"/>
      <line x1="0" y1="7" x2="14" y2="7" stroke="#0000FF" stroke-width="1.5"/>
    </svg>
  `;
  document.body.appendChild(dot);

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
    /* Move dot */
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';

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

  document.addEventListener('mouseleave', function () {
    dot.style.top  = '-100px';
    dot.style.left = '-100px';
  });

})();
