/* سجلات JSON منظمة إلى stdout/stderr. لا أسرار ولا بيانات شخصية: معرّفات ورموز أخطاء فقط. */
const out = (level, msg, extra) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra });
  (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line + '\n');
};
export const log = { info: (m, e) => out('info', m, e), warn: (m, e) => out('warn', m, e), error: (m, e) => out('error', m, e) };
