import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { handle, emptyData } from './netlify/functions/lib/core.mjs';
let data = emptyData();
const db = { async load() { return data; }, async update(fn) { return fn(data); } };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.md': 'text/plain', '.mp3': 'audio/mpeg' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    let b = ''; for await (const c of req) b += c;
    const out = await handle(db, { method: req.method, path: u.pathname.slice(4), body: b ? JSON.parse(b) : null, pin: req.headers['x-admin-pin'] || '' }, { ADMIN_PIN: process.env.ADMIN_PIN || 'dev-2026' });
    res.writeHead(out.status, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out.body));
  }
  let f = path.join('public', u.pathname === '/' ? 'index.html' : u.pathname);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(4300);
