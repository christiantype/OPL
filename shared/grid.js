/* ── OPL Grid Overlay — press G to toggle ── */
(function () {
  const COLS = 12;

  /* Overlay shell — fixed, full viewport */
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position:      'fixed',
    inset:         '0',
    zIndex:        '9999',
    pointerEvents: 'none',
    display:       'none',
  });

  /* Use the real .container + .grid classes so columns are pixel-identical */
  overlay.innerHTML = `
    <div class="container" style="height:100%;">
      <div class="grid" style="height:100%;align-items:stretch;">
        ${ Array.from({length: COLS}, () =>
          `<div class="col-1" style="
            background: transparent;
            box-shadow: inset 0.3px 0 0 var(--color-mid), inset -0.3px 0 0 var(--color-mid);
            opacity: 0.3;
            height:100%;
          "></div>`
        ).join('') }
      </div>
    </div>`;

  document.body.appendChild(overlay);

  /* Toggle button */
  const btn = document.createElement('button');
  btn.innerHTML = `<svg width="14" height="12" viewBox="0 0 14 12" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="0" x2="2" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="0" x2="7" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="0" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>`;
  Object.assign(btn.style, {
    position:       'fixed',
    bottom:         '24px',
    right:          '24px',
    zIndex:         '10000',
    width:          '28px',
    height:         '28px',
    background:     'var(--color-light)',
    border:         '1px solid var(--color-mid)',
    color:          'var(--color-mid)',
    fontSize:       '9px',
    fontFamily:     'inherit',
    letterSpacing:  '1px',
    cursor:         'pointer',
    borderRadius:   '0',
    padding:        '0',
  });
  document.body.appendChild(btn);

  let visible = true;
  overlay.style.display = 'block';

  function toggle() {
    visible = !visible;
    overlay.style.display      = visible ? 'block' : 'none';
    btn.style.borderColor      = visible ? 'var(--color-accent)' : 'var(--color-mid)';
    btn.style.color            = visible ? 'var(--color-accent)' : 'var(--color-mid)';
  }

  btn.addEventListener('click', toggle);

  document.addEventListener('keydown', e => {
    if ((e.key === 'g' || e.key === 'G') &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
      toggle();
    }
  });
})();
