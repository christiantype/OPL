/* OP/AL — shared "heat pad" store (Cloudflare Worker + KV).
   GET  /?day=KEY                → { day, w, h, v }        (v = base64, '' if none)
   POST /  { day, v, c, who? }   → merges a contribution, returns the new grid
   KEY is the Monday of the week. Grid is W*H cells, 4 bytes each: [I,R,G,B]
   (I = accumulated presence 0..255; R,G,B = presence-weighted blended colour).
   Each visitor session sends its own colour `c=[r,g,b]`; where sessions overlap,
   colours blend weighted by how much presence each left. Auto-expires after 9 days.

   Per-IP fairness: each IP may add up to IP_CAP presence-units per week, so one
   person can't dominate volume (colour is per-session, chosen by the client).
   Only a salted weekly hash of the IP is stored, never the raw IP. */
const W = 148, H = 84, N = W * H, STRIDE = 4, BYTES = N * STRIDE;
const IP_CAP = 15000;   // max presence-units a single IP may contribute per week (tunable)
const TTL = 60 * 60 * 24 * 9;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};
const todayKey = () => new Date().toISOString().slice(0, 10);
const clampByte = (x) => (x < 0 ? 0 : x > 255 ? 255 : x | 0);

async function idHash(id, day) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('opal-heat:' + day + ':' + id));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);

    // ── Old-school visit counter ── GET /count[?inc=1] → { count }
    if (url.pathname === '/count') {
      const inc = url.searchParams.get('inc') === '1';
      let n = parseInt((await env.HEAT.get('visits')) || '0', 10) || 0;
      if (inc) { n += 1; await env.HEAT.put('visits', String(n)); }
      return json({ count: n });
    }

    if (req.method === 'GET') {
      const day = (url.searchParams.get('day') || todayKey()).slice(0, 10);
      const v = await env.HEAT.get('heat:' + day);
      return json({ day, w: W, h: H, v: v || '' });
    }

    if (req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const day = ((body && body.day) || url.searchParams.get('day') || todayKey()).slice(0, 10);
      let contrib;
      try { contrib = atob((body && body.v) || ''); } catch { return json({ error: 'bad v' }, 400); }
      if (contrib.length !== N) return json({ error: 'size' }, 400);
      const c = Array.isArray(body && body.c) && body.c.length === 3 ? body.c.map(clampByte) : [230, 150, 90];

      const key = 'heat:' + day;
      let cur = await env.HEAT.get(key);
      let base = cur ? atob(cur) : null;
      if (base && base.length !== BYTES) base = null;   // ignore any legacy/foreign format

      // ── per-IP (or dev ?as → who) weekly budget ──────────────────────
      const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'anon';
      const id = body && body.who ? 'who:' + body.who : ip;
      const ipKey = 'ipc:' + day + ':' + (await idHash(id, day));
      const used = parseInt((await env.HEAT.get(ipKey)) || '0', 10) || 0;
      if (used >= IP_CAP) {
        return json({ day, w: W, h: H, v: cur && base ? cur : '', used, cap: IP_CAP, accepted: false });
      }

      let incoming = 0;
      const out = new Uint8Array(BYTES);
      for (let i = 0; i < N; i++) {
        const o = i * STRIDE;
        const wi = contrib.charCodeAt(i);
        const oi = base ? base.charCodeAt(o) : 0;
        if (wi === 0) {                       // untouched cell — carry existing colour forward
          out[o] = oi;
          out[o + 1] = base ? base.charCodeAt(o + 1) : 0;
          out[o + 2] = base ? base.charCodeAt(o + 2) : 0;
          out[o + 3] = base ? base.charCodeAt(o + 3) : 0;
          continue;
        }
        incoming += wi;
        const denom = oi + wi;
        const orr = base ? base.charCodeAt(o + 1) : 0;
        const og = base ? base.charCodeAt(o + 2) : 0;
        const ob = base ? base.charCodeAt(o + 3) : 0;
        out[o] = oi + wi > 255 ? 255 : oi + wi;                         // presence
        out[o + 1] = clampByte((orr * oi + c[0] * wi) / denom);         // blended colour
        out[o + 2] = clampByte((og * oi + c[1] * wi) / denom);
        out[o + 3] = clampByte((ob * oi + c[2] * wi) / denom);
      }

      // base64 of the byte array
      let s = '';
      for (let i = 0; i < BYTES; i++) s += String.fromCharCode(out[i]);
      const enc = btoa(s);
      await env.HEAT.put(key, enc, { expirationTtl: TTL });
      await env.HEAT.put(ipKey, String(used + incoming), { expirationTtl: TTL });
      return json({ day, w: W, h: H, v: enc, used: used + incoming, cap: IP_CAP, accepted: true });
    }
    return json({ error: 'method' }, 405);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}
