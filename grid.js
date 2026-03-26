/* ── OPL Grid Overlay — press G to toggle ── */
(function () {
  const COLS   = 12;
  const COL_BG = 'rgba(255, 40, 40, 0.08)';
  const COL_BD = 'rgba(255, 40, 40, 0.18)';

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
            background:${COL_BG};
            box-shadow: inset 1px 0 0 ${COL_BD}, inset -1px 0 0 ${COL_BD};
            height:100%;
          "></div>`
        ).join('') }
      </div>
    </div>`;

  document.body.appendChild(overlay);

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
    borderRadius:   '0',
    padding:        '0',
  });
  document.body.appendChild(btn);

  let visible = false;

  function toggle() {
    visible = !visible;
    overlay.style.display      = visible ? 'block' : 'none';
    btn.style.borderColor      = visible ? 'rgba(255,40,40,0.6)' : 'rgba(140,136,133,0.4)';
    btn.style.color            = visible ? 'rgba(255,40,40,0.9)' : '#8C8885';
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
