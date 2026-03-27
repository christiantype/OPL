/* ── OPL Custom Cursor — dot + tapering canvas trail ── */
(function () {

  /* Hide default cursor */
  document.documentElement.style.cursor = 'none';

  /* Small dot that tracks the pointer */
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position:      'fixed',
    pointerEvents: 'none',
    zIndex:        '99999',
    width:         '6px',
    height:        '6px',
    borderRadius:  '50%',
    background:    '#0D0C0A',
    transform:     'translate(-50%, -50%)',
    top:           '-100px',
    left:          '-100px',
  });
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
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = `rgba(13,12,10,${progress * 0.5 * trailAlpha})`;
      ctx.lineWidth   = progress * 1.1;
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
