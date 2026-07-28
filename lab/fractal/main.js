// main.js — WebGL2 engine for the raymarched fractal generator.
// Pipeline: fractal.frag renders the scene to an HDR framebuffer (render-scaled), then a
// post chain (bright-pass → separable blur → composite with ACES tonemap + vignette + dither)
// draws to the canvas. The scene shader is fetched so you can edit fractal.frag and refresh.
'use strict';

const canvas = document.getElementById('stage');
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
  quatCX:-0.2, quatCY:0.6, quatCZ:0.2, quatCW:0.2,
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
  'u_power','u_mbScale','u_mbFold','u_juliaC','u_extrude','u_edgeBevel','u_quatC','u_round','u_chamfer','u_metal','u_rough',
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
  let qc=[P.quatCX,P.quatCY,P.quatCZ,P.quatCW];
  if(P.fractal===4){ const a=lfo*0.5, c=Math.cos(a), s=Math.sin(a); qc=[qc[0]*c-qc[1]*s, qc[0]*s+qc[1]*c, qc[2], qc[3]]; }
  gl.uniform4f(uni.u_quatC,qc[0],qc[1],qc[2],qc[3]);
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
    document.getElementById('hint').innerHTML=`<b>${lastMs.toFixed(1)}</b> ms/frame · <b>${(1000/Math.max(lastMs,0.01)).toFixed(0)}</b> fps · ${rw}×${rh}`; }
  requestAnimationFrame(loop);
}

// ---------------- shader load ----------------
function loadShader(){ fetch('./fractal.frag?'+Date.now()).then(r=>r.text()).then(src=>{
  try{ const p=program(src); if(progScene) gl.deleteProgram(progScene); progScene=p; locateScene(); showErr(''); }
  catch(e){ showErr('Shader error:\n'+e.message); } }).catch(e=>showErr('fetch failed: '+e.message)); }

// ---------------- control panel ----------------
function el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
let panelRefs=[];
const LOOKS={
  Chrome:{ metal:1.0, rough:0.05, irid:0.10, reflBounces:2, reflSamples:2, palA:[0.5,0.52,0.56],palB:[0.42,0.44,0.5],palC:[1,1,1],palD:[0.08,0.14,0.26], bloom:0.5, exposure:1.1 },
  Holo:{ metal:0.85, rough:0.12, irid:0.9, reflBounces:2, reflSamples:2, palA:[0.5,0.5,0.5],palB:[0.5,0.5,0.5],palC:[1,1,1],palD:[0.0,0.33,0.67], bloom:0.9, exposure:1.0 },
  Leaf:{ metal:0.55, rough:0.3, irid:0.2, reflBounces:1, reflSamples:1, palA:[0.16,0.34,0.24],palB:[0.22,0.46,0.32],palC:[1.0,1.15,1.0],palD:[0.35,0.5,0.42], bloom:0.4, exposure:1.1 },
  Ink:{ metal:0.9, rough:0.16, irid:0.15, reflBounces:1, reflSamples:1, palA:[0.34,0.37,0.44],palB:[0.34,0.37,0.44],palC:[1,1,1],palD:[0.62,0.64,0.72], bloom:0.35, exposure:0.92 },
};
function applyLook(n){ Object.assign(P, LOOKS[n]); syncPanel(); }

