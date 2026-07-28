// main.js — WebGL2 engine for the raymarched fractal generator.
// Pipeline: fractal.frag renders the scene to an HDR framebuffer (render-scaled), then a
// post chain (bright-pass → separable blur → composite with ACES tonemap + vignette + dither)
// draws to the canvas. The scene shader is fetched so you can edit fractal.frag and refresh.
'use strict';

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', { antialias:false, preserveDrawingBuffer:false });
const errBox = document.getElementById('err');
const showErr = m => { errBox.style.display = m?'block':'none'; errBox.textContent = m||''; };
if (!gl) { showErr('WebGL2 is not available in this browser.'); throw new Error('no webgl2'); }
gl.getExtension('EXT_color_buffer_float');       // RGBA16F render targets
gl.getExtension('OES_texture_float_linear');     // linear filtering of float textures

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI*2, clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ---------------- parameters ----------------
const P = {
  fractal:0, power:8, mbScale:-2.0, mbFold:0.5, juliaC:[-0.8,0.156], extrude:0.35, edgeBevel:0.03,
  round:0.0, chamfer:0.0,
  metal:0.92, rough:0.14, reflBounces:1, reflSamples:1, irid:0.28,
  palA:[0.5,0.5,0.5], palB:[0.5,0.5,0.5], palC:[1.0,1.0,1.0], palD:[0.0,0.33,0.67], palPhase:0.0, palDrift:0.03,
  camRadius:3.0, camHeight:0.35, camSpeed:0.12,
  lfoRate:0.2, lfoDepth:0.0,
  maxSteps:160, maxDist:20.0, aoOn:1, shadowOn:1,
  renderScale:0.85, bloom:0.55, bloomThresh:1.0, vignette:0.35, exposure:1.0, dither:1,
  play: !reduced,
};

// ---------------- shaders (post chain is inline; scene is fetched) ----------------
const VERT = `#version 300 es
in vec2 p; out vec2 vuv; void main(){ vuv=p*0.5+0.5; gl_Position=vec4(p,0.0,1.0); }`;

const BRIGHT = `#version 300 es
precision highp float; in vec2 vuv; uniform sampler2D u_tex; uniform float u_thresh; out vec4 o;
void main(){ vec3 c=texture(u_tex,vuv).rgb; float l=dot(c,vec3(0.2126,0.7152,0.0722));
  o=vec4(c*max(0.0,l-u_thresh)/max(l,1e-4),1.0); }`;

const BLUR = `#version 300 es
precision highp float; in vec2 vuv; uniform sampler2D u_tex; uniform vec2 u_dir; out vec4 o;
void main(){ vec2 px=u_dir/vec2(textureSize(u_tex,0));
  vec3 c=texture(u_tex,vuv).rgb*0.227027;
  c+=texture(u_tex,vuv+px*1.3846).rgb*0.316216; c+=texture(u_tex,vuv-px*1.3846).rgb*0.316216;
  c+=texture(u_tex,vuv+px*3.2308).rgb*0.070270; c+=texture(u_tex,vuv-px*3.2308).rgb*0.070270;
  o=vec4(c,1.0); }`;

const COMPOSITE = `#version 300 es
precision highp float; in vec2 vuv;
uniform sampler2D u_scene; uniform sampler2D u_bloom;
uniform float u_bloomAmt, u_exposure, u_vignette, u_dither;
out vec4 o;
vec3 aces(vec3 x){ x*=0.6; const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }
float bayer(vec2 fc){ int x=int(mod(fc.x,4.0)), y=int(mod(fc.y,4.0));
  int m[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(m[y*4+x])/16.0-0.5; }
void main(){
  vec3 col=texture(u_scene,vuv).rgb + texture(u_bloom,vuv).rgb*u_bloomAmt;
  col*=u_exposure;
  col=aces(col);
  float v=1.0-u_vignette*dot(vuv-0.5, vuv-0.5)*2.4; col*=clamp(v,0.0,1.0);      // vignette
  col=pow(col, vec3(0.4545));                                                    // to sRGB
  col+=bayer(gl_FragCoord.xy)*u_dither*(1.0/255.0);                             // ordered dither
  o=vec4(col,1.0);
}`;

