import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPwa } from './check-pwa.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function publishBuild(source = path.join(root, '.dist-build'), destination = path.join(root, 'dist')) {
  const result = await checkPwa(source); // Fail before touching the served build.
  async function copy(relative) {
    const from = path.join(source, relative), to = path.join(destination, relative);
    if ((await fs.stat(from)).isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      for (const name of await fs.readdir(from)) { if (name === '.gitkeep') continue; if (name.startsWith('.')) throw new Error('Arquivo oculto no build.'); await copy(path.join(relative, name)); }
    } else {
      await fs.mkdir(path.dirname(to), { recursive: true });
      const temporary = to + '.publishing';
      await fs.copyFile(from, temporary); await fs.rename(temporary, to);
    }
  }
  // Keep prior hashed assets for open clients; entrypoints are published last.
  for (const directory of ['assets', 'fonts', 'icons']) await copy(directory);
  for (const file of ['offline.html', 'manifest.webmanifest', 'index.html', 'sw.js']) await copy(file);
  await fs.rm(source, { recursive: true, force: true });
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await publishBuild(); console.log(`Build publicado: ${result.buildId}.`); }
  catch (error) { console.error('Publicação interrompida: ' + error.message); process.exitCode = 1; }
}
