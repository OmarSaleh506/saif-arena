import { getStore } from '@netlify/blobs';
import { handle, emptyData } from './lib/core.mjs';

const KEY = 'data';
const db = () => {
  const store = getStore({ name: 'saif-arena', consistency: 'strong' });
  const read = async () => {
    const x = await store.getWithMetadata(KEY, { type: 'json' });
    return x ? { data: x.data, etag: x.etag } : { data: emptyData(), etag: null };
  };
  return {
    async load() { return (await read()).data; },
    /* قراءة ثم كتابة مع إعادة المحاولة عند تزامن طلبين */
    async update(fn) {
      for (let i = 0; i < 6; i++) {
        const { data, etag } = await read();
        const out = fn(data);
        const res = await store.setJSON(KEY, data, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
        if (!res || res.modified !== false) return out;
      }
      throw new Error('conflict');
    },
  };
};

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '') || '/';
  let body = null;
  if (req.method === 'POST') { try { body = await req.json(); } catch (e) { body = null; } }
  try {
    const out = await handle(db(), { method: req.method, path, body, pin: req.headers.get('x-admin-pin') || '' }, { ADMIN_PIN: process.env.ADMIN_PIN });
    return new Response(JSON.stringify(out.body), { status: out.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'server' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

export const config = { path: '/api/*' };