function buildPanel(){
  const host=document.getElementById('rail'); host.innerHTML=''; panelRefs=[];
  const grp=(title,hint)=>{ const g=el('div','row'); const h=el('button','rowhead',title); h.type='button'; h.setAttribute('aria-expanded','true'); g.appendChild(h); if(hint) g.appendChild(el('p','rowhint',hint)); host.appendChild(g); return g; };
  const slider=(g,key,label,min,max,step,fmt,tip)=>{ const grpEl=el('div','grp'); if(tip) grpEl.setAttribute('data-tip',tip);
    const v=el('b',null,(fmt?fmt(P[key]):P[key])); const lab=el('label',null,label+' '); lab.appendChild(v);
    const r=el('input'); r.type='range'; r.min=min; r.max=max; r.step=step; r.value=P[key];
    r.oninput=()=>{ P[key]=(String(step).indexOf('.')>=0)?parseFloat(r.value):parseInt(r.value); v.textContent=fmt?fmt(P[key]):P[key]; };
    grpEl.appendChild(lab); grpEl.appendChild(r); g.appendChild(grpEl); panelRefs.push({key,r,v,fmt}); return grpEl; };
  const duo=(g)=>{ const d=el('div','duo'); g.appendChild(d); return d; };
  const seg=(g,key,label,opts,tip)=>{ const grpEl=el('div','grp'); if(tip)grpEl.setAttribute('data-tip',tip);
    grpEl.appendChild(el('label',null,label)); const s=el('div','seg'); opts.forEach(o=>{ const btn=el('button',null,o.t); btn.setAttribute('aria-pressed',String(P[key]==o.v));
      btn.onclick=()=>{ P[key]=o.v; [...s.children].forEach(c=>c.setAttribute('aria-pressed',String(c===btn))); }; s.appendChild(btn); }); grpEl.appendChild(s); g.appendChild(grpEl); panelRefs.push({key,seg:s,opts,kind:'seg'}); };
  const colorRow=(g,keys,labels)=>{ const row=el('div','swatches'); keys.forEach((k,i)=>{ const cin=el('div','cin'); const inp=el('input'); inp.type='color'; inp.value=vecToHex(P[k]);
    inp.oninput=()=>{ P[k]=hexToVec(inp.value); }; cin.appendChild(inp); cin.appendChild(el('label',null,labels[i])); row.appendChild(cin); panelRefs.push({key:k,inp,kind:'color'}); }); g.appendChild(row); };
  const button=(g,label,fn,id)=>{ const b=el('button','btn',label); b.style.width='100%'; if(id)b.id=id; b.onclick=fn; g.appendChild(b); return b; };

  const gL=grp('Looks','Curated starting points. Tweak from there.');
  const looks=el('div',null,''); looks.id='looks'; ['Chrome','Holo','Leaf','Ink'].forEach(n=>{ const b=el('button','btn',n); b.onclick=()=>applyLook(n); looks.appendChild(b); }); gL.appendChild(looks);

  const gF=grp('Fractal');
  const dd=el('div','grp'); const sel=el('select','sel'); ['Mandelbulb','Mandelbox','Menger / KIFS','Extruded Julia','Quaternion Julia','Sierpinski','Apollonian'].forEach((n,i)=>{ const o=el('option',null,n); o.value=i; sel.appendChild(o); });
  sel.value=P.fractal; sel.onchange=()=>{ P.fractal=parseInt(sel.value); updateFractalControls(); }; dd.appendChild(sel); gF.appendChild(dd); panelRefs.push({key:'fractal',sel,kind:'sel'});
  // Per-fractal parameters — each wrapper is shown only for the fractal(s) it applies to.
  const frac=(...ids)=>{ const w=el('div'); w.dataset.frac=ids.join(','); gF.appendChild(w); return w; };
  const wBulb=frac(0); slider(wBulb,'power','Bulb power',2,12,0.05,v=>(+v).toFixed(1));
  const wBox=frac(1); const bx=duo(wBox); slider(bx,'mbScale','Box scale',-3.5,3.5,0.01,v=>(+v).toFixed(2)); slider(bx,'mbFold','Box fold',0.2,1.5,0.01,v=>(+v).toFixed(2));
  const wJul=frac(3); const ju=duo(wJul); slider(ju,'extrude','Julia depth',0.05,1.2,0.01,v=>(+v).toFixed(2)); slider(ju,'edgeBevel','Edge bevel',0.0,0.2,0.005,v=>(+v).toFixed(3));
  const wQ=frac(4); const q1=duo(wQ); slider(q1,'quatCX','Seed x',-1,1,0.005,v=>(+v).toFixed(3)); slider(q1,'quatCY','Seed y',-1,1,0.005,v=>(+v).toFixed(3));
  const q2=duo(wQ); slider(q2,'quatCZ','Seed z',-1,1,0.005,v=>(+v).toFixed(3)); slider(q2,'quatCW','Seed w',-1,1,0.005,v=>(+v).toFixed(3));
  const wSeedless=frac(2,5,6); wSeedless.appendChild(el('p','rowhint','No seed — the shape comes from the fold itself.'));

  const gB=grp('Bevel','Rounding subtracts a radius; chamfer flattens the cut.');
  const b1=duo(gB); slider(b1,'round','Rounding',0.0,0.05,0.001,v=>(+v).toFixed(3)); slider(b1,'chamfer','Chamfer',0.0,1.0,0.01,v=>(+v).toFixed(2));

  const gM=grp('Material','How it catches light.');
  const m1=duo(gM); slider(m1,'metal','Metalness',0,1,0.01,v=>(+v).toFixed(2)); slider(m1,'rough','Roughness',0,1,0.01,v=>(+v).toFixed(2));
  const m2=duo(gM); slider(m2,'reflBounces','Bounces',1,2,1); slider(m2,'reflSamples','Refl samples',1,6,1);
  slider(gM,'irid','Iridescence',0,1,0.01,v=>(+v).toFixed(2));

  const gP=grp('Palette','Colour comes from the orbit trap, through a cosine palette.');
  colorRow(gP,['palA','palB','palC','palD'],['bias','amp','freq','phase']);
  const p1=duo(gP); slider(p1,'palPhase','Phase',0,1,0.01,v=>(+v).toFixed(2)); slider(p1,'palDrift','Drift',0,0.3,0.005,v=>(+v).toFixed(3));
  button(gP,'Randomize palette (R)',randomPalette);

  const gMo=grp('Motion','Orbiting camera and an LFO on the active parameter.');
  const mo1=duo(gMo); slider(mo1,'camRadius','Cam radius',1.5,7,0.05,v=>(+v).toFixed(2)); slider(mo1,'camHeight','Cam height',-1.2,1.2,0.02,v=>(+v).toFixed(2));
  slider(gMo,'camSpeed','Cam speed',0,0.6,0.005,v=>(+v).toFixed(3));
  const mo2=duo(gMo); slider(mo2,'lfoRate','LFO rate',0,1.5,0.01,v=>(+v).toFixed(2)); slider(mo2,'lfoDepth','LFO depth',0,1,0.01,v=>(+v).toFixed(2));

  const gR=grp('Render','Quality vs speed. Watch the ms/frame readout.');
  const r1=duo(gR); slider(r1,'renderScale','Render scale',0.5,1.0,0.05,v=>(+v).toFixed(2)); slider(r1,'maxSteps','Max steps',40,400,5);
  slider(gR,'maxDist','Max distance',5,40,1);
  seg(gR,'shadowOn','Soft shadows',[{t:'On',v:1},{t:'Off',v:0}]); seg(gR,'aoOn','Ambient occlusion',[{t:'On',v:1},{t:'Off',v:0}]);
  const r2=duo(gR); slider(r2,'exposure','Exposure',0.2,3,0.01,v=>(+v).toFixed(2)); slider(r2,'bloom','Bloom',0,2,0.01,v=>(+v).toFixed(2));
  const r3=duo(gR); slider(r3,'bloomThresh','Bloom thr',0,3,0.02,v=>(+v).toFixed(2)); slider(r3,'vignette','Vignette',0,1,0.01,v=>(+v).toFixed(2));
  seg(gR,'dither','Dither',[{t:'On',v:1},{t:'Off',v:0}]);

  const gE=grp('Export','A still, or record the motion.');
  const eb=el('div',null,''); eb.style.cssText='display:flex;gap:6px'; const bpng=el('button','btn','PNG · 3×'); bpng.style.flex='1'; bpng.onclick=savePNG; const brec=el('button','btn','Record'); brec.style.flex='1'; brec.id='recBtn'; brec.onclick=toggleRec; eb.appendChild(bpng); eb.appendChild(brec); gE.appendChild(eb);

  const gPr=grp('Presets','Copy the state as JSON, or paste one back in.');
  const ta=el('textarea'); ta.id='presetBox'; ta.placeholder='preset JSON'; ta.style.cssText='width:100%;height:56px;background:rgba(0,0,0,.3);color:var(--ink);border:1px solid var(--hair);border-radius:6px;font:10px ui-monospace,monospace;margin-bottom:6px'; gPr.appendChild(ta);
  const pb=el('div',null,''); pb.style.cssText='display:flex;gap:6px'; const bc=el('button','btn','Copy'); bc.style.flex='1'; bc.onclick=()=>{ ta.value=JSON.stringify(P); ta.select(); }; const bld=el('button','btn','Load'); bld.style.flex='1'; bld.onclick=()=>{ try{ Object.assign(P,JSON.parse(ta.value)); syncPanel(); }catch(e){ showErr('bad preset JSON'); setTimeout(()=>showErr(''),2000);} }; pb.appendChild(bc); pb.appendChild(bld); gPr.appendChild(pb);

  document.querySelectorAll('.rail input[type=range]').forEach(makeKnob);
  setupFolds(); setupTooltips(); updateFractalControls();
}
// Show only the parameter blocks that belong to the selected fractal — no dead controls.
function updateFractalControls(){ document.querySelectorAll('#rail [data-frac]').forEach(w=>{
  w.style.display = w.dataset.frac.split(',').includes(String(P.fractal)) ? '' : 'none'; }); }
