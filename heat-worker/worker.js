/* OP/AL — shared "heat pad" store (Cloudflare Worker + KV).
   GET  /?day=KEY            → { day, w, h, v }   (v = base64 grid, '' if none)
   POST /  { day: KEY, v }   → merges a contribution, returns the new grid
   KEY is whatever period the client uses (we use the Monday of the week).
   Grid is a W*H byte array (accumulated heat 0..255). Auto-expires after 9 days. */
const W = 148, H = 84, N = W * H;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};
const todayKey = () => new Date().toISOString().slice(0, 10);

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);

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
      const key = 'heat:' + day;
      const cur = await env.HEAT.get(key);
      const base = cur ? atob(cur) : null;
      let str = '';
      for (let i = 0; i < N; i++) {
        let val = (base ? base.charCodeAt(i) : 0) + contrib.charCodeAt(i);
        if (val > 255) val = 255;
        str += String.fromCharCode(val);
      }
      const out = btoa(str);
      await env.HEAT.put(key, out, { expirationTtl: 60 * 60 * 24 * 9 });
      return json({ day, w: W, h: H, v: out });
    }
    return json({ error: 'method' }, 405);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}
