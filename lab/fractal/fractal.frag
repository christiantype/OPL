#version 300 es
// fractal.frag — raymarched distance-estimated fractals with a shared shading path.
// Edit this file and refresh; main.js re-fetches it. Outputs LINEAR HDR — the post
// chain (main.js) does bloom + tonemap + vignette + dither.
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform int   u_frame;
uniform int   u_fractal;      // 0 bulb · 1 box · 2 menger · 3 julia
uniform vec3  u_camPos;
uniform vec3  u_camTarget;
uniform float u_fov;

// fractal params
uniform float u_power;        // mandelbulb power
uniform float u_mbScale;      // mandelbox scale
uniform float u_mbFold;       // mandelbox fold radius
uniform vec2  u_juliaC;       // julia seed
uniform float u_extrude;      // julia slab half-depth
uniform float u_edgeBevel;    // julia top-edge bevel

// bevel
uniform float u_round;        // fillet radius 0..0.05
uniform float u_chamfer;      // 0 fillet .. 1 chamfer

// material
uniform float u_metal;
uniform float u_rough;
uniform int   u_reflBounces;  // 1 or 2
uniform int   u_reflSamples;  // roughness cone samples
uniform float u_irid;         // thin-film iridescence amount

// palette (cosine)
uniform vec3  u_palA, u_palB, u_palC, u_palD;
uniform float u_palPhase;

// render / perf
uniform int   u_maxSteps;
uniform float u_maxDist;
uniform int   u_aoOn;
uniform int   u_shadowOn;

out vec4 fragColor;

const float PI = 3.14159265;

float hash1(float n){ return fract(sin(n)*43758.5453123); }
vec3 hash3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453123); }

float gTrap;   // orbit-trap value, written by each DE

// ---------------- distance estimators ----------------
float deBulb(vec3 p){
  vec3 z=p; float dr=1.0, r=0.0, trap=1e10;
  for(int i=0;i<8;i++){
    r=length(z); if(r>2.0) break; trap=min(trap,r);
    float th=acos(clamp(z.z/r,-1.0,1.0)), ph=atan(z.y,z.x);
    dr=pow(r,u_power-1.0)*u_power*dr+1.0;
    float zr=pow(r,u_power); th*=u_power; ph*=u_power;
    z=zr*vec3(sin(th)*cos(ph), sin(th)*sin(ph), cos(th))+p;
  }
  gTrap=trap; return 0.5*log(max(r,1e-6))*r/dr;
}
float deBox(vec3 p){
  vec3 z=p; float dr=1.0, trap=1e10; float s=u_mbScale, fr=u_mbFold;
  for(int i=0;i<11;i++){
    z=clamp(z,-1.0,1.0)*2.0-z;                                  // box fold
    float r2=dot(z,z);
    float f=(r2<fr*fr)?(fr*fr)/max(r2,1e-6):(r2<1.0?1.0/r2:1.0); // sphere fold
    z*=f; dr*=f;
    z=z*s+p; dr=dr*abs(s)+1.0;
    trap=min(trap,length(z));
  }
  gTrap=trap; return length(z)/abs(dr);
}
float sdBox(vec3 p, vec3 b){ vec3 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,max(d.y,d.z)),0.0); }
float deMenger(vec3 p){
  float d=sdBox(p,vec3(1.0)); float sc=1.0, trap=1e10;
  for(int i=0;i<5;i++){
    vec3 a=mod(p*sc,2.0)-1.0; sc*=3.0;
    vec3 r=abs(1.0-3.0*abs(a));
    float da=max(r.x,r.y), db=max(r.y,r.z), dc=max(r.z,r.x);
    float c=(min(da,min(db,dc))-1.0)/sc;
    d=max(d,c); trap=min(trap,length(a));
  }
  gTrap=trap; return d;
}
float juliaField(vec2 c){
  vec2 z=c; float it=0.0;
  for(int i=0;i<64;i++){ z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+u_juliaC;
    float m=dot(z,z); if(m>16.0){ it=float(i)-log2(log2(m))+4.0; break; } it=float(i); }
  return clamp(it/64.0,0.0,1.0);
}
// 2D escape-time field extruded into a slab: a face, a side wall, and a beveled edge.
float deJulia(vec3 p){
  float f=juliaField(p.xy*1.15); gTrap=f;
  float d2=(0.36-f)*2.4;                 // approx signed dist to the set boundary (+inside)
  float dz=abs(p.z)-u_extrude;           // slab in z
  vec2 w=vec2(max(-d2,0.0), max(dz,0.0));
  float solid=min(max(-d2,dz),0.0)+length(w);
  // top-edge bevel: pull the face/side corner in so the edge becomes its own facet
  float edge=min(max(-d2,0.0),max(dz,0.0));
  return solid - u_edgeBevel*0.5*smoothstep(0.0,0.15,edge);
}