function syncPanel(){ panelRefs.forEach(o=>{ if(o.r){ o.r.value=P[o.key]; o.v.textContent=o.fmt?o.fmt(P[o.key]):P[o.key]; if(o.r.repaintKnob)o.r.repaintKnob(); }
  else if(o.kind==='color'){ o.inp.value=vecToHex(P[o.key]); }
  else if(o.kind==='seg'){ [...o.seg.children].forEach((c,i)=>c.setAttribute('aria-pressed',String(o.opts[i].v==P[o.key]))); }
  else if(o.kind==='sel'){ o.sel.value=P.fractal; } });
  updateFractalControls(); setPlayIcon(); }

// ---- shared-shell scaffolding ----
function makeKnob(inp){ if(inp.dataset.knob) return; inp.dataset.knob='1'; const w=document.createElement('div'); w.className='knob'; w.tabIndex=0; w.setAttribute('role','slider');
  inp.parentNode.insertBefore(w,inp); w.appendChild(inp);
  w.insertAdjacentHTML('beforeend','<svg viewBox="0 0 44 44" width="42" height="42" aria-hidden="true"><path class="k-tr" d="M9 35 A18 18 0 1 1 35 35"/><path class="k-vl" d="M9 35 A18 18 0 1 1 35 35"/><circle class="k-hub" cx="22" cy="22" r="9"/><line class="k-pt" x1="22" y1="22" x2="22" y2="14"/></svg>');
  const k={el:w,inp}; inp.repaintKnob=()=>paintKnob(k); const set=v=>{ inp.value=String(v); inp.dispatchEvent(new Event('input',{bubbles:true})); paintKnob(k); };
  let dy=0,dv=0; w.addEventListener('pointerdown',e=>{ e.preventDefault(); w.setPointerCapture(e.pointerId); w.classList.add('drag'); dy=e.clientY; dv=+inp.value; });
  w.addEventListener('pointermove',e=>{ if(!w.classList.contains('drag')) return; const span=(+inp.max)-(+inp.min), st=+inp.step||1; set(clamp(Math.round((dv+(dy-e.clientY)/150*span)/st)*st,+inp.min,+inp.max)); });
  const up=()=>w.classList.remove('drag'); w.addEventListener('pointerup',up); w.addEventListener('pointercancel',up);
  w.addEventListener('keydown',e=>{ const st=+inp.step||1; if(e.key==='ArrowUp'||e.key==='ArrowRight'){ e.preventDefault(); set(clamp(+inp.value+st,+inp.min,+inp.max)); } if(e.key==='ArrowDown'||e.key==='ArrowLeft'){ e.preventDefault(); set(clamp(+inp.value-st,+inp.min,+inp.max)); } }); paintKnob(k); }