function compile(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error((type===gl.VERTEX_SHADER?'[vertex] ':'[fragment] ')+gl.getShaderInfoLog(s));
  return s; }
function program(fs, vs){ const p=gl.createProgram(); gl.attachShader(p,compile(gl.VERTEX_SHADER,vs||VERT));
  gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs)); gl.bindAttribLocation(p,0,'p'); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }

// fullscreen triangle
const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
const vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);

let progScene=null, progBright=program(BRIGHT), progBlur=program(BLUR), progComp=program(COMPOSITE);
let uni={};
function locateScene(){ uni={}; ['u_res','u_time','u_frame','u_fractal','u_camPos','u_camTarget','u_fov',
  'u_power','u_mbScale','u_mbFold','u_juliaC','u_extrude','u_edgeBevel','u_round','u_chamfer','u_metal','u_rough',
  'u_reflBounces','u_reflSamples','u_irid','u_palA','u_palB','u_palC','u_palD','u_palPhase','u_maxSteps','u_maxDist',
  'u_aoOn','u_shadowOn'].forEach(n=>uni[n]=gl.getUniformLocation(progScene,n)); }

// ---------------- framebuffers ----------------
function makeTex(w,h){ const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.FLOAT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return t; }
function makeFBO(w,h){ const tex=makeTex(w,h), fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0); return {fb,tex,w,h}; }
let sceneFB=null, bloomA=null, bloomB=null, fbW=0, fbH=0;
function ensureFBOs(w,h){ if(w===fbW&&h===fbH&&sceneFB) return; fbW=w; fbH=h;
  sceneFB=makeFBO(w,h); bloomA=makeFBO(Math.max(1,w>>1),Math.max(1,h>>1)); bloomB=makeFBO(Math.max(1,w>>1),Math.max(1,h>>1)); }

// ---------------- render ----------------
let frame=0, t0=performance.now(), clock=0, lastMs=0, msAccum=0, msCount=0;
function camera(){ const a=clock*P.camSpeed*TAU;
  const r=P.camRadius; return [Math.cos(a)*r, P.camHeight*r, Math.sin(a)*r]; }
function setSceneUniforms(w,h){
  gl.useProgram(progScene);
  gl.uniform2f(uni.u_res,w,h); gl.uniform1f(uni.u_time,clock); gl.uniform1i(uni.u_frame,frame);
  gl.uniform1i(uni.u_fractal,P.fractal);
  const cp=camera(); gl.uniform3f(uni.u_camPos,cp[0],cp[1],cp[2]); gl.uniform3f(uni.u_camTarget,0,0,0);
  gl.uniform1f(uni.u_fov,1.15);
  // LFO on the active fractal's main parameter
  const lfo=P.lfoDepth*Math.sin(clock*P.lfoRate*TAU);
  gl.uniform1f(uni.u_power, clamp(P.power+lfo*5.0,2.0,12.0));
  gl.uniform1f(uni.u_mbScale, P.mbScale+ (P.fractal===1?lfo*0.7:0.0));
  gl.uniform1f(uni.u_mbFold,P.mbFold);
  let jc=P.juliaC; if(P.fractal===3){ const a=lfo*0.5, c=Math.cos(a), s=Math.sin(a); jc=[P.juliaC[0]*c-P.juliaC[1]*s, P.juliaC[0]*s+P.juliaC[1]*c]; }
  gl.uniform2f(uni.u_juliaC,jc[0],jc[1]);
  gl.uniform1f(uni.u_extrude,P.extrude); gl.uniform1f(uni.u_edgeBevel,P.edgeBevel);
  gl.uniform1f(uni.u_round,P.round); gl.uniform1f(uni.u_chamfer,P.chamfer);
  gl.uniform1f(uni.u_metal,P.metal); gl.uniform1f(uni.u_rough,P.rough);
  gl.uniform1i(uni.u_reflBounces,P.reflBounces); gl.uniform1i(uni.u_reflSamples,P.reflSamples); gl.uniform1f(uni.u_irid,P.irid);
  gl.uniform3fv(uni.u_palA,P.palA); gl.uniform3fv(uni.u_palB,P.palB); gl.uniform3fv(uni.u_palC,P.palC); gl.uniform3fv(uni.u_palD,P.palD);
  gl.uniform1f(uni.u_palPhase,P.palPhase);
  gl.uniform1i(uni.u_maxSteps,P.maxSteps); gl.uniform1f(uni.u_maxDist,P.maxDist);
  gl.uniform1i(uni.u_aoOn,P.aoOn); gl.uniform1i(uni.u_shadowOn,P.shadowOn);
}
function blit(prog, dst, setup){ gl.useProgram(prog); gl.bindFramebuffer(gl.FRAMEBUFFER, dst?dst.fb:null);
  gl.viewport(0,0, dst?dst.w:canvas.width, dst?dst.h:canvas.height); if(setup) setup(); gl.drawArrays(gl.TRIANGLES,0,3); }

