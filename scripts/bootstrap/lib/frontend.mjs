import fs from 'node:fs/promises';
import path from 'node:path';
import { docker, jsonOutput } from './process.mjs';
import { hash } from './files.mjs';
import { requireThat } from './errors.mjs';
export function frontendCommand(c, d, command) {
  return ['run', '--rm', '-i', '--network', c.DOCKER_NETWORK, '--workdir', '/app',
    '--mount', `type=bind,source=${d.mapping.toHost(c.frontend)},target=/app`,
    '--mount', `type=volume,source=${c.modulesVolume},target=/app/node_modules`,
    '--env', 'npm_config_cache=/tmp/npm-cache', 'node:22-alpine', ...command];
}
export async function installFrontend(c, d) {
  const packageJson = await fs.readFile(path.join(c.frontend, 'package.json'), 'utf8');
  const lock = await fs.readFile(path.join(c.frontend, 'package-lock.json'), 'utf8');
  const manifest = JSON.parse(packageJson);
  requireThat(manifest.scripts?.dev && manifest.scripts?.build, 'Frontend precisa dos scripts dev e build.');
  const fingerprint = hash(packageJson + '\n' + lock + '\nnode22-include-dev');
  const inspect = "const fs=require('node:fs');const p='node_modules/.foundation-lock';process.stdout.write(JSON.stringify({marker:fs.existsSync(p)?fs.readFileSync(p,'utf8').trim():'',metadata:fs.existsSync('node_modules/vite/package.json')&&fs.existsSync('node_modules/framework7-vue/package.json')}));";
  const state = jsonOutput(await docker(frontendCommand(c, d, ['node', '-e', inspect]), { label: 'Estado efetivo node_modules' }), 'Estado node_modules');
  if (state.marker === fingerprint && state.metadata) { console.log('Dependências frontend inalteradas; instalação preservada.'); return fingerprint; }
  console.log('Instalando dependências frontend pelo package-lock.json.');
  await docker(frontendCommand(c, d, ['npm', 'ci', '--include=dev', '--no-audit', '--no-fund']), { label: 'Instalação frontend npm ci', timeout: 900000 });
  await docker(frontendCommand(c, d, ['node', '-e', "const fs=require('node:fs');fs.writeFileSync('node_modules/.foundation-lock',fs.readFileSync(0,'utf8')); "]), { input: fingerprint + '\n', label: 'Marcador node_modules' });
  return fingerprint;
}