function paintKnob(k){ const inp=k.inp,mn=+inp.min,mx=+inp.max,v=+inp.value,f=(v-mn)/(mx-mn||1); const path=k.el.querySelector('.k-vl'),len=path.getTotalLength();
  path.style.strokeDasharray=len; path.style.strokeDashoffset=len*(1-f); const a=(-135+270*f)*Math.PI/180,pt=k.el.querySelector('.k-pt'); pt.setAttribute('x2',(22+Math.sin(a)*8).toFixed(2)); pt.setAttribute('y2',(22-Math.cos(a)*8).toFixed(2)); }
function setupFolds(){ const KEY='fractal-folded'; const saved=new Set((()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}})());
  document.querySelectorAll('.rail .rowhead').forEach(h=>{ const row=h.closest('.row'); const name=h.textContent.trim();
    if(saved.has(name)){ row.classList.add('folded'); h.setAttribute('aria-expanded','false'); }
    h.addEventListener('click',()=>{ const f=row.classList.toggle('folded'); h.setAttribute('aria-expanded',String(!f));
      const cur=new Set((()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}})()); f?cur.add(name):cur.delete(name); try{localStorage.setItem(KEY,JSON.stringify([...cur]))}catch(e){} }); }); }
let tipEl=null,tipT=null,tipFor=null;
function setupTooltips(){ addEventListener('pointerover',e=>{ const h=e.target.closest&&e.target.closest('[data-tip]'); if(h===tipFor) return; clearTimeout(tipT); if(!h){ hideTip(); return; } tipFor=h; tipT=setTimeout(()=>showTip(h),240); });
  addEventListener('pointerdown',hideTip); addEventListener('scroll',hideTip,true); }
