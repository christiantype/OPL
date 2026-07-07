/* ── OPL Grid Overlay — press G to toggle ── */
(function () {
  const MOBILE_BP = 640;

  function colCount() {
    return window.innerWidth <= MOBILE_BP ? 6 : 12;
  }

  function colStyle(n) {
    const gridCols = n === 6 ? 'repeat(6,1fr)' : 'repeat(12,1fr)';
    return `
      <div class="container" style="height:100%;">
        <div style="display:grid;grid-template-columns:${gridCols};gap:var(--grid-gap);height:100%;align-items:stretch;">
          ${ Array.from({length: n}, () =>
            `<div style="
              height:100%;
              box-shadow: inset 0.3px 0 0 rgba(180,180,180,0.5), inset -0.3px 0 0 rgba(180,180,180,0.5);
            "></div>`
          ).join('') }
        </div>
      </div>`;
  }

  /* Overlay shell — fixed, full viewport */
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position:      'fixed',
    inset:         '0',
    zIndex:        '9999',
    pointerEvents: 'none',
    display:       'none',
  });

  overlay.innerHTML = colStyle(colCount());

  window.addEventListener('resize', () => {
    overlay.innerHTML = colStyle(colCount());
  });

  document.body.appendChild(overlay);

  /* No on-screen button — press G to toggle the grid overlay. */
  let visible = false;

  function toggle() {
    visible = !visible;
    overlay.style.display = visible ? 'block' : 'none';
  }

  document.addEventListener('keydown', e => {
    if ((e.key === 'g' || e.key === 'G') &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
      toggle();
    }
  });
})();
