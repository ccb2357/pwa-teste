import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
try {
  const argv = process.argv.slice(2), index = argv.indexOf('--project');
  if (index < 0 || !argv[index + 1] || !path.isAbsolute(argv[index + 1])) throw new Error('Use --project /var/www/slug [--force].');
  const allowed = await fs.realpath(process.env.FOUNDATION_PROJECTS_ROOT || '/var/www');
  const root = await fs.realpath(argv[index + 1]);
  if (!root.startsWith(allowed + path.sep)) throw new Error('Projeto fora da raiz permitida.');
  const script = await fs.realpath(path.join(root, 'scripts/bootstrap/index.mjs'));
  if (!script.startsWith(root + path.sep)) throw new Error('Entrada fora do projeto alvo.');
  await fs.access(path.join(root, '.env.foundation'));
  const child = spawn(process.execPath, [script, ...argv], { stdio: 'inherit', shell: false });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error('Não foi possível iniciar o bootstrap do alvo.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (e) { console.error(e.code === 'ENOENT' ? 'Projeto, configuração central ou index.mjs ausente no mount.' : e.message); process.exitCode = 1; }
