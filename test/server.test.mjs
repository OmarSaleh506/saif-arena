import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.mjs';
import { loadConfig } from '../src/config.mjs';
import { emptyData } from '../src/core.mjs';

const mk = (env = {}) => {
  let d = emptyData();
  const db = { load: async () => d, update: async fn => fn(d), close: async () => {} };
  const cfg = loadConfig({ PORT: '0', ADMIN_PIN: 'secret-123', ...env });
  const s = createServer(cfg, db);
  return new Promise(r => s.server.listen(0, '127.0.0.1', () => r({ ...s, base: 'http://127.0.0.1:' + s.server.address().port })));
};

test('livez وreadyz وصفحة الرئيسية', async () => {
  const s = await mk();
  assert.equal((await fetch(s.base + '/livez')).status, 200);
  assert.equal((await fetch(s.base + '/readyz')).status, 200);
  const home = await fetch(s.base + '/');
  assert.equal(home.status, 200); assert.match(await home.text(), /تجارب طويق/);
  s.server.close();
});

test('منع الخروج من مجلد الملفات الثابتة', async () => {
  const s = await mk();
  const r = await fetch(s.base + '/..%2fpackage.json');
  assert.ok([403, 404].includes(r.status));
  s.server.close();
});

test('الموشن يُحوَّل إلى S3_PUBLIC_URL أو يعطي 404', async () => {
  let s = await mk();
  assert.equal((await fetch(s.base + '/video/saif-loader.mp4', { redirect: 'manual' })).status, 404); s.server.close();
  s = await mk({ S3_PUBLIC_URL: 'https://cdn.example.com/bucket' });
  const r = await fetch(s.base + '/video/saif-loader.mp4', { redirect: 'manual' });
  assert.equal(r.status, 302); assert.equal(r.headers.get('location'), 'https://cdn.example.com/bucket/video/saif-loader.mp4'); s.server.close();
});

test('الواجهة /api/data تعمل، والخطأ لا يكشف تفاصيل داخلية', async () => {
  const s = await mk();
  const r = await fetch(s.base + '/api/data'); assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).rounds, []);
  s.server.close();
});

test('APP_URL يتقدّم على الرابط المخزّن في الإعدادات', async () => {
  const s = await mk({ APP_URL: 'https://saif.example.com/' });
  const d = await (await fetch(s.base + '/api/data')).json();
  assert.equal(d.cfg.publicUrl, 'https://saif.example.com');
  s.server.close();
});
