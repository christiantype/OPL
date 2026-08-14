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
          -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); }
        /* Sessions — saved states, top-right of every tool */
        .opal-sessions-btn{ display:inline-flex; align-items:center; gap:7px; padding:7px 13px; cursor:pointer;
          background:var(--paper,#fff); border:1px solid var(--line,rgba(0,0,0,.16)); border-radius:var(--r-control,8px);
          color:var(--ink,#161616); font:inherit; font-size:12.5px; }
        .opal-sessions-btn:hover{ border-color:rgba(0,0,0,.42); }
        .opal-sessions-btn svg{ flex:none; }
        .opal-sessions-pop{ position:fixed; z-index:70; width:300px; max-width:calc(100vw - 24px);
          background:var(--island,#fff); border:1px solid var(--line,rgba(0,0,0,.16)); border-radius:var(--r-island,12px);
          box-shadow:var(--shadow-float,0 8px 24px rgba(0,0,0,.16)); padding:14px; }
        .oss__save{ display:flex; gap:8px; margin-bottom:10px; }
        .oss__save input{ flex:1; min-width:0; padding:7px 9px; border:1px solid var(--line); border-radius:var(--r-input,6px); font:inherit; font-size:13px; background:#fff; color:var(--ink); }
        .oss__savebtn{ flex:none; padding:7px 12px; background:var(--accent,#0f62fe); color:#fff; border:1px solid var(--accent,#0f62fe); border-radius:var(--r-control,8px); cursor:pointer; font:inherit; font-size:12px; }
        .oss__list{ list-style:none; margin:0; padding:0; max-height:260px; overflow-y:auto; }
        .oss__list li{ display:flex; align-items:center; gap:4px; }
        .oss__empty{ color:var(--mute,#525252); font-size:12px; padding:6px 2px; }
        .oss__load{ flex:1; min-width:0; text-align:left; padding:8px 9px; background:none; border:none; border-radius:var(--r-input,6px); color:var(--ink); font:inherit; font-size:13px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .oss__load:hover{ background:rgba(0,0,0,.05); }
        .oss__del{ flex:none; width:26px; height:26px; background:none; border:none; color:var(--mute); cursor:pointer; border-radius:var(--r-input,6px); font-size:16px; line-height:1; }
        .oss__del:hover{ color:var(--rec,#da1e28); }
        .oss__hint{ margin:9px 2px 0; font-size:11px; color:var(--mute); }
        /* Output island as a persistent export panel */
        .opal-export{ display:flex; flex-direction:column; gap:10px; margin:2px 0 12px; }
        .opal-export select.opal-ex-fmt{ width:100%; }
        .opal-export .opal-ex-row{ display:flex; flex-direction:column; gap:3px; }
        .opal-export .opal-ex-row[hidden]{ display:none !important; }
        .opal-export .opal-ex-row > label{ display:flex; justify-content:space-between; align-items:baseline; font-size:12px; color:var(--mute); }
        .opal-export .opal-ex-row > label b{ color:var(--ink); font-variant-numeric:tabular-nums; }
        .opal-export .opal-ex-phys{ font-family:var(--mono); font-size:10.5px; color:var(--mute); }
        .opal-export .opal-ex-row.row-dpi{ flex-direction:row; align-items:center; justify-content:space-between; }
        .opal-export .opal-ex-row.row-dpi select{ width:auto; }`;
      document.head.appendChild(st);
    }
    const WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor" style="display:block;height:33px;width:auto;"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;
    const MENU_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79.7 72" width="17" height="17" fill="currentColor"><path d="M29.3,72h22c16.1,0,28.4-13.1,28.4-28.8v-14.4C79.7,13.1,67.4,0,51.3,0h-22C13.2,0,0,13.1,0,28.8v14.4c0,15.7,13.1,28.8,29.2,28.8h0Z"/></svg>`;
    const bar = document.createElement('header');
    bar.className = 'opal-topbar';
    bar.innerHTML = `
      <a href="/lab/" class="opal-brand" aria-label="Tools home" style="color:inherit;text-decoration:none;">${WORDMARK}</a>
    `;
    mountSessions(bar);   // "Sessions" — saved states, top-right of every tool

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
        ${version ? `<span class="opal-subhead__ver">${String(version).toUpperCase()}</span>` : ''}
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
  // --- Sessions: save/restore the tool's control state, per tool, top-right ---
  function mountSessions(bar){
    const KEY = 'opal-sessions:' + location.pathname;
    const read = () => { try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch(e){ return []; } };
    const write = a => { try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} };
    function capture(){
      const s = {};
      document.querySelectorAll('input, select, textarea').forEach(el => {
        const k = el.id || el.name; if(!k || el.type === 'file') return;
        s[k] = (el.type === 'checkbox' || el.type === 'radio') ? { c: el.checked } : { v: el.value };
      });
      return s;
    }
    function restore(s){
      Object.keys(s || {}).forEach(k => {
        let el = document.getElementById(k); if(!el){ try{ el = document.querySelector('[name="'+k+'"]'); }catch(e){} }
        if(!el) return; const d = s[k];
        if('c' in d) el.checked = d.c; else el.value = d.v;
        el.dispatchEvent(new Event('input', { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
      });
    }
    const btn = document.createElement('button');
    btn.className = 'opal-sessions-btn'; btn.type = 'button'; btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16"/></svg> Sessions';
    bar.appendChild(btn);
    const pop = document.createElement('div'); pop.className = 'opal-sessions-pop'; pop.hidden = true;
    pop.innerHTML = '<div class="oss__save"><input type="text" placeholder="Name this session…" maxlength="48"><button type="button" class="oss__savebtn">Save</button></div><ul class="oss__list"></ul><p class="oss__hint">Saved in this browser, for this tool.</p>';
    document.body.appendChild(pop);
    const listEl = pop.querySelector('.oss__list'), nameEl = pop.querySelector('input'), saveBtn = pop.querySelector('.oss__savebtn');
    function renderList(){
      const items = read(); listEl.innerHTML = '';
      if(!items.length){ listEl.innerHTML = '<li class="oss__empty">No saved sessions yet.</li>'; return; }
      items.forEach((it, i) => {
        const li = document.createElement('li');
        const load = document.createElement('button'); load.className = 'oss__load'; load.type = 'button'; load.textContent = it.name;
        load.addEventListener('click', () => { restore(it.state); });
        const del = document.createElement('button'); del.className = 'oss__del'; del.type = 'button'; del.setAttribute('aria-label','Delete'); del.textContent = '×';
        del.addEventListener('click', () => { const a = read(); a.splice(i,1); write(a); renderList(); });
        li.appendChild(load); li.appendChild(del); listEl.appendChild(li);
      });
    }
    function place(){ const r = btn.getBoundingClientRect(); pop.style.right = Math.max(12, window.innerWidth - r.right) + 'px'; pop.style.left = 'auto'; pop.style.top = (r.bottom + 8) + 'px'; }
    function open(){ place(); renderList(); pop.hidden = false; btn.setAttribute('aria-expanded','true'); }
    function close(){ pop.hidden = true; btn.setAttribute('aria-expanded','false'); }
    btn.addEventListener('click', e => { e.stopPropagation(); pop.hidden ? open() : close(); });
    saveBtn.addEventListener('click', () => { const nm = (nameEl.value||'').trim() || ('Session ' + (read().length + 1)); const a = read(); a.unshift({ name:nm, state:capture() }); write(a); nameEl.value=''; renderList(); });
    nameEl.addEventListener('keydown', e => { if(e.key==='Enter') saveBtn.click(); });
    document.addEventListener('click', e => { if(!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) close(); });
    window.addEventListener('keydown', e => { if(e.key==='Escape') close(); });
  }

  // --- recording timer: mirror the #recDot elapsed time onto the Record button ---
  function wireRecTimer(){
    const dot = document.getElementById('recDot'), btn = document.getElementById('recBtn');
    if(!dot || !btn || btn.dataset.recTimer) return;
    btn.dataset.recTimer = '1';
    const sync = () => {
      if(dot.classList.contains('on')){
        const t = (dot.querySelector('b')||{}).textContent || '0:00';
        btn.textContent = '■ ' + t; btn.classList.add('is-recording');
      } else if(btn.classList.contains('is-recording')){
        btn.classList.remove('is-recording');
      }
    };
    try{ new MutationObserver(sync).observe(dot,{attributes:true, subtree:true, childList:true, characterData:true}); }catch(e){}
    sync();
  }

  // --- Save dialog: choose PNG / JPG / PDF, a scale, quality and DPI ------------
  function dataURLBytes(u){ const s=atob(u.split(',')[1]), a=new Uint8Array(s.length); for(let i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a; }
  function buildPDF(jpeg, w, h, dpi){
    const pw = w/dpi*72, ph = h/dpi*72, enc = new TextEncoder();
    const chunks=[]; let len=0; const off=[];
    const push = s => { const b = typeof s==='string'?enc.encode(s):s; chunks.push(b); len+=b.length; };
    const obj = () => off.push(len);
    push('%PDF-1.4\n');
    obj(); push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    obj(); push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    obj(); push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    obj(); push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`); push(jpeg); push('\nendstream\nendobj\n');
    const content = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;
    obj(); push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    const xrefAt = len;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for(const o of off) xref += String(o).padStart(10,'0') + ' 00000 n \n';
    push(xref); push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
    const out = new Uint8Array(len); let p=0; for(const c of chunks){ out.set(c,p); p+=c.length; }
    return new Blob([out], {type:'application/pdf'});
  }
  function scaledCanvas(src, mult){
    if(mult===1) return src;
    const c=document.createElement('canvas'); c.width=Math.round(src.width*mult); c.height=Math.round(src.height*mult);
    const x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
    x.drawImage(src,0,0,c.width,c.height); return c;
  }
  // Persistent export panel — the Output island always shows every export setting (format · pixels ·
  // physical size · DPI · quality). opts.svg (optional) adds an SVG · vector format.
  function mountOutput(canvas, basename, opts){
    opts = opts || {}; basename = basename || 'export';
    const out = document.getElementById('output') || document.querySelector('.group.out, #dock .out');
    if(!out || out.dataset.exp) return; out.dataset.exp = '1';
    const saveBtn = document.getElementById('saveBtn');
    const box = document.createElement('div'); box.className = 'opal-export';
    box.innerHTML = `
      <select class="opal-ex-fmt"><option value="png">PNG · lossless</option><option value="jpg">JPG · photo</option><option value="pdf">PDF · print</option>${opts.svg?'<option value="svg">SVG · vector</option>':''}</select>
      <div class="opal-ex-row row-px"><label>Pixels <b class="opal-ex-pxv"></b></label><input class="opal-ex-scale" type="range" min="512" max="8192" step="64"><div class="opal-ex-phys"></div></div>
      <div class="opal-ex-row row-q" hidden><label>Quality <b class="opal-ex-qv">92</b></label><input class="opal-ex-q" type="range" min="60" max="100" value="92"></div>
      <div class="opal-ex-row row-dpi"><label>DPI</label><select class="opal-ex-dpi"><option>150</option><option selected>300</option><option>600</option></select></div>`;
    const btnRow = out.querySelector('.grid2') || (saveBtn && saveBtn.parentElement);
    out.insertBefore(box, btnRow || null);
    const $=s=>box.querySelector(s);
    const fmt=$('.opal-ex-fmt'), scale=$('.opal-ex-scale'), pxv=$('.opal-ex-pxv'), phys=$('.opal-ex-phys'),
          qr=$('.opal-ex-q'), qv=$('.opal-ex-qv'), dpi=$('.opal-ex-dpi');
    const longEdge=()=>Math.max(canvas.width, canvas.height);
    scale.max = '8192'; scale.value = '2048';
    function sync(){
      const v = fmt.value;
      box.querySelector('.row-px').hidden = v==='svg';
      box.querySelector('.row-q').hidden  = v!=='jpg';
      box.querySelector('.row-dpi').hidden = v==='svg';
      const px=+scale.value, ar=(canvas.width/canvas.height)||1;
      const w = ar>=1 ? px : Math.round(px*ar), h = ar>=1 ? Math.round(px/ar) : px;
      pxv.textContent = px;
      const d=+dpi.value; phys.textContent = `${(w/d).toFixed(1)}×${(h/d).toFixed(1)}in @${d}`;
    }
    // default Pixels to the canvas's native long edge, once the tool has actually sized it (some size async)
    function setDefault(){ if(scale.dataset.touched) return; const le=longEdge(); if(le>320){ scale.max=String(Math.max(8192, le*3)); scale.value=String(le); } sync(); }
    fmt.addEventListener('change', sync); dpi.addEventListener('change', sync);
    scale.addEventListener('input', ()=>{ scale.dataset.touched='1'; sync(); });
    qr.addEventListener('input', ()=>{ qv.textContent = qr.value; });
    setDefault(); requestAnimationFrame(setDefault); setTimeout(setDefault, 450);
    const asp=document.getElementById('aspect'); if(asp) asp.addEventListener('change', ()=>setTimeout(setDefault, 60));
    const doExport = ()=>{
      const v = fmt.value;
      if(v==='svg'){ try{ const blob=new Blob([opts.svg()],{type:'image/svg+xml'}); const a=document.createElement('a'); a.download=basename+'.svg'; a.href=URL.createObjectURL(blob); a.click(); }catch(e){ console.warn(e); } return; }
      const c = scaledCanvas(canvas, (+scale.value)/longEdge());
      const dl=(href,ext)=>{ const a=document.createElement('a'); a.download=`${basename}@${c.width}x${c.height}.${ext}`; a.href=href; a.click(); };
      if(v==='png') dl(c.toDataURL('image/png'),'png');
      else if(v==='jpg') dl(c.toDataURL('image/jpeg',(+qr.value)/100),'jpg');
      else { const d=+dpi.value, blob=buildPDF(dataURLBytes(c.toDataURL('image/jpeg',.95)), c.width, c.height, d);
        const a=document.createElement('a'); a.download=basename+'.pdf'; a.href=URL.createObjectURL(blob); a.click(); }
    };
    // replace the tool's own Save handler with the export panel's (clone strips existing listeners)
    if(saveBtn){ const clone=saveBtn.cloneNode(true); saveBtn.parentNode.replaceChild(clone, saveBtn); clone.addEventListener('click', doExport); }
  }

  // Fleet-wide: give every standard tool the export panel (high-quality / DPI). Tools with a bespoke
  // export (SVG, re-render) opt out with data-export-custom on their Output island.
  function autoMountOutput(){
    const out = document.getElementById('output') || document.querySelector('.group.out');
    if(!out || out.dataset.exp || out.hasAttribute('data-export-custom') || document.querySelector('[data-export-custom]')) return;
    if(!document.getElementById('saveBtn')) return;
    const canvas = document.querySelector('#art,#gl,#stage,#view,#canvas');
    if(!canvas || canvas.tagName!=='CANVAS') return;
    const name = (location.pathname.replace(/\/index\.html$/,'').split('/').filter(Boolean).pop()) || 'export';
    mountOutput(canvas, name);
  }

  // opts.svg (optional): a function returning an SVG string — enables an "SVG · vector" format.
  function saveDialog(canvas, basename, opts){
    opts = opts || {};
    basename = basename || 'export';
    if(document.getElementById('opal-save')) return;
    const wrap=document.createElement('div'); wrap.id='opal-save';
    wrap.innerHTML = `
      <div class="opal-save__panel" role="dialog" aria-label="Save">
        <div class="opal-save__t">Save image</div>
        <label class="opal-save__row"><span>Format</span>
          <select id="osv-fmt"><option value="png">PNG · lossless</option><option value="jpg">JPG · photo</option><option value="pdf">PDF · print</option>${opts.svg?'<option value="svg">SVG · vector</option>':''}</select></label>
        <label class="opal-save__row" id="osv-srow"><span>Resolution</span>
          <select id="osv-scale"><option value="1">1× · ${canvas.width}×${canvas.height}</option><option value="2">2× · ${canvas.width*2}×${canvas.height*2}</option><option value="3">3× · ${canvas.width*3}×${canvas.height*3}</option></select></label>
        <label class="opal-save__row" id="osv-qrow" hidden><span>Quality</span><input id="osv-q" type="range" min="60" max="100" value="92"><b id="osv-qv">92</b></label>
        <label class="opal-save__row" id="osv-drow" hidden><span>DPI</span><select id="osv-dpi"><option>150</option><option selected>300</option><option>600</option></select></label>
        <div class="opal-save__foot"><button class="btn" id="osv-x">Cancel</button><button class="btn primary" id="osv-go">Save</button></div>
      </div>`;
    document.body.appendChild(wrap);
    const $=id=>wrap.querySelector(id);
    const fmt=$('#osv-fmt'), srow=$('#osv-srow'), qrow=$('#osv-qrow'), drow=$('#osv-drow'), q=$('#osv-q'), qv=$('#osv-qv');
    const syncFmt=()=>{ const v=fmt.value; qrow.hidden=v!=='jpg'; drow.hidden=v!=='pdf'; srow.hidden=v==='svg'; };
    fmt.addEventListener('change', syncFmt); syncFmt();
    q.addEventListener('input', ()=>qv.textContent=q.value);
    const close=()=>wrap.remove();
    $('#osv-x').addEventListener('click', close);
    wrap.addEventListener('click', e=>{ if(e.target===wrap) close(); });
    $('#osv-go').addEventListener('click', ()=>{
      if(fmt.value==='svg'){
        try{ const blob=new Blob([opts.svg()], {type:'image/svg+xml'});
          const a=document.createElement('a'); a.download=`${basename}.svg`; a.href=URL.createObjectURL(blob); a.click(); }catch(e){ console.warn(e); }
        close(); return;
      }
      const mult=+$('#osv-scale').value, c=scaledCanvas(canvas, mult);
      const dl=(href, ext)=>{ const a=document.createElement('a'); a.download=`${basename}@${c.width}x${c.height}.${ext}`; a.href=href; a.click(); };
      if(fmt.value==='png'){ dl(c.toDataURL('image/png'),'png'); }
      else if(fmt.value==='jpg'){ dl(c.toDataURL('image/jpeg', (+q.value)/100),'jpg'); }
      else { const dpi=+$('#osv-dpi').value, url=c.toDataURL('image/jpeg',0.95);
        const blob=buildPDF(dataURLBytes(url), c.width, c.height, dpi);
        const a=document.createElement('a'); a.download=`${basename}.pdf`; a.href=URL.createObjectURL(blob); a.click(); }
      close();
    });
  }

  // --- size island: show a W × H readout on every tool (consistent with the rebuilt tools) ---
  function wireSizeReadout(){
    const dock=document.getElementById('sizeDock');
    const sel=dock && (dock.querySelector('#aspect') || dock.querySelector('select'));  // id varies (aspect / stAspect / …)
    if(!dock || !sel || dock.dataset.sizeR) return;
    dock.dataset.sizeR='1';
    let r=document.getElementById('dimReadout');
    if(!r){ r=document.createElement('span'); r.id='dimReadout'; dock.insertBefore(r, dock.firstChild); }
    const upd=()=>{
      const p=(sel.value||'').split(/[x/:]/).map(Number).filter(n=>n>0);
      if(p.length!==2){ r.textContent=''; return; }
      let [w,h]=p;
      if(w<=64 && h<=64){ const f=1080/Math.min(w,h); w=Math.round(w*f); h=Math.round(h*f); } // ratio -> standard px
      r.textContent = `${w} × ${h}`;
    };
    // Default every tool to a 1:1 (square) canvas.
    if(!sel.dataset.sqDefault){ sel.dataset.sqDefault='1';
      const sq=[...sel.options].find(o=>{ const p=(o.value||'').split(/[x/:]/).map(Number).filter(n=>n>0); return p.length===2 && p[0]===p[1]; })
             || [...sel.options].find(o=>/(^|\W)1\s*[:x/]\s*1(\W|$)|square/i.test((o.textContent||'')+' '+(o.value||'')));
      if(sq && sel.value!==sq.value){ sel.value=sq.value; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    }
    sel.addEventListener('change', upd); upd();
  }

  function enhance(){
    try{
      document.querySelectorAll('.seg').forEach(segToSelect);
      // also collapse any >3-button single-select row that a tool didn't tag .seg (e.g. .row groups).
      // Guard on DIRECT children so we never fold a whole island: only a leaf row of buttons qualifies.
      document.querySelectorAll('#dock div').forEach(el=>{
        if(el.dataset.segchecked) return;
        const b=[...el.children].filter(c=>c.tagName==='BUTTON');
        const textOnly = b.length>0 && b.every(x=>(x.textContent||'').trim().length>0 && !x.querySelector('svg,img'));
        if(b.length>3 && textOnly && b.filter(x=>x.getAttribute('aria-pressed')==='true').length===1) segToSelect(el);
      });
      document.querySelectorAll('#dock > .group:not(.out)').forEach(makeAccordion);
      wireRecTimer();
      wireSizeReadout();
      autoMountOutput();
    }catch(e){}
  }
  let _q=false;
  function enhanceSoon(){ if(_q) return; _q=true; requestAnimationFrame(()=>{ _q=false; enhance(); }); }
  if (document.readyState!=='loading') enhanceSoon();
  else document.addEventListener('DOMContentLoaded', enhanceSoon);
  window.addEventListener('load', enhanceSoon);
  try{ new MutationObserver(enhanceSoon).observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}

  return { mountTopbar, fitCover, wrapText, attachDrag, downloadCanvas, saveDialog, mountOutput, LOGO_PATH, enhance };
})();
