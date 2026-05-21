#!/usr/bin/env node
// Publish a saved scene as the live homepage version.
//
// Usage:  node scene/publish.mjs [path-to-opal-scene-*.json]
//
// With no argument it finds the newest `opal-scene-*.json` in ./scene or ~/Downloads,
// moves it into scene/statements/<id>.json, prepends it to manifest.json, sets it
// active (live), and removes the loose source file. Then: git add/commit/push.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); // repo root
const STMTS = path.join(ROOT, 'scene', 'statements');
const SEARCH = [path.join(ROOT, 'scene'), path.join(os.homedir(), 'Downloads')];

function newestSaved() {
  const hits = [];
  for (const dir of SEARCH) {
    let files = [];
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const f of files) {
      if (/^opal-scene-.*\.json$/.test(f)) {
        const full = path.join(dir, f);
        hits.push({ full, mtime: fs.statSync(full).mtimeMs });
      }
    }
  }
  hits.sort((a, b) => b.mtime - a.mtime);
  return hits[0]?.full || null;
}

const src = process.argv[2] ? path.resolve(process.argv[2]) : newestSaved();
if (!src || !fs.existsSync(src)) {
  console.error('No opal-scene-*.json found in ./scene or ~/Downloads (and none passed as an arg).');
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(src, 'utf8'));
const id = path.basename(src).replace(/^opal-scene-/, '').replace(/\.json$/, '');
const title = state._title || id;
const ts = new Date().toISOString();

fs.mkdirSync(STMTS, { recursive: true });
fs.writeFileSync(path.join(STMTS, `${id}.json`), JSON.stringify(state, null, 2));

const mPath = path.join(STMTS, 'manifest.json');
let m = { active: null, versions: [] };
try { m = JSON.parse(fs.readFileSync(mPath, 'utf8')); } catch {}
if (!m.versions) m.versions = [];
m.versions = m.versions.filter(v => v.id !== id);   // de-dupe re-publishes
m.versions.unshift({ id, title, ts });
m.active = id;
fs.writeFileSync(mPath, JSON.stringify(m, null, 2));

// Remove the loose source so scene/ and Downloads don't accumulate (keep the versioned copy).
if (path.dirname(src) !== STMTS) { try { fs.unlinkSync(src); } catch {} }

console.log(`Published "${title}"  →  scene/statements/${id}.json  (now LIVE)`);
console.log(`Versions: ${m.versions.length}  |  active: ${m.active}`);