function renderTo(w,h, targetFB){
  ensureFBOs(w,h);
  // scene → sceneFB
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB.fb); gl.viewport(0,0,w,h); setSceneUniforms(w,h); gl.drawArrays(gl.TRIANGLES,0,3);
  // bright-pass → bloomA (half res)
  blit(progBright, bloomA, ()=>{ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,sceneFB.tex);
    gl.uniform1i(gl.getUniformLocation(progBright,'u_tex'),0); gl.uniform1f(gl.getUniformLocation(progBright,'u_thresh'),P.bloomThresh); });
  // separable blur bloomA↔bloomB
  blit(progBlur, bloomB, ()=>{ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,bloomA.tex);
    gl.uniform1i(gl.getUniformLocation(progBlur,'u_tex'),0); gl.uniform2f(gl.getUniformLocation(progBlur,'u_dir'),1,0); });
  blit(progBlur, bloomA, ()=>{ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,bloomB.tex);
    gl.uniform1i(gl.getUniformLocation(progBlur,'u_tex'),0); gl.uniform2f(gl.getUniformLocation(progBlur,'u_dir'),0,1); });
  // composite → target (canvas or output FBO)
  blit(progComp, targetFB, ()=>{ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,sceneFB.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,bloomA.tex);
    gl.uniform1i(gl.getUniformLocation(progComp,'u_scene'),0); gl.uniform1i(gl.getUniformLocation(progComp,'u_bloom'),1);
    gl.uniform1f(gl.getUniformLocation(progComp,'u_bloomAmt'),P.bloom); gl.uniform1f(gl.getUniformLocation(progComp,'u_exposure'),P.exposure);
    gl.uniform1f(gl.getUniformLocation(progComp,'u_vignette'),P.vignette); gl.uniform1f(gl.getUniformLocation(progComp,'u_dither'),P.dither); });
}

function resize(){ const d=Math.min(devicePixelRatio||1,2); canvas.width=(innerWidth*d)|0; canvas.height=(innerHeight*d)|0; }
addEventListener('resize',resize);

function loop(){
  if(!progScene){ requestAnimationFrame(loop); return; }
  const now=performance.now(), dt=(now-t0)/1000; t0=now;
  if(P.play){ clock+=dt; if(P.palDrift) P.palPhase+=dt*P.palDrift; }
  const rw=Math.max(2,Math.round(canvas.width*P.renderScale)), rh=Math.max(2,Math.round(canvas.height*P.renderScale));
  const s=performance.now();
  renderTo(rw,rh,null);
  frame++;
  msAccum+=performance.now()-s; msCount++;
  if(msCount>=15){ lastMs=msAccum/msCount; msAccum=0; msCount=0;
    document.getElementById('readout').innerHTML=`<b>${lastMs.toFixed(1)}</b> ms/frame · <b>${(1000/Math.max(lastMs,0.01)).toFixed(0)}</b> fps · ${rw}×${rh}`; }
  requestAnimationFrame(loop);
}

// ---------------- shader load ----------------
function loadShader(){ fetch('./fractal.frag?'+Date.now()).then(r=>r.text()).then(src=>{
  try{ const p=program(src); if(progScene) gl.deleteProgram(progScene); progScene=p; locateScene(); showErr(''); }
  catch(e){ showErr('Shader error:\n'+e.message); } }).catch(e=>showErr('fetch failed: '+e.message)); }

