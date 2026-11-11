import path from 'node:path';
import { readOptional, writeAtomic } from './files.mjs';
import { requireThat } from './errors.mjs';
const q = JSON.stringify;
export function composeSnippet(c, d) {
  const front = d.mapping.toHost(c.frontend);
  return `# TRECHOS PARA INCLUSÃO MANUAL NO COMPOSE EXISTENTE; NÃO USAR COMO OVERRIDE.\n# Mesclar services/volumes existentes. PHP volumes abaixo é ADIÇÃO, não substituição.\nservices:\n    ${c.nodeService}:\n        image: node:22-alpine\n        working_dir: /app\n        volumes:\n            - type: bind\n              source: ${q(front)}\n              target: /app\n            - ${c.modulesVolume}:/app/node_modules\n        ports:\n            - "127.0.0.1:${c.DEV_PORT}:5173"\n        networks:\n            - ${c.DOCKER_NETWORK}\n        profiles:\n            - dev\n    ${c.PHP_SERVICE}:\n        volumes:\n            # ACRESCENTAR somente esta linha aos volumes já existentes:\n            - ${c.vendorVolume}:${c.backend}/vendor\nvolumes:\n    ${c.vendorVolume}:\n        name: ${c.vendorVolume}\n    ${c.modulesVolume}:\n        name: ${c.modulesVolume}\n`;
}
export function nginxSnippet(c) {
  const host = c.APP_ENV === 'production' ? new URL(c.appUrl).hostname : c.LOCAL_DOMAIN;
  const common = `    server_name ${host};\n    root ${q(c.backend + "/public")};\n    index index.php;\n    charset utf-8;\n\n    location = / { return 302 /status; }\n    location / { try_files $uri $uri/ /index.php?$query_string; }\n    location = /index.php {\n        include fastcgi_params;\n        fastcgi_pass ${c.PHP_SERVICE}:9000;\n        fastcgi_param SCRIPT_FILENAME ${q(c.backend + "/public/index.php")};\n    }\n    location ~ \\.php$ { return 404; }\n    location ~ /\\. { deny all; }\n`;
  if (c.APP_ENV === 'local') return `# PWA FOUNDATION: ${c.PROJECT_SLUG} — backend Sprint 1\nserver {\n    listen 80;\n${common}}\n`;
  return `# PWA FOUNDATION: ${c.PROJECT_SLUG} — backend Sprint 1\n# Conferir caminhos reais do certificado antes de aplicar.\nserver {\n    listen 80;\n    server_name ${host};\n    location /.well-known/acme-challenge/ { root /var/www/certbot; }\n    location / { return 301 https://$host$request_uri; }\n}\nserver {\n    listen 443 ssl;\n    ssl_certificate /etc/letsencrypt/live/${host}/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/${host}/privkey.pem;\n${common}    fastcgi_param HTTPS on;\n}\n`;
}
export function viteCmd(c, d) {
  const cmdPath = value => {
    const relative = path.relative(c.frontend, value).split(path.sep).join('\\');
    requireThat(!/["\r\n]/.test(relative), 'Caminho inválido para atalho CMD.');
    return '%~dp0' + relative.replaceAll('%', '%%');
  };
  const flags = `-p ${d.project} --project-directory "${cmdPath(d.directory)}" ${d.internalFiles.map(file => `-f "${cmdPath(file)}"`).join(' ')} --profile dev`;
  return `@echo off\r\nsetlocal DisableDelayedExpansion\r\nif /I "%~1"=="dev" goto dev\r\nif /I "%~1"=="build" goto build\r\necho Use: vite dev ou vite build\r\nexit /b 1\r\n:dev\r\ndocker compose ${flags} run --rm --no-deps --service-ports ${c.nodeService} npm run dev\r\nexit /b %errorlevel%\r\n:build\r\ndocker compose ${flags} run --rm --no-deps ${c.nodeService} npm run build\r\nexit /b %errorlevel%\r\n`;
}
export async function generate(c, d) {
  const guidePath = path.join(c.root, 'instalacao-pwa-framework.md');
  const guide = await readOptional(guidePath);
  const infraBlock = /<!-- BEGIN FOUNDATION INSTALL INFRA -->[\s\S]*?<!-- END FOUNDATION INSTALL INFRA -->/;
  requireThat(infraBlock.test(guide), 'instalacao-pwa-framework.md ausente ou sem bloco gerenciado. Restaure o guia da entrega antes de executar o bootstrap.');
  await writeAtomic(guidePath, guide.replace(infraBlock, () => installationInfra(c, d)));
  const file = path.join(c.frontend, 'vite.cmd');
  await writeAtomic(file, viteCmd(c, d));
  const summary = `<!-- BEGIN FOUNDATION IDENTITY -->\n| Campo | Valor |\n| --- | --- |\n| Projeto | ${c.PROJECT_NAME.replaceAll('|', '\\|')} |\n| Slug | ${c.PROJECT_SLUG} |\n| Ambiente | ${c.APP_ENV} |\n| URL | ${c.appUrl} |\n| Dev / preview | ${c.DEV_PORT} / ${c.PREVIEW_PORT} |\n| Serviço / Compose | ${c.nodeService} / ${d.project} |\n| Volumes | ${c.vendorVolume}, ${c.modulesVolume} |\n| Bancos | ${c.DB_DATABASE}, ${c.DB_TEST_DATABASE} |\n| Fundação | 0.1.0-sprint.1 |\n<!-- END FOUNDATION IDENTITY -->`;
  const readmePath = path.join(c.root, 'README.md'), readme = await readOptional(readmePath);
  const block = /<!-- BEGIN FOUNDATION IDENTITY -->[\s\S]*?<!-- END FOUNDATION IDENTITY -->/;
  await writeAtomic(readmePath, block.test(readme) ? readme.replace(block, () => summary) : readme.trimEnd() + '\n\n' + summary + '\n');
}
export function installationInfra(c, d) {
  const compose = composeSnippet(c, d);
  const phpStart = compose.indexOf(`    ${c.PHP_SERVICE}:\n`);
  const volumesStart = compose.indexOf('\nvolumes:\n');
  const node = compose.slice(compose.indexOf('services:\n'), phpStart).trimEnd();
  const volumes = compose.slice(volumesStart + 1).trimEnd();
  return [
    '<!-- BEGIN FOUNDATION INSTALL INFRA -->',
    '## 3. Preparar serviço Node, mount, volumes e site',
    'Antes de executar o bootstrap, aplique **todos os quatro itens** abaixo para o ambiente **' + c.APP_ENV + '** e o projeto **' + c.PROJECT_SLUG + '**. Não duplique entradas que já estejam corretas. Os valores desta entrega estão prontos para pwa-teste local; se o central usar outros nomes, caminhos ou portas, ajuste os trechos para esse ambiente antes de aplicá-los. O bootstrap atualiza este bloco ao conferir o ambiente, preservando o restante do guia.',
    '### 3.1 Serviço Node no Compose existente',
    'Arquivo de destino: `' + d.mapping.toHost(d.internalFiles[0]) + '`. Acrescentar o serviço ao `services` existente, sem duplicar essa chave. O frontend será implementado na Sprint 2; não iniciar o serviço agora.',
    '```yaml\n' + node + '\n```',
    '### 3.2 Mount vendor no PHP-FPM existente',
    'No mesmo Compose, localizar `services.' + c.PHP_SERVICE + '.volumes` e acrescentar somente a linha abaixo. Preservar os mounts atuais; não criar outro serviço PHP nem substituir sua lista de volumes.',
    '```yaml\n- ' + c.vendorVolume + ':' + c.backend + '/vendor\n```',
    '### 3.3 Declaração dos volumes ao final do Compose',
    'No mesmo arquivo, mesclar estas declarações no bloco `volumes` de nível raiz, no mesmo nível de `services` e `networks`. Se o bloco ainda não existir, criá-lo. O mount do passo anterior e esta declaração são necessários.',
    '```yaml\n' + volumes + '\n```',
    '### 3.4 Site Nginx',
    'No arquivo de sites ativo do Nginx, acrescentar o bloco abaixo preservando os outros sites. Nesta infraestrutura local, o destino é `C:\\var\\www\\infra\\nginx\\sites_local.conf`. Em produção, usar o arquivo realmente montado e conferir os certificados. O root desta release é `backend/public`; não apontar para `frontend/dist` antes da Sprint 4.',
    '```nginx\n' + nginxSnippet(c).trimEnd() + '\n```',
    '<!-- END FOUNDATION INSTALL INFRA -->',
  ].join('\n\n');
}
export function normalizeNginx(value) { return value.replace(/#[^\n]*/g, '').replace(/\s+/g, ''); }
export function siteApplied(output, c) { return normalizeNginx(output).includes(normalizeNginx(nginxSnippet(c))); }
