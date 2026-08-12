// OP/AL — shared shell helpers
// Injects the topbar with the OPAL mark, product name, and studio link.
// Each tool calls Opal.mountTopbar({ product: 'Tool Name' }) on load.

const Opal = (() => {
  const LOGO_PATH = (() => {
    // Resolve shared/opal-logo.svg relative to this script's URL.
    const scriptSrc = document.currentScript ? document.currentScript.src : location.href;
    return new URL('./opal-logo.svg', scriptSrc).href;
  })();

  function mountTopbar({ product = '', name = '', desc = '', version = '', about = '' } = {}) {
    if (!document.getElementById('opal-shell-css')) {
      const st = document.createElement('style'); st.id = 'opal-shell-css';
      st.textContent = `
        /* Site-style nav — one row, big wordmark, 10em inset: matches more-than.design everywhere. */
        .opal-topbar{ position:fixed; top:0; left:0; right:0; z-index:10; height:82px; box-sizing:border-box;
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          padding:0 160px; background:transparent; border:none; }
        @media (max-width:900px){ .opal-topbar{ padding:0 64px; } }
        @media (max-width:560px){ .opal-topbar{ padding:0 20px; height:74px; } }
        .opal-brand{ display:flex; align-items:center; text-decoration:none; }
        .opal-brand svg{ height:33px; width:auto; display:block; }
        .opal-topid{ display:flex; align-items:baseline; gap:14px; min-width:0; }
        .opal-info{ appearance:none; width:15px; height:15px; border-radius:50%; border:1px solid currentColor;
          background:none; color:inherit; opacity:.5; font:italic 600 9px/1 ui-serif,Georgia,serif;
          cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0; flex:none; }
        .opal-info:hover, .opal-info[aria-expanded="true"]{ opacity:1; }
        .opal-about{ position:fixed; z-index:60; max-width:328px; padding:12px 14px; border-radius:10px;
          font-size:12px; line-height:1.55; letter-spacing:.01em; background:rgba(18,20,26,.97); color:#eef0f4;
          border:1px solid rgba(255,255,255,.14); box-shadow:0 14px 44px -14px rgba(0,0,0,.65);
          -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); }`;
      document.head.appendChild(st);
    }
    const WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor" style="display:block;height:33px;width:auto;"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;
    const MENU_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79.7 72" width="17" height="17" fill="currentColor"><path d="M29.3,72h22c16.1,0,28.4-13.1,28.4-28.8v-14.4C79.7,13.1,67.4,0,51.3,0h-22C13.2,0,0,13.1,0,28.8v14.4c0,15.7,13.1,28.8,29.2,28.8h0Z"/></svg>`;
    const bar = document.createElement('header');
    bar.className = 'opal-topbar';
    bar.innerHTML = `
      <a href="/lab/" class="opal-brand" aria-label="Tools home" style="color:inherit;text-decoration:none;">${WORDMARK}</a>
    `;

    // Sub-header band BELOW the topbar: tool name · description · info · version — same on every tool.
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
    // Info tooltip beside the tool name — hover to show, click to pin.
    if (sub && (about || desc)) {
      const idRow = sub.querySelector('.opal-subhead__id');
      const btn = document.createElement('button');
      btn.className = 'opal-info'; btn.type = 'button'; btn.textContent = 'i';
      btn.setAttribute('aria-label', 'About this tool'); btn.setAttribute('aria-expanded', 'false');
      const pop = document.createElement('div');
      pop.className = 'opal-about'; pop.hidden = true; pop.textContent = about || desc;
      idRow.appendChild(btn); document.body.appendChild(pop);
      let pinned = false;
      const place = () => { const r = btn.getBoundingClientRect();
        pop.style.left = Math.max(12, r.left) + 'px'; pop.style.right = 'auto'; pop.style.top = (r.bottom + 8) + 'px'; };
      const show = () => { place(); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
      const hide = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('pointerenter', show);
      btn.addEventListener('pointerleave', () => { if (!pinned) hide(); });
      btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); pinned = !pinned; pinned ? show() : hide(); });
      document.addEventListener('click', e => { if (pinned && e.target !== btn && !pop.contains(e.target)) { pinned = false; hide(); } });
      window.addEventListener('keydown', e => { if (e.key === 'Escape') { pinned = false; hide(); } });
      window.addEventListener('scroll', () => { pinned = false; hide(); }, true);
    }
    if (sub) document.body.prepend(sub);
    document.body.prepend(bar);   // prepend last so the topbar sits above the subhead
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

  // --- shell enhancements: segmented>3 -> dropdown, and collapsible islands ---
  function isActive(b){ return b.getAttribute('aria-pressed')==='true'
    || b.classList.contains('active') || b.classList.contains('on') || b.classList.contains('primary'); }
  function segToSelect(seg){
    if (seg.dataset.segchecked) return;           // decide ONCE, never re-evaluate (protects multi-toggles)
    seg.dataset.segchecked = '1';
    const btns = [...seg.querySelectorAll('button')];
    if (btns.length <= 3) return;                 // 3 or fewer stay segmented
    if (btns.filter(isActive).length !== 1) return; // only single-select rows (exactly one active); leave multi-toggle rows (mute/hold) alone
    seg.dataset.autosel = '1';
    const sel = document.createElement('select');
    sel.className = 'seg-select';
    btns.forEach((b,i)=>{ const o=document.createElement('option'); o.value=String(i);
      o.textContent=(b.textContent||'').trim()||('Option '+(i+1)); if(isActive(b)) o.selected=true; sel.appendChild(o); });
    sel.addEventListener('change', ()=>{ const b=btns[+sel.value]; if(b) b.click(); });
    seg.style.display='none';                       // keep buttons (hidden) so tool wiring still fires
    seg.setAttribute('aria-hidden','true');
    if (seg.parentNode) seg.parentNode.insertBefore(sel, seg.nextSibling);
    try{ const mo=new MutationObserver(()=>{ const i=btns.findIndex(isActive);
      if(i>=0 && String(sel.value)!==String(i)) sel.value=String(i); });
      btns.forEach(b=>mo.observe(b,{attributes:true, attributeFilter:['aria-pressed','class']})); }catch(e){}
  }
  function makeAccordion(g){
    const t = g.querySelector(':scope > .group__t'); if(!t || t.dataset.acc) return;
    t.dataset.acc='1';
    t.addEventListener('click', ()=>g.classList.toggle('collapsed'));
  }
  function enhance(){
    try{
      document.querySelectorAll('.seg').forEach(segToSelect);
      document.querySelectorAll('#dock > .group:not(.out)').forEach(makeAccordion);
    }catch(e){}
  }
  let _q=false;
  function enhanceSoon(){ if(_q) return; _q=true; requestAnimationFrame(()=>{ _q=false; enhance(); }); }
  if (document.readyState!=='loading') enhanceSoon();
  else document.addEventListener('DOMContentLoaded', enhanceSoon);
  window.addEventListener('load', enhanceSoon);
  try{ new MutationObserver(enhanceSoon).observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}

  return { mountTopbar, fitCover, wrapText, attachDrag, downloadCanvas, LOGO_PATH, enhance };
})();
