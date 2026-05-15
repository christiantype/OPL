// OP/AL — shared shell helpers
// Injects the topbar with the OPAL mark, product name, and studio link.
// Each tool calls Opal.mountTopbar({ product: 'Tool Name' }) on load.

const Opal = (() => {
  const LOGO_PATH = (() => {
    // Resolve shared/opal-logo.svg relative to this script's URL.
    const scriptSrc = document.currentScript ? document.currentScript.src : location.href;
    return new URL('./opal-logo.svg', scriptSrc).href;
  })();

  function mountTopbar({ product = '', studioUrl = 'https://more-than.design' } = {}) {
    const bar = document.createElement('header');
    bar.className = 'opal-topbar';
    bar.innerHTML = `
      <div class="opal-brand">
        <a href="../../index.html" class="opal-mark" aria-label="OP/AL home">
          <img src="${LOGO_PATH}" alt="OP/AL" />
        </a>
        ${product ? `<span class="opal-divider"></span><span class="opal-product">${product}</span>` : ''}
      </div>
      <div class="opal-meta">
        <a href="${studioUrl}" target="_blank" rel="noopener">An OP/AL Studio Product · more-than.design</a>
      </div>
    `;
    document.body.prepend(bar);
  }

  // Image utilities for tools that render to canvas.
  function fitCover(img, cw, ch, zoom = 1, anchorX = 0.5, anchorY = 0.5) {
    const base = Math.max(cw / img.width, ch / img.height);
    const scale = base * zoom;
    const dw = img.width * scale, dh = img.height * scale;
    const dx = (cw - dw) * anchorX;
    const dy = (ch - dh) * anchorY;
    return { dx, dy, dw, dh };
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else { line = test; }
    }
    if (line) lines.push(line);
    return lines;
  }

  function attachDrag(canvas, state, onChange) {
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', e => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - lastX) / rect.width;
      const dy = (e.clientY - lastY) / rect.height;
      state.bgX = Math.min(1, Math.max(0, state.bgX - dx));
      state.bgY = Math.min(1, Math.max(0, state.bgY - dy));
      lastX = e.clientX; lastY = e.clientY;
      onChange();
    });
    canvas.addEventListener('pointerup', () => dragging = false);
    canvas.addEventListener('pointercancel', () => dragging = false);
  }

  function downloadCanvas(canvas, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return { mountTopbar, fitCover, wrapText, attachDrag, downloadCanvas, LOGO_PATH };
})();
