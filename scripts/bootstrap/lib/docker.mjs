import path from 'node:path';
import fs from 'node:fs/promises';
import { docker, jsonOutput } from './process.mjs';
import { requireThat } from './errors.mjs';
const labels = x => x.Config?.Labels || {};
const hostPath = value => /^[A-Za-z]:[\\/]/.test(value) ? path.win32 : path.posix;
export function mapPath(value, from, to) {
  const api = hostPath(from);
  const relative = api.relative(from, value);
  requireThat(relative !== '..' && !relative.startsWith('..' + api.sep) && !api.isAbsolute(relative), 'Caminho fora do mount mapeado; configure a raiz compartilhada corretamente.');
  return hostPath(to).join(to, ...relative.split(/[\\/]/));
}
export function mappedPaths(php, c) {
  const mounts = php.Mounts?.filter(m => m.Type === 'bind' && m.Destination === c.CONTAINER_PROJECTS_ROOT);
  requireThat(mounts?.length === 1, `PHP deve montar a raiz ${c.CONTAINER_PROJECTS_ROOT} explicitamente; mapeamento host/contêiner ausente.`);
  const mount = mounts[0];
  requireThat(!/[\r\n,]/.test(mount.Source), 'Raiz host com separador não suportado; ajuste o mapeamento explicitamente.');
  return {
    hostRoot: mount.Source, internalRoot: mount.Destination,
    toHost: value => mapPath(value, mount.Destination, mount.Source),
    toInternal: value => mapPath(value, mount.Source, mount.Destination),
  };
}
export async function containers(filter = []) {
  const ids = (await docker(['ps', '-aq', ...filter], { label: 'Listagem de contêineres' })).stdout.trim().split(/\s+/).filter(Boolean);
  return ids.length ? jsonOutput(await docker(['inspect', ...ids], { label: 'Inspeção de contêineres' }), 'Inspeção Docker') : [];
}
export async function discover(c) {
  await docker(['version', '--format', '{{json .Server.Version}}'], { label: 'Acesso ao Docker Engine' });
  const composeVersion = (await docker(['compose', 'version', '--short'], { label: 'Plugin Docker Compose' })).stdout.trim();
  const candidates = await containers(['--filter', `label=com.docker.compose.service=${c.PHP_SERVICE}`]);
  const matches = [];
  for (const php of candidates.filter(x => labels(x)['com.docker.compose.oneoff'] !== 'True')) {
    try {
      const mapping = mappedPaths(php, c);
      const files = (labels(php)['com.docker.compose.project.config_files'] || '').split(',').filter(Boolean);
      if (files.length && mapping.toInternal(files[0]) === c.composeFile) matches.push({ php, mapping, files });
    } catch { /* Other Compose stacks are not this infrastructure. */ }
  }
  requireThat(matches.length === 1, 'Não foi possível identificar unicamente o PHP/Compose pelo mount real e INFRA_COMPOSE_PATH. Verifique os serviços existentes e o mapeamento de caminhos.');
  const { php, mapping, files } = matches[0];
  const project = labels(php)['com.docker.compose.project'];
  const hostDir = labels(php)['com.docker.compose.project.working_dir'];
  requireThat(project && /^[a-z0-9][a-z0-9_-]*$/.test(project) && hostDir, 'Labels de identidade Compose ausentes/inválidas; não será criada outra pilha.');
  const directory = mapping.toInternal(hostDir);
  const internalFiles = files.map(mapping.toInternal);
  for (const file of internalFiles) await fs.access(file);
  const all = await containers(['--filter', `label=com.docker.compose.project=${project}`]);
  const nginx = all.filter(x => labels(x)['com.docker.compose.service'] === c.NGINX_SERVICE && labels(x)['com.docker.compose.oneoff'] !== 'True');
  requireThat(nginx.length === 1, 'Serviço Nginx não identificado unicamente na infraestrutura compartilhada.');
  requireThat(php.State?.Running && nginx[0].State?.Running, 'PHP-FPM/Nginx precisam estar ativos; inicie apenas os serviços necessários.', 2);
  const prefix = ['compose', '--project-name', project, '--project-directory', directory, ...internalFiles.flatMap(f => ['-f', f]), '--profile', 'dev'];
  // Read-only Compose. Paths stay unexpanded; host paths are passed directly to Engine when needed.
  const config = jsonOutput(await docker([...prefix, 'config', '--format', 'json', '--no-path-resolution'], { cwd: directory, label: 'Validação Compose compartilhado' }), 'Compose config');
  for (const object of [php, nginx[0]]) requireThat(object.NetworkSettings?.Networks?.[c.DOCKER_NETWORK], `${c.DOCKER_NETWORK} não está aplicada a PHP/Nginx.`, 2);
  return { php, nginx: nginx[0], project, directory, hostDir, files, internalFiles, mapping, config, composeVersion, prefix, all };
}
export function resolveBind(source, d) {
  if (/^[A-Za-z]:[\\/]/.test(source) || path.posix.isAbsolute(source)) return source;
  return hostPath(d.hostDir).resolve(d.hostDir, source);
}
export function sameHost(a, b) {
  const api = hostPath(a);
  return api === path.win32 ? api.normalize(a).toLowerCase() === api.normalize(b).toLowerCase() : api.normalize(a) === api.normalize(b);
}
export function infraProblems(c, d) {
  const problems = [], services = d.config.services || {}, volumes = d.config.volumes || {};
  const node = services[c.nodeService];
  if (!node) problems.push(`Adicionar serviço ${c.nodeService}.`);
  else {
    if (node.image !== 'node:22-alpine' || node.working_dir !== '/app') problems.push('Corrigir imagem/working_dir do serviço Node.');
    if (!node.profiles?.includes('dev')) problems.push('Associar serviço Node ao perfil dev.');
    if (!Object.hasOwn(node.networks || {}, c.DOCKER_NETWORK)) problems.push('Associar Node à rede compartilhada.');
    if (!node.volumes?.some(v => v.type === 'bind' && v.target === '/app' && sameHost(resolveBind(v.source, d), d.mapping.toHost(c.frontend)))) problems.push('Corrigir bind mount frontend → /app.');
    if (!node.volumes?.some(v => v.type === 'volume' && v.source === c.modulesVolume && v.target === '/app/node_modules')) problems.push('Corrigir volume exclusivo node_modules.');
    if (!node.ports?.some(p => +p.target === 5173 && +p.published === c.DEV_PORT && p.host_ip === '127.0.0.1')) problems.push('Corrigir publicação local da porta dev.');
  }
  for (const name of [c.vendorVolume, c.modulesVolume]) if (volumes[name]?.name !== name) problems.push(`Declarar volume ${name} com name explícito.`);
  if (!services[c.PHP_SERVICE]?.volumes?.some(v => v.type === 'volume' && v.source === c.vendorVolume && v.target === path.join(c.backend, 'vendor'))) problems.push('Adicionar vendor ao PHP-FPM no Compose.');
  if (!d.php.Mounts?.some(m => m.Type === 'volume' && m.Name === c.vendorVolume && m.Destination === path.join(c.backend, 'vendor'))) problems.push('Aplicar mount vendor no contêiner PHP-FPM (recriação manual).');
  const projectHost = d.mapping.toHost(c.root);
  for (const service of [d.php, d.nginx]) {
    const mount = service.Mounts?.find(m => m.Type === 'bind' && m.Destination === c.CONTAINER_PROJECTS_ROOT);
    if (!mount || !sameHost(mount.Source, d.mapping.hostRoot) || !mount.RW && service === d.php) problems.push('Corrigir raiz de projetos no PHP/Nginx.');
    const file = path.join(c.backend, 'public/index.php');
    const effective = service.Mounts?.filter(m => file === m.Destination || file.startsWith(m.Destination + '/')).sort((a, b) => b.Destination.length - a.Destination.length)[0];
    if (!effective || effective.Type !== 'bind' || !sameHost(mapPath(file, effective.Destination, effective.Source), d.mapping.toHost(file))) problems.push('Mount sobreposto desvia o código backend; corrigir antes de instalar.');
  }
  // A resource with the desired name must not already belong to another product/stack.
  for (const [name, service] of Object.entries(services)) {
    if (name === c.nodeService) continue;
    if (service.volumes?.some(v => v.source === c.modulesVolume || (name !== c.PHP_SERVICE && (v.source === c.vendorVolume || v.target === path.join(c.backend, 'vendor'))))) problems.push(`Recurso do projeto conflita com serviço ${name}; revisar manualmente.`);
    if (service.ports?.some(p => [c.DEV_PORT, c.PREVIEW_PORT].includes(+p.published))) problems.push(`Porta configurada em outro serviço: ${name}.`);
  }
  requireThat(projectHost, 'Mapeamento do projeto ausente.');
  return problems;
}
export async function phpExec(c, d, argv, input, label = 'PHP') {
  return docker(['exec', '-i', '--workdir', c.backend, d.php.Id, ...argv], { input, label, timeout: 900000 });
}
export async function checkPorts(c, d) {
  const running = await containers(['--filter', 'status=running']);
  const free = [];
  for (const port of [c.DEV_PORT, c.PREVIEW_PORT]) {
    const owners = running.filter(x => Object.values(x.NetworkSettings?.Ports || {}).flat().some(p => p && +p.HostPort === port));
    requireThat(owners.every(x => labels(x)['com.docker.compose.project'] === d.project && labels(x)['com.docker.compose.service'] === c.nodeService), `Porta ${port} ocupada por outro contêiner.`);
    if (!owners.length) free.push(port);
  }
  if (free.length) {
    // Ask Engine to allocate the actual host bindings. A bind inside this executor is NOT a host check.
    await docker(['run', '--rm', '--network', c.DOCKER_NETWORK, ...free.flatMap(p => ['--publish', `127.0.0.1:${p}:1`]), 'node:22-alpine', 'node', '-e', 'process.exit(0)'], { label: 'Reserva temporária das portas no host (verifique conflitos/reservas do Windows se falhar)', timeout: 300000 });
  }
}
