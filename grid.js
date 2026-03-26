/* ── OPL Grid Overlay — press G to toggle ── */
(function () {
  const COLS    = 12;
  const COLOR   = 'rgba(255, 40, 40, 0.08)';
  const BORDER  = 'rgba(255, 40, 40, 0.2)';

  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    position:      'fixed',
    inset:         '0',
    zIndex:        '9999',
    pointerEvents: 'none',
    display:       'none',
    boxSizing:     'border-box',
  });

  const inner = document.createElement('div');

  function syncToContainer() {
    const ref = document.querySelector('.container');
    if (!ref) return;
    const rect   = ref.getBoundingClientRect();
    const gap    = getComputedStyle(document.documentElement)
                     .getPropertyValue('--grid-gap').trim() || '24px';
    Object.assign(inner.style, {
      position:            'absolute',
      top:                 '0',
      left:                rect.left + 'px',
      width:               rect.width + 'px',
      display:             'grid',
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      gap:                 gap,
      height:              '100%',
    });
  }

  for (let i = 0; i < COLS; i++) {
    const col = document.createElement('div');
    Object.assign(col.style, {
      background:  COLOR,
      borderLeft:  `1px solid ${BORDER}`,
      borderRight: `1px solid ${BORDER}`,
      height:      '100%',
    });
    inner.appendChild(col);
  }

  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  syncToContainer();
  window.addEventListener('resize', syncToContainer);

  /* Toggle button */
  const btn = document.createElement('button');
  btn.textContent = 'G';

  Object.assign(btn.style, {
    position:       'fixed',
    bottom:         '24px',
    right:          '24px',
    zIndex:         '10000',
    width:          '28px',
    height:         '28px',
    background:     'transparent',
    border:         '1px solid rgba(140,136,133,0.4)',
    color:          '#8C8885',
    fontSize:       '9px',
    fontFamily:     'inherit',
    letterSpacing:  '1px',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'border-color 0.2s, color 0.2s',
    borderRadius:   '0',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = 'rgba(255,40,40,0.5)';
    btn.style.color = 'rgba(255,40,40,0.7)';
  });

  btn.addEventListener('mouseleave', () => {
    if (!visible) {
      btn.style.borderColor = 'rgba(140,136,133,0.4)';
      btn.style.color = '#8C8885';
    }
  });

  document.body.appendChild(btn);

  let visible = false;

  function toggle() {
    visible = !visible;
    overlay.style.display = visible ? 'block' : 'none';
    btn.style.borderColor = visible ? 'rgba(255,40,40,0.6)' : 'rgba(140,136,133,0.4)';
    btn.style.color       = visible ? 'rgba(255,40,40,0.8)' : '#8C8885';
  }

  btn.addEventListener('click', toggle);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
      if (document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        toggle();
      }
    }
  });
})();