float mapRaw(vec3 p){
  if(u_fractal==0) return deBulb(p);
  if(u_fractal==1) return deBox(p);
  if(u_fractal==2) return deMenger(p);
  return deJulia(p);
}
// bevel: rounding subtracts a radius (fillet). Chamfer blends toward a flatter cut by
// mixing the rounded DE with an octahedral-offset variant that flattens convex edges.
float map(vec3 p){
  float d=mapRaw(p);
  float r=u_round;
  float fillet=d-r;
  float cham=d-r*0.5-r*0.5*max(0.0,dot(sign(p),normalize(vec3(1.0)))*0.5+0.5); // flatter near corners
  return mix(fillet, cham, u_chamfer);
}
vec3 calcNormal(vec3 p){ const vec2 e=vec2(1.0,-1.0)*0.0006;
  return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx)); }

float march(vec3 ro, vec3 rd, out float trap){
  float t=0.0; trap=0.0;
  for(int i=0;i<1024;i++){ if(i>=u_maxSteps) break;
    vec3 p=ro+rd*t; float d=map(p);
    if(d<0.0004*t+1e-5){ trap=gTrap; return t; }
    t+=d; if(t>u_maxDist) break;
  }
  return -1.0;
}
float softShadow(vec3 ro, vec3 rd){
  float res=1.0, t=0.015; float td;
  for(int i=0;i<64;i++){ float h=map(ro+rd*t); if(h<0.0008) return 0.0;
    res=min(res, 14.0*h/t); t+=clamp(h,0.008,0.2); if(t>7.0) break; }
  return clamp(res,0.0,1.0);
}
float ao(vec3 p, vec3 n){
  float occ=0.0, sca=1.0;
  for(int i=0;i<5;i++){ float hr=0.01+0.13*float(i)/4.0; float d=map(p+n*hr); occ+=(hr-d)*sca; sca*=0.72; }
  return clamp(1.0-1.6*occ,0.0,1.0);
}

// ---------------- procedural studio environment ----------------
vec3 env(vec3 rd){
  float h=clamp(rd.y*0.5+0.5,0.0,1.0);
  vec3 sky=mix(vec3(0.018,0.022,0.032), vec3(0.11,0.13,0.17), pow(h,0.8));   // vertical gradient
  vec3 keyDir=normalize(vec3(0.32,0.72,-0.6));
  float key=smoothstep(0.80,0.999,dot(rd,keyDir));                           // bright key card, above+behind
  sky+=vec3(1.0,0.97,0.92)*key*3.4;
  vec3 fillDir=normalize(vec3(-0.55,0.15,0.55));
  sky+=vec3(0.30,0.36,0.46)*smoothstep(0.68,1.0,dot(rd,fillDir))*0.7;        // dim fill opposite
  sky+=vec3(0.10,0.11,0.13)*smoothstep(0.03,0.0,abs(rd.y));                  // horizon line
  return sky;
}

