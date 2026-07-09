// OP/AL — shared shell helpers
// Injects the topbar with the OPAL mark, product name, and studio link.
// Each tool calls Opal.mountTopbar({ product: 'Tool Name' }) on load.

const Opal = (() => {
  const LOGO_PATH = (() => {
    // Resolve shared/opal-logo.svg relative to this script's URL.
    const scriptSrc = document.currentScript ? document.currentScript.src : location.href;
    return new URL('./opal-logo.svg', scriptSrc).href;
  })();

  function mountTopbar({ product = '', name = '', desc = '', version = '' } = {}) {
    const WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor" style="display:block;height:26px;width:auto;"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;
    const MENU_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79.7 72" width="17" height="17" fill="currentColor"><path d="M29.3,72h22c16.1,0,28.4-13.1,28.4-28.8v-14.4C79.7,13.1,67.4,0,51.3,0h-22C13.2,0,0,13.1,0,28.8v14.4c0,15.7,13.1,28.8,29.2,28.8h0Z"/></svg>`;
    const bar = document.createElement('header');
    bar.className = 'opal-topbar';
    bar.innerHTML = `
      <a href="/lab/" class="opal-brand" aria-label="Tools home" style="color:#1a1a1a;text-decoration:none;display:flex;align-items:center;gap:14px;">
        ${WORDMARK}
        ${product ? `<span class="opal-divider"></span><span class="opal-product" style="color:#8a8a8a;font-size:12px;letter-spacing:.14em;text-transform:uppercase;">${product}</span>` : ''}
      </a>
      <a href="/lab/" class="opal-menu-btn" aria-label="Back to Tools" style="color:#1a1a1a;line-height:0;text-decoration:none;">
        ${MENU_ICON}
      </a>
    `;
    // Sub-header band: tool name · brief description · version. Same on every tool.
    let sub = null;
    if (name || desc || version) {
      sub = document.createElement('div');
      sub.className = 'opal-subhead';
      sub.innerHTML = `
        <div class="opal-subhead__id">
          ${name ? `<span class="opal-subhead__name">${name}</span>` : ''}
          ${desc ? `<span class="opal-subhead__desc">${desc}</span>` : ''}
        </div>
        ${version ? `<span class="opal-subhead__ver">${version}</span>` : ''}
      `;
    }
    if (sub) document.body.prepend(sub);
    document.body.prepend(bar);   // prepend last so the topbar ends up on top
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
