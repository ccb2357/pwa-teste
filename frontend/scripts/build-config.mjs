import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
export function publicApp(config) {
  const names = ['name', 'slug', 'locale', 'displayTimezone', 'appUrl', 'apiBase', 'themeColor', 'shortName', 'description', 'backgroundColor'];
  if (names.some(k => typeof config.app?.[k] !== 'string' || !config.app[k])) throw new Error('Configuração pública desatualizada. Execute o bootstrap para regenerá-la.');
  return Object.fromEntries(names.map(k => [k, config.app[k]]));
}
export function buildIdentity(root, app) {
  const hash = createHash('sha256').update(JSON.stringify(app));
  function visit(relative) {
    const file = path.join(root, relative);
    if (fs.statSync(file).isDirectory()) { for (const name of fs.readdirSync(file).sort()) visit(path.join(relative, name)); }
    else hash.update(relative.split(path.sep).join('/')).update(fs.readFileSync(file));
  }
  for (const relative of ['index.html', 'src', 'public', 'package-lock.json', 'vite.config.js', 'scripts']) visit(relative);
  return '0.4.0-' + hash.digest('hex').slice(0, 12);
}
