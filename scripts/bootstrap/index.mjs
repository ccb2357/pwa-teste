import fs from 'node:fs/promises';
import path from 'node:path';
import { args, load, schema } from './lib/config.mjs';
import { FoundationError, requireThat, httpFailure } from './lib/errors.mjs';
import { docker, jsonOutput } from './lib/process.mjs';
import { discover, infraProblems, phpExec, checkPorts } from './lib/docker.mjs';
import { installFrontend } from './lib/frontend.mjs';
import { generate, siteApplied } from './lib/templates.mjs';
import { identity, checkIdentity, hash, readOptional, writeAtomic, synchronizeEnvs } from './lib/files.mjs';
let lock, stateFile, state;
async function save() { if (stateFile && state) await writeAtomic(stateFile, JSON.stringify(state, null, 2) + '\n', 0o600); }
try {
  const options = args(process.argv.slice(2));
  const c = await load(options.project);
  lock = path.join(c.root, '.foundation-bootstrap.lock');
  try { await fs.mkdir(lock); } catch { lock = undefined; throw new FoundationError('Outra execução ou lock pendente. Confira se não há bootstrap ativo antes de remover .foundation-bootstrap.lock.'); }
  stateFile = path.join(c.root, '.foundation-state.json');
  const saved = await readOptional(stateFile, '{}');
  try { state = JSON.parse(saved); } catch { throw new FoundationError('Estado local inválido. Preserve-o para diagnóstico; não reinicialize identidade automaticamente.'); }
  checkIdentity(state, c);
  state = { ...state, schema, identity: identity(c), release: '0.2.0-sprint.2', completeFoundation: false, startedAt: new Date().toISOString() };
  console.log(`Preparação de ${c.PROJECT_SLUG} (${c.APP_ENV}).`);
  const d = await discover(c);
  if (state.composeProject) requireThat(state.composeProject === d.project, 'Identidade da infraestrutura Compose mudou; revisar explicitamente.');
  state.composeProject = d.project;
  await generate(c, d);
  await checkPorts(c, d);
  const problems = infraProblems(c, d);
  const nginx = await docker(['exec', d.nginx.Id, 'nginx', '-T'], { label: 'Sintaxe/configuração Nginx' });
  if (!siteApplied(nginx.stdout + nginx.stderr, c)) problems.push('Aplicar/recarregar o bloco de site gerado no Nginx.');
  if (problems.length) {
    state.phase = 'infra-pending'; state.pending = problems; await save();
    console.log(problems.map(x => '- ' + x).join('\n'));
    throw new FoundationError('Instruções e trechos em instalacao-pwa-framework.md, na raiz do projeto. Aplique manualmente, valide/recrie somente os serviços necessários e repita o comando.', 2);
  }
  if (c.APP_ENV === 'production') requireThat(options.force, 'Produção: migrations exigem --force explícito. Nenhuma instalação/configuração backend foi alterada.');
  state.phase = 'backend-install'; state.pending = []; await save();
  const version = (await phpExec(c, d, ['php', '-r', 'echo PHP_VERSION;'], undefined, 'Versão PHP')).stdout.trim();
  requireThat(/^8\.2\./.test(version), 'Esta fundação exige PHP 8.2.x; não será substituído automaticamente.');
  const modules = (await phpExec(c, d, ['php', '-m'], undefined, 'Extensões PHP')).stdout.toLowerCase().split(/\r?\n/);
  for (const module of ['ctype', 'curl', 'dom', 'fileinfo', 'mbstring', 'openssl', 'pdo', 'pdo_mysql', 'session', 'tokenizer', 'xml']) requireThat(modules.includes(module), `Extensão PHP ausente: ${module}.`);
  const composer = (await phpExec(c, d, ['composer', '--version', '--no-ansi'], undefined, 'Composer existente')).stdout;
  requireThat(/Composer version 2\./.test(composer), 'Composer 2 necessário no PHP-FPM existente.');
  await synchronizeEnvs(c);
  await phpExec(c, d, ['php', path.join(c.root, 'scripts/bootstrap/php/permissions.php')], undefined, 'Permissões do projeto');
  const lockfile = await fs.readFile(path.join(c.backend, 'composer.lock'), 'utf8');
  const fingerprint = hash(lockfile + '\n' + c.APP_ENV);
  const actualVendor = jsonOutput(await phpExec(c, d, ['php', '-r', "echo json_encode(['marker'=>is_file('vendor/.foundation-lock')?trim(file_get_contents('vendor/.foundation-lock')):'','metadata'=>is_file('vendor/composer/installed.json')&&is_file('vendor/autoload.php')]);"], undefined, 'Estado efetivo do volume vendor'), 'Estado vendor');
  const installed = actualVendor.marker, metadata = actualVendor.metadata;
  if (installed !== fingerprint || !metadata) {
    console.log('Instalando dependências PHP pelo composer.lock.');
    await phpExec(c, d, ['composer', 'install', '--no-interaction', '--prefer-dist', '--no-progress', '--optimize-autoloader', ...(c.APP_ENV === 'production' ? ['--no-dev'] : [])], undefined, 'Instalação Composer');
    await phpExec(c, d, ['php', '-r', "if(file_put_contents('vendor/.foundation-lock',stream_get_contents(STDIN))===false){exit(1);}"], fingerprint + '\n', 'Marcador de dependências no volume vendor');
  } else console.log('Dependências PHP inalteradas; instalação preservada.');
  await phpExec(c, d, ['composer', 'check-platform-reqs', ...(c.APP_ENV === 'production' ? ['--no-dev'] : [])], undefined, 'Plataforma PHP/Composer');
  const databases = await docker(['exec', '-i', '--workdir', c.backend, d.php.Id, 'php', path.join(c.root, 'scripts/bootstrap/php/databases.php')], {
    input: JSON.stringify({ host: c.DB_HOST, port: c.DB_PORT, username: c.DB_USERNAME, password: c.DB_PASSWORD, database: c.DB_DATABASE, testDatabase: c.DB_TEST_DATABASE }), label: 'Conexão/criação de bancos com a conta existente', allowFailure: true,
  });
  if (databases.code !== 0) throw new FoundationError(databases.code === 2 ? 'Banco ausente sem permissão de criação. Crie os bancos informados no central manualmente com a conta existente e repita.' : 'Conexão aos bancos falhou. Confira os valores privados e a rede; nenhuma credencial será exibida.', databases.code === 2 ? 2 : 1);
  jsonOutput(databases, 'Verificação dos bancos');
  await phpExec(c, d, ['php', 'artisan', 'config:clear', '--no-interaction'], undefined, 'Limpeza de configuração em processo separado');
  await phpExec(c, d, ['php', path.join(c.root, 'scripts/bootstrap/php/verify-runtime.php')], JSON.stringify({ environment: c.APP_ENV, name: c.PROJECT_NAME, url: c.appUrl, timezone: c.APP_TIMEZONE, host: c.DB_HOST, port: c.DB_PORT, database: c.DB_DATABASE, username: c.DB_USERNAME, password: c.DB_PASSWORD, cookie: c.sessionCookie, stateful: c.stateful }), 'Conferência da configuração efetiva antes de migrations');
  console.log('Sincronizando caches e migrations pendentes.');
  await phpExec(c, d, ['php', 'artisan', 'app:sync', '--no-interaction', ...(options.force ? ['--force'] : [])], undefined, 'app:sync');
  await phpExec(c, d, ['php', path.join(c.root, 'scripts/bootstrap/php/permissions.php')], undefined, 'Permissões finais');
  const verify = await docker(['exec', '-i', '--workdir', c.backend, d.php.Id, 'php', path.join(c.root, 'scripts/bootstrap/php/verify-http.php')], {
    input: JSON.stringify({ target: c.NGINX_INTERNAL_URL, url: c.appUrl, origins: c.stateful.split(','), environment: c.APP_ENV }),
    label: 'HTTP via Nginx, diagnóstico e CSRF', allowFailure: true, timeout: 900000,
  });
  if (verify.code !== 0) throw new FoundationError(httpFailure(verify.stdout));
  const evidence = jsonOutput(verify, 'Verificação HTTP');
  requireThat(evidence.status === 'ok', 'Integração HTTP não foi validada.');
  state.phase = 'frontend-install'; await save();
  const frontendLock = await installFrontend(c, d);
  state.frontendLock = frontendLock;
  state.phase = 'frontend-ready'; state.lastExitCode = 0; state.phpVersion = version; state.composerLock = hash(lockfile); state.verifiedAt = new Date().toISOString(); state.checks = evidence.checks;
  state.pending = ['Design system (Sprint 3)', 'PWA/build/publicação (Sprint 4)', 'Push Notifications (Sprint 5)', 'Validações finais (Sprint 6)']; await save();
  console.log(`Sprint 2: backend verificado e dependências frontend preparadas. Status: ${c.appUrl}/status.`);
  console.log(c.APP_ENV === 'local' ? `Para abrir Hello, execute frontend/vite.cmd dev e acesse http://localhost:${c.DEV_PORT}.` : 'Frontend preparado; publicação PWA pertence à Sprint 4.');
  console.log('PWA, push, aparelhos e aceite final continuam nas próximas etapas.');
} catch (error) {
  if (state) { state.phase = error.code === 2 ? 'manual-pending' : 'failed'; state.lastExitCode = error.code === 2 ? 2 : 1; await save().catch(() => {}); }
  console.error(error instanceof FoundationError ? error.message : 'Bootstrap interrompido. Confira configuração, caminhos e acesso aos arquivos; detalhes privados não são exibidos.');
  process.exitCode = error.code === 2 ? 2 : 1;
} finally { if (lock) await fs.rmdir(lock).catch(() => {}); }
