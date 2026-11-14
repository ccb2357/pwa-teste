import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const prepare = process.argv.slice(2).join(' ') === '--prepare';
if (process.argv.length > 2 && !prepare) throw new Error('Use somente --prepare para gerar candidatos; comparação não aceita atualização automática.');
if (!prepare) {
  for (const project of ['visual-desktop', 'visual-mobile']) for (const file of ['grid.png', 'form.png']) {
    if (!fs.existsSync(path.join(root, 'tests/e2e/visual-baselines', project, file))) {
      process.stderr.write('Referência aprovada ausente. Gere candidatos, revise as imagens e copie somente as aprovadas conforme o manual.\n');
      process.exit(1);
    }
  }
}
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--project=visual-desktop', '--project=visual-mobile', ...(prepare ? ['--update-snapshots'] : [])], { cwd: root, stdio: 'inherit', env: { ...process.env, PWA_VISUAL_CANDIDATE: prepare ? '1' : '0' } });
process.exit(result.status ?? 1);
