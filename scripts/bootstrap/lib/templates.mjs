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
  const common = `    server_name ${host};
    root ${q(c.frontend + '/dist')};
    index index.html;
    charset utf-8;
    add_header Cache-Control "no-cache" always;

    location = /sw.js { try_files $uri =404; add_header Cache-Control "no-cache" always; add_header Service-Worker-Allowed "/"; }
    location = /manifest.webmanifest { types { application/manifest+json webmanifest; } try_files $uri =404; add_header Cache-Control "no-cache" always; }
    location = /index.html { try_files $uri =404; add_header Cache-Control "no-cache" always; }
    location /assets/ { try_files $uri =404; add_header Cache-Control "public, max-age=31536000, immutable"; }
    location ~ /\\. { deny all; }
    location ~ ^/(api|sanctum|up|status)(/|$) { rewrite ^ /index.php last; }
    location = /index.php {
        internal;
        include fastcgi_params;
        fastcgi_pass ${c.PHP_SERVICE}:9000;
        fastcgi_param SCRIPT_FILENAME ${q(c.backend + '/public/index.php')};
        fastcgi_param DOCUMENT_ROOT ${q(c.backend + '/public')};
        ${c.APP_ENV === 'production' ? 'fastcgi_param HTTPS on;' : ''}
        add_header Cache-Control "no-store" always;
    }
    location ~* \\.php(/|$) { return 404; }
    location / { try_files $uri $uri/ /index.html; }
`;
  const marker = '# PWA FOUNDATION: ' + c.PROJECT_SLUG + ' — PWA Sprint 4\n';
  if (c.APP_ENV === 'local') return marker + `server {\n    listen 80;\n${common}}\n`;
  return marker + `# Conferir certificados reais antes de aplicar.\nserver {\n    listen 80;\n    server_name ${host};\n    location /.well-known/acme-challenge/ { root /var/www/certbot; }\n    location / { return 301 https://$host$request_uri; }\n}\nserver {\n    listen 443 ssl;\n    ssl_certificate /etc/letsencrypt/live/${host}/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/${host}/privkey.pem;\n${common}}\n`;
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
export function publicConfiguration(c) {
  return {
    app: { name: c.PROJECT_NAME, slug: c.PROJECT_SLUG, locale: c.APP_LOCALE.replace('_', '-'), displayTimezone: c.DISPLAY_TIMEZONE, appUrl: c.appUrl, apiBase: '/api/v1', themeColor: c.PWA_THEME_COLOR, shortName: c.PWA_SHORT_NAME, description: c.PWA_DESCRIPTION, backgroundColor: c.PWA_BACKGROUND_COLOR },
    vite: { proxyTarget: c.NGINX_INTERNAL_URL, proxyHost: new URL(c.appUrl).host, devPort: c.DEV_PORT, previewPort: c.PREVIEW_PORT },
  };
}
export async function generate(c, d) {
  await writeAtomic(path.join(c.frontend, '.foundation.public.json'), JSON.stringify(publicConfiguration(c), null, 2) + '\n');
  const guidePath = path.join(c.root, 'instalacao-pwa-framework.md');
  const guide = await readOptional(guidePath);
  const infraBlock = /<!-- BEGIN FOUNDATION INSTALL INFRA -->[\s\S]*?<!-- END FOUNDATION INSTALL INFRA -->/;
  requireThat(infraBlock.test(guide), 'instalacao-pwa-framework.md ausente ou sem bloco gerenciado. Restaure o guia da entrega antes de executar o bootstrap.');
  await writeAtomic(guidePath, guide.replace(infraBlock, () => installationInfra(c, d)));
  const file = path.join(c.frontend, 'vite.cmd');
  await writeAtomic(file, viteCmd(c, d));
  const summary = `<!-- BEGIN FOUNDATION IDENTITY -->\n| Campo | Valor |\n| --- | --- |\n| Projeto | ${c.PROJECT_NAME.replaceAll('|', '\\|')} |\n| Slug | ${c.PROJECT_SLUG} |\n| Ambiente | ${c.APP_ENV} |\n| URL | ${c.appUrl} |\n| Dev / preview | ${c.DEV_PORT} / ${c.PREVIEW_PORT} |\n| Serviço / Compose | ${c.nodeService} / ${d.project} |\n| Volumes | ${c.vendorVolume}, ${c.modulesVolume} |\n| Bancos | ${c.DB_DATABASE}, ${c.DB_TEST_DATABASE} |\n| Fundação | 0.6.0-sprint.6 |\n<!-- END FOUNDATION IDENTITY -->`;
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
    'O executor usa docker run --rm (etapas 2 e 5); não cadastrar serviço de bootstrap no Compose.',
    'Antes de executar o bootstrap, aplique **todos os quatro itens** abaixo para o ambiente **' + c.APP_ENV + '** e o projeto **' + c.PROJECT_SLUG + '**. Não duplique entradas que já estejam corretas. Os trechos abaixo refletem a configuração central e o mapeamento deste ambiente; confira-os antes de aplicar. O restante do guia usa exemplos, que devem ser adaptados ao projeto.',
    '### 3.1 Serviço Node no Compose existente',
    'Arquivo de destino: `' + d.mapping.toHost(d.internalFiles[0]) + '`. Acrescentar o serviço ao `services` existente, sem duplicar essa chave. Inicie o Vite somente após executar o bootstrap e instalar as dependências, conforme a etapa 7.',
    '```yaml\n' + node + '\n```',
    '### 3.2 Mount vendor no PHP-FPM existente',
    'No mesmo Compose, localizar `services.' + c.PHP_SERVICE + '.volumes` e acrescentar somente a linha abaixo. Preservar os mounts atuais; não criar outro serviço PHP nem substituir sua lista de volumes.',
    '```yaml\n- ' + c.vendorVolume + ':' + c.backend + '/vendor\n```',
    '### 3.3 Declaração dos volumes ao final do Compose',
    'No mesmo arquivo, mesclar estas declarações no bloco `volumes` de nível raiz, no mesmo nível de `services` e `networks`. Se o bloco ainda não existir, criá-lo. O mount do passo anterior e esta declaração são necessários.',
    '```yaml\n' + volumes + '\n```',
    '### 3.4 Site Nginx',
    'No arquivo de sites ativo do Nginx, acrescentar o bloco abaixo preservando os outros sites. Nesta infraestrutura local, o destino é `C:\\var\\www\\infra\\nginx\\sites_local.conf`. Em produção, usar o arquivo realmente montado e conferir os certificados. O root é `frontend/dist`; somente as rotas técnicas são encaminhadas ao Laravel. Substitua o bloco anterior deste projeto, sem duplicar o server_name.',
    '```nginx\n' + nginxSnippet(c).trimEnd() + '\n```',
    '<!-- END FOUNDATION INSTALL INFRA -->',
  ].join('\n\n');
}
export function normalizeNginx(value) { return value.replace(/#[^\n]*/g, '').replace(/\s+/g, ''); }
export function siteApplied(output, c) { return normalizeNginx(output).includes(normalizeNginx(nginxSnippet(c))); }
