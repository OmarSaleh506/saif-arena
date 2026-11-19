/* أمر هجرة مستقل: node src/migrate.mjs
   - قفل Advisory واحد طوال التشغيل على اتصال جلسة مخصص (وليس من المجمّع)، فلا يشغّل أكثر من نسخة الهجرة نفسها.
   - كل ملف داخل معاملة (ذرّي)، ويُسجَّل في schema_migrations فيصير إعادة التشغيل بلا أثر (idempotent).
   - يستعمل MIGRATION_DATABASE_URL إن وُجد (للتجاوز المباشر لـ PgBouncer)، وإلا إعدادات قاعدة البيانات العادية. */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { loadConfig, pgOptions } from './config.mjs';
import { log } from './log.mjs';

const LOCK_ID = 7305202601;   // معرّف القفل الثابت لهذا التطبيق
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export async function migrate(cfg = loadConfig()) {
  const c = new pg.Client(pgOptions(cfg.db, { migration: true }));
  await c.connect();
  let applied = 0;
  try {
    await c.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const done = new Set((await c.query('SELECT name FROM schema_migrations')).rows.map(r => r.name));
    for (const f of readdirSync(dir).filter(x => x.endsWith('.sql')).sort()) {
      if (done.has(f)) continue;
      try {
        await c.query('BEGIN');
        await c.query(readFileSync(join(dir, f), 'utf8'));
        await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
        await c.query('COMMIT');
        applied++; log.info('migration applied', { name: f });
      } catch (e) {
        await c.query('ROLLBACK').catch(() => {});
        log.error('migration failed', { name: f, code: e.code || 'unknown' });
        throw e;
      }
    }
  } finally {
    await c.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await c.end();
  }
  log.info('migrations done', { applied });
  return applied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}
