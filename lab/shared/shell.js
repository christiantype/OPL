/* ===========================================================================
   OP/AL shared tool shell — behaviour for shell.css.
   Wires the left rail (panel toggle), slider value readouts, canvas resizing,
   and a shared PNG save + format-cropped video recorder so each tool stays lean.

   A tool calls:  Shell.init({ canvas:'#gl', name:'silk', formats:['9:16','1:1'] })
   and listens for window 'resize' to re-fit its canvas to #canvasWrap.
=========================================================================== */
window.Shell = (function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  let cfg = {};
  const RECDIMS = {'9:16':[1080,1920],'1:1':[1080,1080],'4:5':[1080,1350],'16:9':[1920,1080]};
  let recFmt='9:16', recording=false, mediaRec=null, chunks=[], raf=null, timer=null, startT=0, fhide=null;
  let frameRect={x:0,y:0,w:0,h:0};
  const rc=document.createElement('canvas'), rctx=rc.getContext('2d');

  const cvEl = () => (typeof cfg.canvas==='string' ? $(cfg.canvas) : cfg.canvas);

  function init(c){
    cfg = c || {};
    const body=document.body;
    // ── left rail ──
    $$('#railL button').forEach(b=>{
      const act=b.dataset.act;
      b.addEventListener('click',()=>{
        if(act==='controls'){ body.classList.toggle('panel-closed'); syncRail(); fireResize(); }
        else if(act==='export'){ const s=$('#tbar [data-role=save]'); if(s)s.click(); }
      });
    });
    syncRail();
    // ── slider value readouts ──
    $$('.ctrl').forEach(ctrl=>{
      const r=ctrl.querySelector('input[type=range]'), v=ctrl.querySelector('.val');
      if(r&&v){ const upd=()=>v.textContent=(ctrl.dataset.suffix?r.value+ctrl.dataset.suffix:r.value); upd(); r.addEventListener('input',upd); }
    });
    // ── bottom bar ──
    const saveBtn=$('#tbar [data-role=save]'); if(saveBtn) saveBtn.addEventListener('click',save);
    const recBtn=$('#tbar [data-role=rec]');   if(recBtn)  recBtn.addEventListener('click',toggleRec);
    const chips=$$('#tbar .fmt .chip');
    chips.forEach(ch=>ch.addEventListener('click',()=>{
      if(recording) return;
      chips.forEach(x=>x.classList.remove('active')); ch.classList.add('active');
      recFmt=ch.dataset.fmt; layoutFrame(); showFrame(true);
      clearTimeout(fhide); fhide=setTimeout(()=>{ if(!recording) showFrame(false); },2600);
    }));
    if(chips.length){ chips[0].classList.add('active'); recFmt=chips[0].dataset.fmt; }
    // ── resize plumbing ──
    const area=$('#canvasArea');
    if(area && 'ResizeObserver' in window) new ResizeObserver(fireResize).observe(area);
    window.addEventListener('resize',()=>{ if(frameEl()&&frameEl().classList.contains('show')) layoutFrame(); });
    // ── hint auto-fade ──
    const h=$('.hint'); if(h) setTimeout(()=>h.classList.add('gone'), cfg.hintMs||7000);
  }
  function syncRail(){ const b=$('#railL [data-act=controls]'); if(b) b.classList.toggle('active', !document.body.classList.contains('panel-closed')); }
  function fireResize(){ setTimeout(()=>window.dispatchEvent(new Event('resize')),0); }

  // ── PNG ──
  function save(){ const cv=cvEl(); if(!cv) return; const a=document.createElement('a');
    a.download=(cfg.name||'export')+'.png'; a.href=cv.toDataURL('image/png'); a.click(); }

  // ── record (format-cropped) ──
  const frameEl=()=>$('.frame');
  function showFrame(on){ const f=frameEl(); if(f) f.classList.toggle('show',on); }
  function layoutFrame(){
    const area=$('#canvasArea'), cv=cvEl(), f=frameEl(); if(!area||!cv||!f) return;
    const ar=area.getBoundingClientRect(), cr=cv.getBoundingClientRect();
    const [rw,rh]=RECDIMS[recFmt]||RECDIMS['9:16'], aspect=rw/rh;
    let h=cr.height, w=h*aspect; if(w>cr.width){ w=cr.width; h=w/aspect; }
    const x=(cr.left-ar.left)+(cr.width-w)/2, y=(cr.top-ar.top)+(cr.height-h)/2;
    f.style.left=x+'px'; f.style.top=y+'px'; f.style.width=w+'px'; f.style.height=h+'px';
    // crop rect in canvas backing-store pixels
    frameRect={ x:(cr.width-w)/2/cr.width*cv.width, y:(cr.height-h)/2/cr.height*cv.height,
                w:w/cr.width*cv.width, h:h/cr.height*cv.height };
  }
  function pickMime(){
    const list=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    for(const m of list){ if(window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; }
    return '';
  }
  function toggleRec(){ recording?stopRec():startRec(); }
  function startRec(){
    const cv=cvEl(); if(!cv) return;
    if(!window.MediaRecorder){ toast('Recording needs Safari or Chrome.'); return; }
    const mime=pickMime(); if(!mime){ toast("This browser can't encode video. Try Safari or Chrome."); return; }
    const [rw,rh]=RECDIMS[recFmt]; rc.width=rw; rc.height=rh;
    layoutFrame(); showFrame(true); frameEl()&&frameEl().classList.add('live');
    const stream=rc.captureStream(60); chunks=[];
    try{ mediaRec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.min(60000000,Math.max(24000000,Math.round(rc.width*rc.height*60*0.25)))}); }
    catch(e){ mediaRec=new MediaRecorder(stream); }
    mediaRec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
    mediaRec.onstop=finishRec; mediaRec.start(100);
    recording=true; startT=performance.now();
    const b=$('#tbar [data-role=rec]'); if(b){ b.classList.add('live'); b.querySelector('[data-reclabel]')&&(b.querySelector('[data-reclabel]').textContent='Stop'); }
    $$('#tbar .fmt .chip').forEach(c=>c.style.pointerEvents='none');
    recLoop(); timer=setInterval(updTime,200); updTime();
  }
  function recLoop(){ const cv=cvEl();
    rctx.drawImage(cv, frameRect.x, frameRect.y, frameRect.w, frameRect.h, 0,0, rc.width, rc.height);
    if(recording) raf=requestAnimationFrame(recLoop);
  }
  function updTime(){ const s=(performance.now()-startT)/1000, t=$('#rectime');
    if(t) t.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0'); }
  function stopRec(){
    if(!recording) return; recording=false; cancelAnimationFrame(raf); clearInterval(timer);
    try{ mediaRec.stop(); }catch(e){}
    const b=$('#tbar [data-role=rec]'); if(b){ b.classList.remove('live'); b.querySelector('[data-reclabel]')&&(b.querySelector('[data-reclabel]').textContent='Rec'); }
    const t=$('#rectime'); if(t) t.textContent='';
    frameEl()&&frameEl().classList.remove('live');
    $$('#tbar .fmt .chip').forEach(c=>c.style.pointerEvents='');
    setTimeout(()=>{ if(!recording) showFrame(false); },1400);
  }
  function finishRec(){
    const type=(mediaRec&&mediaRec.mimeType)||pickMime()||'video/webm';
    const blob=new Blob(chunks,{type}), ext=type.includes('mp4')?'mp4':'webm', url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`${cfg.name||'export'}-${recFmt.replace(':','x')}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    if(ext==='webm') toast('Saved as .webm (desktop-friendly). Record in a phone browser for .mp4.');
  }
  let toastT=null;
  function toast(msg){ let el=$('#toast'); if(!el){ el=document.createElement('div'); el.id='toast'; ($('#stage')||document.body).appendChild(el); }
    el.textContent=msg; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),5200); }

  return { init, save, toast };
})();
