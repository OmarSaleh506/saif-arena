/* تخزين PostgreSQL: وثيقة JSONB واحدة (مثل نموذج Netlify Blobs السابق) مع قفل صف داخل معاملة.
   الاتصال من مجمّع (pool) قابل للضبط، ولا يعتمد على حالة الجلسة (يعمل خلف PgBouncer في وضع المعاملات). */
import pg from 'pg';
import { pgOptions } from './config.mjs';
import { emptyData } from './core.mjs';

const KEY = 'data';

export function createDb(cfg) {
  const pool = new pg.Pool({ ...pgOptions(cfg.db), max: cfg.db.poolMax, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  pool.on('error', e => { process.stderr.write(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'pg pool error', code: e.code || 'unknown' }) + '\n'); });
  return {
    pool,
    async load() {
      const r = await pool.query('SELECT data FROM app_data WHERE key = $1', [KEY]);
      return r.rows[0] ? r.rows[0].data : emptyData();
    },
    /* قراءة ثم كتابة داخل معاملة واحدة، مع قفل الصف لمنع تزامن طلبين */
    async update(fn) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        await c.query('INSERT INTO app_data (key, data) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING', [KEY, JSON.stringify(emptyData())]);
        const r = await c.query('SELECT data FROM app_data WHERE key = $1 FOR UPDATE', [KEY]);
        const data = r.rows[0].data;
        const out = fn(data);
        await c.query('UPDATE app_data SET data = $2::jsonb, updated_at = now() WHERE key = $1', [KEY, JSON.stringify(data)]);
        await c.query('COMMIT');
        return out;
      } catch (e) {
        try { await c.query('ROLLBACK'); } catch (x) { /* الاتصال قد يكون انقطع */ }
        throw e;
      } finally { c.release(); }
    },
    async ping() { await pool.query('SELECT 1'); },
    close: () => pool.end(),
  };
}
