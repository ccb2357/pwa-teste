# Ambiente e inicialização

O roteiro único de instalação, trechos Compose/Nginx, comandos de teste, operação diária e VPS está em [instalacao-pwa-framework.md](../../instalacao-pwa-framework.md), na raiz. Este documento mantém o contrato técnico do ambiente. Na instalação local desta entrega, configurar e aplicar todos os recursos da infraestrutura antes de executar o bootstrap; código 2 indica pendências a corrigir, não uma passagem obrigatória do roteiro.

## Mapeamento observado em 2026-11-11

Este registro descreve as evidências recebidas naquela data e pode ficar desatualizado. Ao iniciar ou retomar uma análise da infraestrutura, solicitar ao responsável os arquivos atuais necessários: Compose, Dockerfile PHP-FPM, configuração principal e sites ativos do Nginx e php.ini. Não manter cópias desses arquivos no projeto.

| Elemento | Valor de referência |
| --- | --- |
| Projeto no Windows | C:\var\www\pwa-teste, confirmado pelo responsável |
| Infra no Windows | C:\var\www\infra, inferido da estrutura irmã e caminho previamente informado; confirmado pelas labels enviadas |
| Projeto interno | /var/www/pwa-teste |
| Compose compartilhado | ../infra/docker-compose.yml relativo ao projeto |
| Bind PHP/Nginx | ../:/var/www |
| Rede | infra_network, bridge, name explícito |
| PHP | Serviço php-fpm, container_name php-fpm, build ./dockerfile |
| Imagem PHP declarada | php:8.2.35-fpm |
| Composer | Copiado de composer:2 para /usr/local/bin/composer |
| Extensões adicionadas | mysqli, pdo, pdo_mysql, zip, gd, intl |
| Nginx | nginx:alpine, serviço nginx, portas 80/443 |
| Configuração principal | infra/nginx/default.conf → /etc/nginx/nginx.conf, ro |
| Sites ativos | infra/nginx/sites_local.conf → /etc/nginx/conf.d/sites_local.conf, ro |
| Includes | http inclui /etc/nginx/conf.d/*.conf |
| PHP ini | infra/php.ini → /usr/local/etc/php/conf.d/custom.ini no build |
| Fuso PHP atual | America/Sao_Paulo; Laravel usa o central, padrão UTC |
| Banco | mysql:8.0, serviço/host mysql, porta 3306, mysql_data |
| Slug / domínio local | pwa-teste / pwa-teste.localhost |
| Serviço Node | pwa-teste-node, node:22-alpine, /app, perfil dev |
| Volumes exclusivos | pwa_teste_vendor e pwa_teste_node_modules, names estáveis |
| Bancos a configurar | pwa_teste e pwa_teste_test |
| Porta dev | 127.0.0.1:5176 → 5173 |
| Porta preview | 127.0.0.1:5177 → 4173 |

A infraestrutura compartilhada permanece externa ao projeto. O SDD documenta contratos e evidências históricas; os arquivos atuais fornecidos pelo responsável fundamentam cada nova análise. Configuração declarada não comprova contêiner ativo, imagem construída, disponibilidade de porta ou mount aplicado.

Nos arquivos recebidos antes da integração da Sprint 1, não havia serviço/site/volume pwa-teste. Composer já está na imagem. O entrypoint está embutido no Dockerfile; não existe necessidade de pedir arquivo separado. Ele atualmente faz chown recursivo em /var/www e toca arquivo do uploader: preservar os demais aplicativos; o bootstrap deve ajustar permissões somente no projeto. Não reconstruir/recriar PHP-FPM sem necessidade: o serviço é compartilhado.

Minhas Finanças e Clima declaram ambos 127.0.0.1:5173; não subir todo o perfil dev. Os novos serviços usam portas distintas, sujeitas à verificação real.

## Configuração central


Versionar .env.foundation.example; cada máquina cria .env.foundation privado. Não copiar credenciais locais para VPS. Não solicitar senhas no chat.

| Campos | Validação/derivação |
| --- | --- |
| PROJECT_SLUG | Obrigatório, minúsculas/hífens, igual à pasta; divergência interrompe sem renomear |
| PROJECT_NAME | Nome público obrigatório |
| APP_ENV | Obrigatório, somente local ou production; nunca inferir pelo sistema |
| INFRA_COMPOSE_PATH | Relativo à raiz do projeto, resolver independentemente do terminal |
| CONTAINER_PROJECTS_ROOT | Raiz permitida para --project; validar caminho real e contenção, inclusive symlinks |
| DOCKER_NETWORK, PHP_SERVICE, NGINX_SERVICE | Identidade dos recursos compartilhados; nomes de serviço não são container_name presumido |
| NGINX_INTERNAL_URL | Target interno do proxy, padrão http://nginx |
| LOCAL_DOMAIN | Padrão slug.localhost; validar hostname |
| DEV_PORT, PREVIEW_PORT | Inteiros 1–65535, distintos e sem conflito real; 5173/4173 internos fixos |
| PRODUCTION_URL | Obrigatória HTTPS em production; sem domínio inventado |
| DB_HOST, DB_PORT | Host/porta existentes MySQL |
| DB_DATABASE | Padrão slug com sublinhados |
| DB_TEST_DATABASE | Vazio deriva banco principal + _test; obrigatoriamente distinto |
| DB_USERNAME, DB_PASSWORD | Conta existente, exatamente informada, inclusive root; sem geração/grants |
| APP_LOCALE | pt_BR padrão, mapear para frontend/manifest pt-BR |
| APP_TIMEZONE, DISPLAY_TIMEZONE | UTC e America/Sao_Paulo padrão; validar identificadores IANA |
| SESSION_LIFETIME | Inteiro positivo em minutos, padrão 120 |
| PWA_SHORT_NAME, PWA_DESCRIPTION | Nome curto assume PROJECT_NAME; descrição pública |
| PWA_THEME_COLOR, PWA_BACKGROUND_COLOR | Validar #RRGGBB; metadados públicos, não modificar tokens globais |

Derivar serviço slug-node, volumes slug_com_sublinhados_vendor/node_modules, cookie exclusivo, identificador manifest estável e caminhos internos pela raiz. APP_URL deriva do ambiente e debug é false em produção. Backend .env/.env.testing recebem só chaves gerenciadas; preservar outros valores e APP_KEY válida. Chave ausente é gerada uma única vez. .env.testing usa APP_ENV=testing e banco exclusivo.

Lista pública permitida: nome/slug, localidade/fuso de exibição, identidade PWA, URL/origem pública necessária, base /api/v1, portas/proxy estritamente usados pelo Vite e identificador do build. Não expor credenciais, APP_KEY, socket ou arquivo central completo em VITE_, manifest, bundle, logs ou docs.


## Implementação do executor

[scripts/bootstrap/Dockerfile](../../scripts/bootstrap/Dockerfile) usa node:22-alpine e copia Docker CLI 28.5.1 e Compose 2.40.3 da imagem docker:28.5.1-cli. Não inclui nem inicia dockerd. O parser dotenv 16.6.1 é instalado pelo package-lock próprio em /opt/foundation, antes de existir node_modules do aplicativo.

O entrypoint aceita --project absoluto e --force opcional, resolve realpath e impede escape por symlinks da raiz FOUNDATION_PROJECTS_ROOT (padrão /var/www). Executa scripts/bootstrap/index.mjs do alvo. Lógica em módulos ES; child_process com shell false e argumentos separados. Nenhum runtime é exigido no host além de Docker/Compose. O acesso ao Engine usa o socket montado; falha de permissão interrompe.

A configuração central só aceita APP_ENV local/production. Produção exige origem HTTPS sem caminho/credenciais e --force antes de instalar/configurar o backend. Argumentos não podem contradizer o central. .foundation-bootstrap.lock impede execuções concorrentes; se uma execução for encerrada abruptamente, conferir ausência de processo ativo antes de remover somente esse diretório de lock.

### Identidade Compose e mapeamento de caminhos

O bootstrap descobre o PHP por labels e mount real, sem presumir container_name. Confere com.docker.compose.project, project.working_dir e project.config_files. O primeiro arquivo deve corresponder a INFRA_COMPOSE_PATH; arquivos adicionais são preservados em ordem. A raiz bind do PHP fornece o mapa explícito host↔contêiner; sem mapa inequívoco a execução para.

Nesta infraestrutura: C:\var\www ↔ /var/www; Compose host C:\var\www\infra\docker-compose.yml ↔ /var/www/infra/docker-compose.yml; projeto Compose infra. Em Linux, o mesmo mecanismo usa a raiz real extraída de inspect. Não inferir que /var/www é bind source válido no daemon do Windows.

Dentro do executor, Compose é usado **somente para leitura/validação** com --project-name, --project-directory, arquivos efetivos e perfil dev, além de config --no-path-resolution. Não executar compose up/run para criar a pilha de dentro do executor. Operações PHP usam docker exec com IDs descobertos; a verificação de portas usa um contêiner Node temporário com bindings solicitados diretamente ao Engine. Assim não há remapeamento incorreto de binds em mutações Compose. O atalho Windows roda Compose no host, preservando projeto, diretório e arquivos descobertos.

Os blocos gerenciados em instalacao-pwa-framework.md contêm bind source host mapeado explicitamente. Não copiar esses caminhos Windows para a VPS: executar a preparação naquele ambiente para gerar os valores reais.

Conflitos de portas declaradas em outros serviços/contêineres interrompem. Portas livres são reservadas temporariamente pelo Engine usando publicação real 127.0.0.1, sem confundir bind dentro do executor com disponibilidade no host. A reserva termina antes da aplicação manual; outro processo ainda pode ocupar a porta depois. Em falha, conferir escutas/reservas no Windows ou VPS, sem mudar portas silenciosamente.

## Fases, preservação e saídas

| Código | Significado |
| --- | --- |
| 0 | Etapa backend desta release inicializada e verificada; consultar completeFoundation no estado |
| 1 | Erro de configuração/runtime/processo ou produção sem --force |
| 2 | Infraestrutura a aplicar manualmente, ou bancos inacessíveis que exigem criação manual |

Preparação: validar central, identidade, configuração Compose, serviços, rede, mounts e portas; atualizar os blocos Compose/Nginx de instalacao-pwa-framework.md sem credenciais e atualizar somente blocos documentais gerenciados. Configuração Nginx em disco é conferida e o HTTP final comprova que o site está efetivamente respondendo. Se faltarem recursos, parar antes de dependências/backend .env.

Inicialização: PHP 8.2/extensões/Composer 2; sincronizar chaves gerenciadas nos .env; ajustar apenas storage, bootstrap/cache e permissões dos .env do projeto; instalar pelo composer.lock somente se necessário; validar plataforma; conectar e criar somente bancos ausentes com a conta existente; limpar configuração em processo separado, conferir a configuração Laravel efetiva e executar app:sync. Em local, gerar .env.testing separado; em produção, não gerar esse ambiente de testes.

O marker de dependências é lido/escrito via PHP **dentro do volume vendor real**; o executor não confunde o diretório vazio do bind do host com o volume do PHP-FPM. Reexecução preserva APP_KEY válida e não reinstala dependências inalteradas. Chave existente inválida interrompe para correção explícita. Nunca migrar fresh/reset/drop, executar seeders ou alterar usuários/grants.

A conferência efetiva bloqueia valores herdados ou conexão URL/socket/read-write que desviem do central, antes de migrations. Credenciais transitam em stdin, não em argumentos/logs públicos. APP_KEY e segredos não acompanham a release.

.foundation-state.json guarda schema, identidade, hashes, fase, resultados seguros e próximo escopo; não contém credenciais. Estado anterior nunca substitui verificação de recursos reais. Alterar slug/pasta/bancos/volumes após inicializar exige plano explícito de migração. Atualizar somente saídas/blocos gerenciados; não restaurar Hello sobre produto personalizado.

## Referências oficiais

- Laravel: https://laravel.com/docs/12.x/installation
- Sanctum: https://laravel.com/docs/12.x/sanctum
- Artisan: https://laravel.com/docs/12.x/artisan
- Compose config: https://docs.docker.com/reference/cli/docker/compose/config/
- Projeto Compose: https://docs.docker.com/compose/how-tos/project-name/
- Node child_process: https://nodejs.org/docs/latest-v22.x/api/child_process.html

## Contrato dos testes

A suíte completa PHP inclui o grupo mysql, com consulta real, diagnóstico saudável, app:sync duas vezes no banco testing e falha de conexão restrita ao processo. TestingDatabaseGuard exige APP_ENV=testing, central local e MySQL com servidor/porta e DB_TEST_DATABASE esperados, distinto do principal, sem URL/socket/read-write alternativos; valida antes de traits como RefreshDatabase. O grupo mysql pode ser excluído com --exclude-group=mysql para contratos determinísticos, mantendo o guard de isolamento. Não executar testes destrutivos em produção. Testes Node de Engine/Compose são simulações e não comprovam integração real com Docker ou VPS. Resultados e limites das verificações são registrados em MEMORY.md. Comandos operacionais ficam no guia da raiz.

Os subprocessos dos testes de orquestração preservam FOUNDATION_RUNTIME_PACKAGE do executor, que aponta para /opt/foundation/package.json; o fallback executor/package.json local só é usado quando a variável não existe. A suíte não exige node_modules no bind do projeto quando executada pela imagem.

## Frontend da Sprint 2

Node 22 (>=22.12 <23), Vite 8.3.4, plugin-vue 6.0.11, Vue 3.5.45, framework7/framework7-vue 9.2.0, framework7-icons 5.0.5, lucide 1.72.0, IMask 7.6.1 e JustValidate 4.3.0. Engines/peers conferidos no registry dos pacotes. CSS exportado por framework7/css/bundle, sem sufixo .css nessa versão; ler exports da versão fixada. Sem dependência de biblioteca adicional de estilos.

frontend/.foundation.public.json é gerado por ambiente e ignorado no Git. O Vite exige esse arquivo, gera título/locale e proxy API/Sanctum/up → Nginx com Host do domínio central. Servidor interno 5173, strictPort, host true, polling 300ms; publicação no host usa DEV_PORT (5176). frontend/vite.cmd resolve Compose/serviço/caminhos reais. Nenhuma alteração do site Nginx para dist antes da Sprint 4. Build disponível para checagem da compilação; não prova PWA instalada.

Estado frontend-ready significa backend verificado e dependências npm preparadas; ainda exige iniciar Vite e validar Hello no Windows. Comandos no guia da raiz. Fila/push dependem da Sprint 5; não alterar QUEUE_CONNECTION ou gerar VAPID nesta etapa.