// ---------------- control panel ----------------
function el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
let panelRefs=[];
function buildPanel(){
  const host=document.getElementById('panel'); host.innerHTML='';
  const css=el('style'); css.textContent=`
    #panel{ font:11px/1.4 ui-sans-serif,Arial,sans-serif; }
    .fg{ background:var(--panel); border:1px solid var(--hair); border-radius:9px; margin-bottom:7px; overflow:hidden;
      -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); }
    .fh{ display:flex; align-items:center; justify-content:space-between; padding:8px 11px; cursor:pointer;
      font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink); }
    .fh span{ color:var(--mute); font-size:12px; transition:transform .15s; }
    .fg.closed .fh span{ transform:rotate(-90deg); } .fg.closed .fb{ display:none; }
    .fb{ padding:4px 11px 10px; }
    .row{ margin:7px 0; } .row .top{ display:flex; justify-content:space-between; }
    .row .k{ color:var(--ink); } .row .v{ color:var(--mute); font-variant-numeric:tabular-nums; }
    .row input[type=range]{ width:100%; accent-color:var(--accent); height:15px; }
    .row select,.btn{ width:100%; background:rgba(255,255,255,.05); color:var(--ink); border:1px solid var(--hair);
      border-radius:6px; padding:6px 8px; font:inherit; }
    .btn{ cursor:pointer; margin-top:4px; } .btn:hover{ border-color:var(--accent); }
    .sw{ display:flex; gap:5px; } .sw .cc{ flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; }
    .sw input[type=color]{ width:100%; height:22px; border:1px solid var(--hair); border-radius:4px; background:none; padding:0; }
    .sw label{ color:var(--mute); font-size:8px; letter-spacing:.1em; }
    textarea{ width:100%; height:60px; background:rgba(0,0,0,.3); color:var(--ink); border:1px solid var(--hair); border-radius:6px; font:10px ui-monospace,monospace; }
  `; host.appendChild(css);
  panelRefs=[];
  const grp=(title,open)=>{ const g=el('div','fg'+(open?'':' closed')); const h=el('div','fh',`${title}<span>▾</span>`);
    const b=el('div','fb'); h.onclick=()=>g.classList.toggle('closed'); g.appendChild(h); g.appendChild(b); host.appendChild(g); return b; };
  const slider=(parent,key,label,min,max,step,fmt)=>{ const row=el('div','row');
    const v=el('span','v', (fmt?fmt(P[key]):P[key])); const top=el('div','top',`<span class="k">${label}</span>`); top.appendChild(v);
    const r=el('input'); r.type='range'; r.min=min; r.max=max; r.step=step; r.value=P[key];
    r.oninput=()=>{ P[key]=parseFloat(r.value); v.textContent=fmt?fmt(P[key]):P[key]; };
    row.appendChild(top); row.appendChild(r); parent.appendChild(row); panelRefs.push({key,r,v,fmt}); };
  const toggle=(parent,key,label)=>{ const row=el('div','row'); const btn=el('button','btn', label+': '+(P[key]?'on':'off'));
    btn.onclick=()=>{ P[key]=P[key]?0:1; btn.textContent=label+': '+(P[key]?'on':'off'); }; row.appendChild(btn); parent.appendChild(row); panelRefs.push({key,btn,label,kind:'toggle'}); };
  const colors=(parent,keys,labels)=>{ const row=el('div','row sw');
    keys.forEach((k,i)=>{ const cc=el('div','cc'); const inp=el('input'); inp.type='color'; inp.value=vecToHex(P[k]);
      inp.oninput=()=>{ P[k]=hexToVec(inp.value); }; cc.appendChild(inp); cc.appendChild(el('label',null,labels[i])); row.appendChild(cc); panelRefs.push({key:k,inp,kind:'color'}); });
    parent.appendChild(row); };

  const gF=grp('Fractal',true);
  const dd=el('div','row'); const sel=el('select'); ['Mandelbulb','Mandelbox','Menger / KIFS','Extruded Julia'].forEach((n,i)=>{ const o=el('option',null,n); o.value=i; sel.appendChild(o); });
  sel.value=P.fractal; sel.onchange=()=>{ P.fractal=parseInt(sel.value); }; dd.appendChild(sel); gF.appendChild(dd); panelRefs.push({key:'fractal',sel,kind:'sel'});
  slider(gF,'power','Bulb power',2,12,0.05); slider(gF,'mbScale','Box scale',-3.5,3.5,0.01); slider(gF,'mbFold','Box fold r',0.2,1.5,0.01);
  slider(gF,'extrude','Julia depth',0.05,1.2,0.01); slider(gF,'edgeBevel','Julia edge bevel',0.0,0.2,0.005);

  const gB=grp('Bevel',false);
  slider(gB,'round','Rounding',0.0,0.05,0.001,v=>v.toFixed(3)); slider(gB,'chamfer','Fillet ↔ Chamfer',0.0,1.0,0.01,v=>v.toFixed(2));

  const gM=grp('Material',false);
  slider(gM,'metal','Metalness',0,1,0.01,v=>v.toFixed(2)); slider(gM,'rough','Roughness',0,1,0.01,v=>v.toFixed(2));
  slider(gM,'reflBounces','Reflection bounces',1,2,1); slider(gM,'reflSamples','Roughness samples',1,6,1);
  slider(gM,'irid','Iridescence',0,1,0.01,v=>v.toFixed(2));

  const gP=grp('Palette',false);
  colors(gP,['palA','palB','palC','palD'],['bias','amp','freq','phase']);
  slider(gP,'palPhase','Phase',0,1,0.01,v=>v.toFixed(2)); slider(gP,'palDrift','Phase drift',0,0.3,0.005,v=>v.toFixed(3));
  const rp=el('button','btn','Randomize palette (R)'); rp.onclick=randomPalette; gP.appendChild(rp);

  const gMo=grp('Motion',false);
  slider(gMo,'camRadius','Cam radius',1.5,7,0.05); slider(gMo,'camHeight','Cam height',-1.2,1.2,0.02); slider(gMo,'camSpeed','Cam speed',0,0.6,0.005);
  slider(gMo,'lfoRate','LFO rate',0,1.5,0.01); slider(gMo,'lfoDepth','LFO depth',0,1,0.01,v=>v.toFixed(2));
  const pp=el('button','btn', P.play?'Pause (space)':'Play (space)'); pp.onclick=()=>{ P.play=!P.play; pp.textContent=P.play?'Pause (space)':'Play (space)'; }; gMo.appendChild(pp); panelRefs.push({key:'play',btn:pp,kind:'play'});

  const gR=grp('Render',false);
  slider(gR,'renderScale','Render scale',0.5,1.0,0.05,v=>v.toFixed(2)); slider(gR,'maxSteps','Max steps',40,400,5);
  slider(gR,'maxDist','Max distance',5,40,1); toggle(gR,'shadowOn','Soft shadows'); toggle(gR,'aoOn','Ambient occlusion');
  slider(gR,'exposure','Exposure',0.2,3,0.01,v=>v.toFixed(2)); slider(gR,'bloom','Bloom',0,2,0.01,v=>v.toFixed(2));
  slider(gR,'bloomThresh','Bloom threshold',0,3,0.02,v=>v.toFixed(2)); slider(gR,'vignette','Vignette',0,1,0.01,v=>v.toFixed(2));
  toggle(gR,'dither','Dither');
  const bpng=el('button','btn','Save PNG · 3× (S)'); bpng.onclick=savePNG; gR.appendChild(bpng);
  const brec=el('button','btn','Record'); brec.id='recBtn'; brec.onclick=toggleRec; gR.appendChild(brec);

  const gPr=grp('Presets',false);
  const ta=el('textarea'); ta.id='presetBox'; ta.placeholder='preset JSON'; gPr.appendChild(ta);
  const bs=el('button','btn','Copy current → box'); bs.onclick=()=>{ ta.value=JSON.stringify(P); ta.select(); }; gPr.appendChild(bs);
  const bl=el('button','btn','Load from box'); bl.onclick=()=>{ try{ Object.assign(P, JSON.parse(ta.value)); syncPanel(); }catch(e){ showErr('bad preset JSON'); setTimeout(()=>showErr(''),2000); } }; gPr.appendChild(bl);
}
function syncPanel(){ panelRefs.forEach(o=>{ if(o.r){ o.r.value=P[o.key]; o.v.textContent=o.fmt?o.fmt(P[o.key]):P[o.key]; }
  else if(o.kind==='toggle'){ o.btn.textContent=o.label+': '+(P[o.key]?'on':'off'); }
  else if(o.kind==='play'){ o.btn.textContent=P.play?'Pause (space)':'Play (space)'; }
  else if(o.kind==='color'){ o.inp.value=vecToHex(P[o.key]); }
  else if(o.kind==='sel'){ o.sel.value=P.fractal; } }); }