vec3 palette(float t){ return u_palA + u_palB*cos(6.2831853*(u_palC*t + u_palD + u_palPhase)); }
vec3 fresnel(float ct, vec3 f0){ return f0+(1.0-f0)*pow(clamp(1.0-ct,0.0,1.0),5.0); }
vec3 iridescence(float ct){ float x=pow(1.0-ct,1.6);
  return 0.5+0.5*cos(6.2831853*(vec3(1.0,0.85,0.72)*x*3.2 + vec3(0.0,0.33,0.66))); }

// Shade a surface point; returns diffuse/lit colour and the Fresnel reflectance F.
vec3 shade(vec3 p, vec3 n, vec3 rd, float trap, out vec3 F){
  vec3 base=palette(trap);
  vec3 keyDir=normalize(vec3(0.32,0.72,-0.6));
  float dif=max(0.0,dot(n,keyDir));
  float sh=(u_shadowOn==1)? softShadow(p+n*0.002,keyDir):1.0;
  float occ=(u_aoOn==1)? ao(p,n):1.0;
  vec3 fillDir=normalize(vec3(-0.55,0.15,0.55));
  float fill=max(0.0,dot(n,fillDir))*0.45;
  vec3 amb=env(n)*0.5*occ;
  vec3 col=base*(amb + vec3(1.0,0.97,0.92)*dif*sh + vec3(0.42,0.47,0.58)*fill);
  float ct=clamp(dot(n,-rd),0.0,1.0);
  F=fresnel(ct, mix(vec3(0.04), base, u_metal));
  col+=u_irid*iridescence(ct)*pow(1.0-ct,3.0);
  return col;
}
vec3 shadeHit(vec3 ro, vec3 rd, float t, out vec3 F){
  vec3 p=ro+rd*t, n=calcNormal(p); float trap; march(p,rd,trap); // trap already in gTrap-ish; recompute cheaply
  map(p); trap=gTrap; return shade(p,n,rd,trap,F);
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-u_res)/u_res.y;
  vec3 ro=u_camPos;
  vec3 fw=normalize(u_camTarget-ro), rt=normalize(cross(fw,vec3(0,1,0))), up=cross(rt,fw);
  vec3 rd=normalize(uv.x*rt + uv.y*up + (1.0/tan(0.5*u_fov))*fw);

  vec3 col; float trap; float t=march(ro,rd,trap);
  if(t<0.0){ col=env(rd); }
  else {
    vec3 p=ro+rd*t, n=calcNormal(p); vec3 F; vec3 base=shade(p,n,rd,trap,F);
    vec3 rcol=vec3(0.0); int NS=max(1,u_reflSamples);
    for(int s=0;s<8;s++){ if(s>=NS) break;
      vec3 j=(hash3(vec3(gl_FragCoord.xy,float(u_frame*NS+s)))-0.5)*u_rough*u_rough*0.9;
      vec3 r=normalize(reflect(rd,n)+j);
      float tr2; float t2=march(p+n*0.003,r,tr2);
      vec3 c2;
      if(t2<0.0){ c2=env(r); }
      else {
        vec3 p2=p+r*t2, n2=calcNormal(p2); vec3 F2; vec3 b2=shade(p2,n2,r,tr2,F2);
        if(u_reflBounces>=2){
          vec3 r2=normalize(reflect(r,n2)); float tr3; float t3=march(p2+n2*0.003,r2,tr3);
          vec3 c3; if(t3<0.0){ c3=env(r2); } else { vec3 F3; c3=shade(p2+r2*t3,calcNormal(p2+r2*t3),r2,tr3,F3); }
          b2=mix(b2,c3,F2);
        }
        c2=b2;
      }
      rcol+=c2;
    }
    rcol/=float(NS);
    col=mix(base,rcol,F);
  }
  fragColor=vec4(col,1.0);   // linear HDR
}
