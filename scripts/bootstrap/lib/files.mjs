import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseDotenv } from './config.mjs';
import { requireThat } from './errors.mjs';
export async function readOptional(file, fallback = '') { try { return await fs.readFile(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; } }
export async function writeAtomic(file, content, mode = 0o644) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (await readOptional(file) === content) return false;
  const temp = file + '.foundation-' + crypto.randomBytes(6).toString('hex');
  await fs.writeFile(temp, content, { mode }); await fs.rename(temp, file); return true;
}
export const hash = text => crypto.createHash('sha256').update(text).digest('hex');
export function identity(c) { return { slug: c.PROJECT_SLUG, root: c.root, database: c.DB_DATABASE, testDatabase: c.DB_TEST_DATABASE, vendor: c.vendorVolume, modules: c.modulesVolume }; }
export function checkIdentity(saved, c) {
  if (saved?.identity) requireThat(JSON.stringify(saved.identity) === JSON.stringify(identity(c)), 'Identidade inicializada mudou (slug/pasta/bancos/volumes). Prepare um plano explícito de migração antes de continuar.');
}
export function encodeEnv(value) {
  return '"' + String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('$', '\\$') + '"';
}
export function managedEnv(existing, values) {
  const keys = new Set(Object.keys(values));
  let rest = existing.replace(/(?:^|\n)# BEGIN FOUNDATION MANAGED\r?\n[\s\S]*?# END FOUNDATION MANAGED(?:\r?\n|$)/g, '\n');
  rest = rest.split(/\r?\n/).filter(line => !keys.has(line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1])).join('\n').trimEnd();
  return (rest ? rest + '\n\n' : '') + '# BEGIN FOUNDATION MANAGED\n' + Object.entries(values).map(([key, value]) => `${key}=${encodeEnv(value)}`).join('\n') + '\n# END FOUNDATION MANAGED\n';
}
export function appKey(existing) {
  const key = parseDotenv(existing).APP_KEY || '';
  if (key) {
    requireThat((key.startsWith('base64:') && /^[A-Za-z0-9+/]{43}=$/.test(key.slice(7)) && Buffer.from(key.slice(7), 'base64').length === 32) || (!key.startsWith('base64:') && Buffer.byteLength(key, 'utf8') === 32), 'APP_KEY existente inválida; corrija explicitamente, sem regeneração silenciosa.');
    return key;
  }
  return 'base64:' + crypto.randomBytes(32).toString('base64');
}
export async function synchronizeEnvs(c) {
  const common = {
    APP_NAME: c.PROJECT_NAME, APP_ENV: c.APP_ENV, APP_DEBUG: c.APP_ENV === 'local' ? 'true' : 'false', APP_URL: c.appUrl,
    APP_LOCALE: c.APP_LOCALE, APP_FALLBACK_LOCALE: c.APP_LOCALE, APP_TIMEZONE: c.APP_TIMEZONE,
    DB_URL: 'null', DB_SOCKET: '', DB_CONNECTION: 'mysql', DB_HOST: c.DB_HOST, DB_PORT: c.DB_PORT, DB_DATABASE: c.DB_DATABASE, DB_USERNAME: c.DB_USERNAME, DB_PASSWORD: c.DB_PASSWORD,
    SESSION_DRIVER: 'file', SESSION_LIFETIME: c.SESSION_LIFETIME, SESSION_ENCRYPT: 'false', SESSION_COOKIE: c.sessionCookie, SESSION_DOMAIN: 'null',
    SESSION_SECURE_COOKIE: c.APP_ENV === 'production' ? 'true' : 'false', SESSION_HTTP_ONLY: 'true', SESSION_SAME_SITE: 'lax',
    SANCTUM_STATEFUL_DOMAINS: c.stateful, CACHE_STORE: 'file', QUEUE_CONNECTION: 'sync',
    FOUNDATION_MAIN_DATABASE: c.DB_DATABASE, FOUNDATION_TEST_DATABASE: c.DB_TEST_DATABASE, FOUNDATION_ENV: c.APP_ENV,
  };
  const envPath = path.join(c.backend, '.env'), existing = await readOptional(envPath);
  await writeAtomic(envPath, managedEnv(existing, { ...common, APP_KEY: appKey(existing) }), 0o640);
  const testPath = path.join(c.backend, '.env.testing'), test = await readOptional(testPath);
  // Production never receives a ready-to-use destructive test environment.
  if (c.APP_ENV === 'local') await writeAtomic(testPath, managedEnv(test, { ...common, APP_ENV: 'testing', APP_DEBUG: 'false', APP_KEY: appKey(test), DB_DATABASE: c.DB_TEST_DATABASE, SESSION_DRIVER: 'array', CACHE_STORE: 'array', MAIL_MAILER: 'array' }), 0o640);
}
