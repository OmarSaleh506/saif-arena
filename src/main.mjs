import { loadConfig } from './config.mjs';
import { log } from './log.mjs';
import { createDb } from './db.mjs';
import { createServer } from './server.mjs';
import { migrate } from './migrate.mjs';

const cfg = loadConfig();
if (cfg.adminPin.length < 6) log.warn('ADMIN_PIN is not set or shorter than 6 characters: admin panel stays locked');

if (cfg.runMigrations) {   /* اختياري عند الإقلاع، ويُفضَّل تشغيل أمر الهجرة المستقل قبل النسخة الجديدة */
  try { await migrate(cfg); } catch (e) { log.error('boot migration failed'); process.exit(1); }
}
const db = createDb(cfg);
const { server, shutdown } = createServer(cfg, db);
server.listen(cfg.port, cfg.host, () => log.info('listening', { port: cfg.port, env: cfg.nodeEnv }));
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => shutdown(s));
process.on('unhandledRejection', e => { log.error('unhandled rejection', { code: (e && e.code) || 'unknown' }); });
