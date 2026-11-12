import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { technicalPath } from '../src/pwa/policy.js';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function checkPwa(directory = path.join(root, 'dist')) {
  const read = file => fs.readFile(path.join(directory, file), 'utf8');
  const [html, worker, manifestText] = await Promise.all(['index.html', 'sw.js', 'manifest.webmanifest'].map(read));
  const manifest = JSON.parse(manifestText);
  const entry = html.match(/<script[^>]*src="\/([^"]+)"/)?.[1];
  const buildId = html.match(/name="app-build" content="([a-z0-9.-]+)"/)?.[1];
  if (!buildId || !html.includes('manifest.webmanifest') || !/javascript|<script/.test(html)) throw new Error('HTML/build inválido.');
  if (manifest.start_url !== '/' || manifest.scope !== '/' || manifest.display !== 'standalone' || !manifest.name) throw new Error('Manifest inválido.');
  for (const size of [192, 512]) {
    const icon = manifest.icons?.find(i => i.sizes === `${size}x${size}` && i.type === 'image/png');
    if (!icon || icon.src !== `/icons/icon-${size}.png`) throw new Error('Ícone ausente.');
    const png = await fs.readFile(path.join(directory, icon.src.slice(1)));
    if (png.toString('hex', 0, 8) !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== size || png.readUInt32BE(20) !== size) throw new Error('Dimensões do ícone inválidas.');
  }
  if (worker.includes('self.__WB_MANIFEST') || !worker.includes('SKIP_WAITING')) throw new Error('Worker não foi compilado/injetado.');
  const files = [...worker.matchAll(/(?:["']url["']|\burl)\s*:\s*["']([^"']+)["']/g)].map(m => m[1]);
  if (!['index.html', 'offline.html', 'fonts/nunito.woff2', 'icons/icon-192.png', 'icons/icon-512.png'].every(f => files.includes(f))) throw new Error('Precache público incompleto.');
  if (!entry || !files.includes(entry)) throw new Error('Entrada absoluta compilada ausente do precache.');
  if (!files.some(f => /^assets\/.*\.js$/.test(f)) || !files.some(f => /^assets\/.*\.css$/.test(f))) throw new Error('Entrada JS/CSS não está no precache.');
  for (const file of files) {
    if (!/^(index\.html|offline\.html|manifest\.webmanifest|assets\/[\w.-]+\.(js|css|woff2?|ttf)|fonts\/[\w.-]+\.woff2|icons\/icon-(180|192|512)\.png)$/.test(file) || technicalPath('/' + file)) throw new Error('Entrada privada/inesperada no precache.');
    await fs.access(path.join(directory, file));
  }
  return { buildId, entry, files: [...new Set(files)] };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await checkPwa(); console.log(process.argv.includes('--json') ? JSON.stringify(result) : `PWA verificada: ${result.buildId}; ${result.files.length} arquivos públicos.`); }
  catch (error) { console.error('Build PWA inválido: ' + error.message); process.exitCode = 1; }
}