function vecToHex(v){ const h=n=>('0'+Math.round(clamp(n,0,1)*255).toString(16)).slice(-2); return '#'+h(v[0])+h(v[1])+h(v[2]); }
function hexToVec(h){ return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]; }
function randomPalette(){ const r=()=>Math.random(); P.palA=[0.5,0.5,0.5]; P.palB=[0.5,0.5,0.5];
  P.palC=[0.7+r()*0.8,0.7+r()*0.8,0.7+r()*0.8]; P.palD=[r(),r(),r()]; syncPanel(); }

// ---------------- export ----------------
function savePNG(){ const w=canvas.width*3, h=canvas.height*3;
  const maxS=gl.getParameter(gl.MAX_TEXTURE_SIZE); const k=Math.min(1, maxS/Math.max(w,h));
  const ow=Math.floor(w*k), oh=Math.floor(h*k);
  const out=makeFBO(ow,oh); const savedScale=P.renderScale; P.renderScale=1.0;
  renderTo(ow,oh,out); P.renderScale=savedScale;
  const px=new Uint8Array(ow*oh*4); gl.bindFramebuffer(gl.FRAMEBUFFER,out.fb); gl.readPixels(0,0,ow,oh,gl.RGBA,gl.UNSIGNED_BYTE,px);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(out.fb); gl.deleteTexture(out.tex);
  fbW=0; // force FBO realloc back to live size next frame
  const c=document.createElement('canvas'); c.width=ow; c.height=oh; const cx=c.getContext('2d'); const img=cx.createImageData(ow,oh);
  for(let y=0;y<oh;y++) img.data.set(px.subarray((oh-1-y)*ow*4,(oh-y)*ow*4), y*ow*4);
  cx.putImageData(img,0,0); c.toBlob(b=>{ const a=document.createElement('a'); a.download='fractal_'+ow+'x'+oh+'_'+Date.now()+'.png'; a.href=URL.createObjectURL(b); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1500); },'image/png');
}
let rec=null, recChunks=[];
function toggleRec(){ const btn=document.getElementById('recBtn');
  if(rec){ rec.stop(); return; }
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime){ showErr('recording not supported here'); setTimeout(()=>showErr(''),2000); return; }
  rec=new MediaRecorder(canvas.captureStream(60),{mimeType:mime,videoBitsPerSecond:24000000}); recChunks=[];
  rec.ondataavailable=e=>{ if(e.data.size) recChunks.push(e.data); };
  rec.onstop=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(recChunks,{type:mime})); a.download='fractal_'+Date.now()+'.webm'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); rec=null; btn.textContent='Record'; btn.style.borderColor=''; };
  rec.start(); btn.textContent='Stop recording'; btn.style.borderColor='#ff5a5f';
}

// ---------------- boot ----------------
resize(); buildPanel(); loadShader(); requestAnimationFrame(loop);
window.addEventListener("keydown",e=>{ if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if(e.key===" "){ e.preventDefault(); P.play=!P.play; syncPanel(); }
  if(e.key==="r"||e.key==="R"){ randomPalette(); }
  if(e.key==="s"||e.key==="S"){ savePNG(); } });
