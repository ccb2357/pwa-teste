import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { requireThat, FoundationError } from './errors.mjs';
const runtime = process.env.FOUNDATION_RUNTIME_PACKAGE || fileURLToPath(new URL('../executor/package.json', import.meta.url));
const { parse } = createRequire(runtime)('dotenv');
export { parse as parseDotenv };
export const schema = 1;
export function args(argv) {
  const result = { force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') result.force = true;
    else if (argv[i] === '--project' && argv[i + 1]) result.project = argv[++i];
    else throw new FoundationError('Argumentos aceitos: --project CAMINHO [--force].');
  }
  requireThat(result.project && path.isAbsolute(result.project), 'Informe --project com caminho absoluto dentro do executor.');
  return result;
}
export async function contained(target, allowed) {
  const realRoot = await fs.realpath(allowed);
  const realTarget = await fs.realpath(target);
  requireThat(realTarget !== realRoot && realTarget.startsWith(realRoot + path.sep), 'Projeto fora da raiz permitida.');
  return realTarget;
}
export function parseCentral(raw) {
  requireThat(!raw.includes('\0'), 'Configuração contém byte inválido.');
  // dotenv is data, never a shell program; reject duplicate names and malformed lines.
  const names = new Set();
  let quote = null;
  for (const line of raw.split(/\r?\n/)) {
    if (quote) { if (line.includes(quote)) quote = null; continue; }
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    requireThat(match, 'Linha inválida no arquivo central (use NOME=valor).');
    requireThat(!names.has(match[1]), `Campo duplicado: ${match[1]}.`); names.add(match[1]);
    const v = match[2];
    if (/^["'`]/.test(v) && !v.slice(1).includes(v[0])) quote = v[0];
  }
  requireThat(!quote, 'Aspas não fechadas no arquivo central.');
  return parse(raw);
}
const nonempty = (value, name) => { requireThat(typeof value === 'string' && value.trim().length, `Preencha ${name}.`); return value.trim(); };
const port = (value, name) => { requireThat(/^\d+$/.test(value || '') && +value > 0 && +value <= 65535, `${name} inválida.`); return +value; };
export function validate(input, root) {
  const c = { ...input, root };
  c.PROJECT_SLUG = nonempty(c.PROJECT_SLUG, 'PROJECT_SLUG');
  requireThat(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(c.PROJECT_SLUG), 'PROJECT_SLUG deve usar letras minúsculas, números e hífens.');
  requireThat(path.basename(root) === c.PROJECT_SLUG, 'PROJECT_SLUG deve coincidir com o nome da pasta. Não houve renomeação.');
  c.PROJECT_NAME = nonempty(c.PROJECT_NAME, 'PROJECT_NAME');
  requireThat(['local', 'production'].includes(c.APP_ENV), 'APP_ENV obrigatório: local ou production.');
  c.CONTAINER_PROJECTS_ROOT ||= '/var/www';
  requireThat(path.isAbsolute(c.CONTAINER_PROJECTS_ROOT), 'CONTAINER_PROJECTS_ROOT deve ser absoluto.');
  c.composeFile = path.resolve(root, c.INFRA_COMPOSE_PATH || '../infra/docker-compose.yml');
  c.PHP_SERVICE ||= 'php-fpm'; c.NGINX_SERVICE ||= 'nginx'; c.DOCKER_NETWORK ||= 'infra_network';
  for (const key of ['PHP_SERVICE', 'NGINX_SERVICE', 'DOCKER_NETWORK']) requireThat(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(c[key]), `${key} inválido.`);
  c.NGINX_INTERNAL_URL ||= 'http://nginx';
  let target; try { target = new URL(c.NGINX_INTERNAL_URL); } catch { throw new FoundationError('NGINX_INTERNAL_URL inválida.'); }
  requireThat(['http:', 'https:'].includes(target.protocol) && !target.username && !target.password, 'NGINX_INTERNAL_URL deve ser HTTP(S), sem credenciais.');
  c.LOCAL_DOMAIN ||= c.PROJECT_SLUG + '.localhost';
  requireThat(/^(?=.{1,253}$)[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(c.LOCAL_DOMAIN), 'LOCAL_DOMAIN inválido.');
  c.DEV_PORT = port(c.DEV_PORT, 'DEV_PORT'); c.PREVIEW_PORT = port(c.PREVIEW_PORT, 'PREVIEW_PORT');
  requireThat(c.DEV_PORT !== c.PREVIEW_PORT, 'DEV_PORT e PREVIEW_PORT devem ser diferentes.');
  if (c.APP_ENV === 'production') {
    let url; try { url = new URL(c.PRODUCTION_URL); } catch { throw new FoundationError('Produção exige PRODUCTION_URL HTTPS válida.'); }
    requireThat(url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'PRODUCTION_URL deve ser uma origem HTTPS, sem caminho, parâmetros ou credenciais.');
    c.appUrl = url.origin;
  } else c.appUrl = 'http://' + c.LOCAL_DOMAIN;
  c.DB_HOST = nonempty(c.DB_HOST, 'DB_HOST');
  requireThat(!/[;\r\n\0]/.test(c.DB_HOST), 'DB_HOST inválido.');
  c.DB_PORT = port(c.DB_PORT || '3306', 'DB_PORT');
  c.DB_DATABASE ||= c.PROJECT_SLUG.replaceAll('-', '_');
  c.DB_TEST_DATABASE ||= c.DB_DATABASE + '_test';
  for (const key of ['DB_DATABASE', 'DB_TEST_DATABASE']) requireThat(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(c[key]), `${key} deve ser identificador MySQL simples de até 64 caracteres.`);
  requireThat(c.DB_DATABASE.toLowerCase() !== c.DB_TEST_DATABASE.toLowerCase(), 'Banco de testes deve ser diferente do principal.');
  c.DB_USERNAME = nonempty(c.DB_USERNAME, 'DB_USERNAME');
  requireThat(Object.hasOwn(c, 'DB_PASSWORD'), 'Informe DB_PASSWORD (inclusive vazio quando intencional).');
  c.APP_LOCALE ||= 'pt_BR'; c.APP_TIMEZONE ||= 'UTC'; c.DISPLAY_TIMEZONE ||= 'America/Sao_Paulo';
  requireThat(/^[a-z]{2}(?:[_-][A-Z]{2})?$/.test(c.APP_LOCALE), 'APP_LOCALE inválido.');
  for (const key of ['APP_TIMEZONE', 'DISPLAY_TIMEZONE']) { try { new Intl.DateTimeFormat('pt-BR', { timeZone: c[key] }); } catch { throw new FoundationError(`${key} inválido.`); } }
  c.SESSION_LIFETIME ||= '120'; requireThat(/^\d+$/.test(c.SESSION_LIFETIME) && +c.SESSION_LIFETIME > 0, 'SESSION_LIFETIME deve ser inteiro positivo.');
  c.PWA_SHORT_NAME ||= c.PROJECT_NAME; c.PWA_DESCRIPTION ||= 'Descrição do aplicativo';
  c.PWA_THEME_COLOR ||= '#007aff'; c.PWA_BACKGROUND_COLOR ||= '#ffffff';
  for (const key of ['PWA_THEME_COLOR', 'PWA_BACKGROUND_COLOR']) requireThat(/^#[0-9a-fA-F]{6}$/.test(c[key]), `${key} deve usar #RRGGBB.`);
  for (const [key, value] of Object.entries(c)) if (typeof value === 'string') requireThat(!/[\r\n\0]/.test(value), `${key} não aceita múltiplas linhas.`);
  c.base = c.PROJECT_SLUG.replaceAll('-', '_'); c.nodeService = c.PROJECT_SLUG + '-node';
  c.vendorVolume = c.base + '_vendor'; c.modulesVolume = c.base + '_node_modules';
  c.backend = path.join(root, 'backend'); c.frontend = path.join(root, 'frontend');
  c.sessionCookie = c.base + '_session';
  const origins = c.APP_ENV === 'production' ? [new URL(c.appUrl).host] : [c.LOCAL_DOMAIN, ...['localhost', '127.0.0.1', c.LOCAL_DOMAIN].flatMap(h => [`${h}:${c.DEV_PORT}`, `${h}:${c.PREVIEW_PORT}`])];
  c.stateful = [...new Set(origins)].join(',');
  return c;
}
export async function load(root) {
  let raw; try { raw = await fs.readFile(path.join(root, '.env.foundation'), 'utf8'); } catch { throw new FoundationError('Crie .env.foundation a partir do exemplo e preencha a configuração privada localmente.'); }
  const c = validate(parseCentral(raw), root);
  await contained(root, c.CONTAINER_PROJECTS_ROOT);
  return c;
}
