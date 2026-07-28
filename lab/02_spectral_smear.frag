// 02_spectral_smear.frag
// Reference: portrait liquefied into black/white ribbons with thin-film rainbow edges.
// Method: fbm flow field warps the image, then the smear is integrated across a
// spectrum so each wavelength lands at a slightly different offset.
// Uniforms: u_res, u_texRes, u_time, u_tex
//
// Magic numbers hoisted to uniforms by the harness (math unchanged) — each marked
// "// was <value>". The only structural change is the spectral loop: GLSL ES 1.0
// requires a constant loop bound, so SAMPLES became a const cap + a break at
// u_samples. See the harness README.

precision highp float;

uniform vec2      u_res;
uniform vec2      u_texRes;
uniform float     u_time;
uniform sampler2D u_tex;

uniform float u_smear;      // was 0.030  (spectral offset amount)
uniform float u_samples;    // was 28     (spectral step count)
uniform float u_flowScale;  // was 2.6    (flow-field frequency)
uniform float u_flowSpeed;  // was 0.06   (flow-field time speed)
uniform float u_contrast;   // was 1.45
uniform float u_satFloor;   // was 0.25   (minimum saturation of the mix)
uniform float u_grain;      // was 0.022

const int MAX_SAMPLES = 64; // loop bound must be a constant in GLSL ES 1.0

float hash21(vec2 p){
  vec3 p3 = fract(p.xyx*0.1031);
  p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i), b = hash21(i+vec2(1,0));
  float c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*vnoise(p); p *= 2.02; a *= 0.5; }
  return v;
}

vec2 fitUV(vec2 uv){
  float ca = u_res.x/u_res.y;
  float ta = u_texRes.x/u_texRes.y;
  vec2 s = (ca > ta) ? vec2(1.0, ta/ca) : vec2(ca/ta, 1.0);
  return (uv-0.5)*s + 0.5;
}

// smooth spectrum sweep, roughly violet -> red
vec3 spectrum(float t){
  return 0.55 + 0.45*cos(6.28318*(t*0.85 + vec3(0.00, 0.33, 0.67)));
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_res;
  vec2 su = fitUV(uv);
  float T = u_time*u_flowSpeed;                                  // was u_time*0.06

  // --- flow field
  float n1 = fbm(uv*u_flowScale + vec2(0.0, T));                 // was uv*2.6
  float n2 = fbm(uv*u_flowScale + vec2(5.2, -T) + 11.7);         // was uv*2.6
  vec2  dir = normalize(vec2(n1,n2) - 0.5 + 1e-5);

  // liquefy the sampling coordinate before smearing
  su += dir * (fbm(uv*3.4 + T) - 0.5) * 0.055;

  // --- local contrast drives how far the spectrum splits
  float e = 1.6/u_res.y;
  float lx = dot(texture2D(u_tex, su+vec2(e,0.0)).rgb - texture2D(u_tex, su-vec2(e,0.0)).rgb, vec3(0.333));
  float ly = dot(texture2D(u_tex, su+vec2(0.0,e)).rgb - texture2D(u_tex, su-vec2(0.0,e)).rgb, vec3(0.333));
  float edge = clamp(length(vec2(lx,ly))*14.0, 0.0, 1.0);

  // fine parallel strands: the banding that reads as thin film
  float strand = 0.5 + 0.5*sin(fbm(uv*4.0 + T*1.5)*44.0 + n1*24.0);

  float amp = u_smear * (0.25 + 1.5*edge) * (0.35 + 0.95*strand);  // was 0.030
  amp *= 0.5 + fbm(uv*1.6 + 3.0);

  // --- spectral integration
  vec3 acc = vec3(0.0), wsum = vec3(0.0);
  for(int i=0;i<MAX_SAMPLES;i++){
    if(i >= int(u_samples)) break;                              // was fixed 28
    float t = float(i)/max(u_samples-1.0, 1.0);                 // was float(SAMPLES-1)
    vec2  o = dir*amp*(t-0.5);
    vec3  s = texture2D(u_tex, su + o).rgb;
    vec3  w = spectrum(t);
    acc  += s*w;
    wsum += w;
  }
  vec3 col = acc/wsum;

  // --- grade: push toward the reference's hard black / blown white
  col = pow(clamp(col, 0.0, 1.0), vec3(1.05));
  col = (col - 0.5)*u_contrast + 0.48;                          // was 1.45

  // let the rainbow sit only where the split happened
  float sat = clamp(edge*1.6, 0.0, 1.0);
  vec3  grey = vec3(dot(col, vec3(0.299,0.587,0.114)));
  col = mix(grey, col, u_satFloor + 0.95*sat);                 // was 0.25

  // vignette + grain
  col *= 1.0 - 0.45*pow(length(uv-0.5)*1.35, 2.4);
  col += (hash21(gl_FragCoord.xy + u_time) - 0.5)*u_grain;      // was 0.022

  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}
