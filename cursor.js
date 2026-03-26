/* ── OPL Custom Cursor — + with fading trail ── */
(function () {

  /* Hide default cursor */
  document.documentElement.style.cursor = 'none';

  /* Main + cursor */
  const cursor = document.createElement('div');
  Object.assign(cursor.style, {
    position:      'fixed',
    pointerEvents: 'none',
    zIndex:        '99999',
    fontSize:      '18px',
    fontFamily:    'inherit',
    fontWeight:    '300',
    color:         '#000',
    lineHeight:    '1',
    transform:     'translate(-50%, -50%)',
    top:           '-100px',
    left:          '-100px',
  });
  cursor.textContent = '+';
  document.body.appendChild(cursor);

  let lastX = 0, lastY = 0, ticking = false;
  const TRAIL_INTERVAL = 30; /* ms between trail marks */
  let lastTrail = 0;

  document.addEventListener('mousemove', function (e) {
    lastX = e.clientX;
    lastY = e.clientY;

    if (!ticking) {
      requestAnimationFrame(function () {
        cursor.style.left = lastX + 'px';
        cursor.style.top  = lastY + 'px';
        ticking = false;
      });
      ticking = true;
    }

    /* Throttle trail creation */
    const now = Date.now();
    if (now - lastTrail < TRAIL_INTERVAL) return;
    lastTrail = now;

    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position:      'fixed',
      pointerEvents: 'none',
      zIndex:        '99998',
      fontSize:      '14px',
      fontFamily:    'inherit',
      fontWeight:    '300',
      color:         '#000',
      lineHeight:    '1',
      transform:     'translate(-50%, -50%)',
      left:          e.clientX + 'px',
      top:           e.clientY + 'px',
      opacity:       '0.5',
      transition:    'opacity 1s ease',
    });
    dot.textContent = '+';
    document.body.appendChild(dot);

    requestAnimationFrame(function () {
      dot.style.opacity = '0';
    });

    setTimeout(function () { dot.remove(); }, 1000);
  });

  /* Restore cursor when leaving window */
  document.addEventListener('mouseleave', function () {
    cursor.style.top  = '-100px';
    cursor.style.left = '-100px';
  });

})();