function hideTip(){ clearTimeout(tipT); tipFor=null; if(tipEl){ tipEl.style.opacity='0'; tipEl.style.display='none'; } }
function showTip(host){ const text=host.getAttribute('data-tip'); if(!text) return; if(!tipEl){ tipEl=document.createElement('div'); tipEl.className='tip'; document.body.appendChild(tipEl); }
  tipEl.textContent=text; tipEl.style.display='block'; tipEl.style.opacity='0'; const r=host.getBoundingClientRect(),t=tipEl.getBoundingClientRect();
  let top=r.top-t.height-8; if(top<8) top=Math.min(innerHeight-t.height-8,r.bottom+8); tipEl.style.left=Math.max(8,Math.min(r.left,innerWidth-t.width-8))+'px'; tipEl.style.top=top+'px'; tipEl.style.opacity='1'; }
function setPlayIcon(){ const b=document.getElementById('playBtn'); if(!b) return; b.setAttribute('aria-pressed',String(P.play));
  b.innerHTML=P.play?'<svg viewBox="0 0 12 12" width="11" height="11"><rect x="2.6" y="1.8" width="2.5" height="8.4" rx="1.1" fill="currentColor"/><rect x="6.9" y="1.8" width="2.5" height="8.4" rx="1.1" fill="currentColor"/></svg>':'<svg viewBox="0 0 12 12" width="11" height="11"><path d="M3 1.8 L10 6 L3 10.2 Z" fill="currentColor"/></svg>'; }
function setFs(on){ document.body.classList.toggle('fs',on); if(on&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{}); else if(!on&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{}); }
function wireBar(){ document.getElementById('playBtn').onclick=()=>{ P.play=!P.play; setPlayIcon(); };
  document.getElementById('themeBtn').onclick=()=>{ document.body.classList.toggle('dark'); };
  document.getElementById('fsBtn').onclick=()=>setFs(!document.body.classList.contains('fs'));
  document.getElementById('exitFs').onclick=()=>setFs(false);
  document.getElementById('toggle').onclick=()=>{ const r=document.getElementById('rail'); const open=!r.classList.contains('open'); r.classList.toggle('open',open); document.body.classList.toggle('panels',open); document.getElementById('toggle').setAttribute('aria-pressed',String(open)); };
  document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&document.body.classList.contains('fs')) setFs(false); });
  setPlayIcon(); }
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
document.body.classList.add('dark'); resize(); buildPanel(); wireBar(); loadShader(); requestAnimationFrame(loop);
window.addEventListener("keydown",e=>{ if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if(e.key===" "){ e.preventDefault(); P.play=!P.play; syncPanel(); }
  if(e.key==="r"||e.key==="R"){ randomPalette(); }
  if(e.key==="s"||e.key==="S"){ savePNG(); } });
