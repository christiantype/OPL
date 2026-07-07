# OP/AL heat store (Cloudflare Worker)

Shared daily "heat pad" for the homepage hero. Free tier is plenty for a portfolio.

## Deploy (one time)
1. Install: `npm i -g wrangler` and `wrangler login`
2. Create the KV store: `npx wrangler kv namespace create HEAT`
   → copy the printed `id` into `wrangler.toml` (replace `PASTE_YOUR_KV_NAMESPACE_ID_HERE`)
3. Deploy: `npx wrangler deploy`
   → it prints a URL like `https://opal-heat.<you>.workers.dev`
4. In `index.html`, set that URL as `HEAT_ENDPOINT` in the `heroThermal` script.

That's it. Until `HEAT_ENDPOINT` is set, the hero uses per-browser daily memory (still works).

## How it works
- One byte-grid (148×84) per day in KV, keyed `heat:YYYY-MM-DD`, auto-expiring after 48h.
- Clients `GET` the day's accumulated heat and `POST` their own contribution; the worker
  merges (adds, capped at 255) and returns the new grid.
- Merge is read-modify-write (not strictly atomic) — fine for an ambient heat map; a
  contribution or two may occasionally be dropped under heavy concurrency.
