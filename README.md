# PWA Framework — fundação técnica reutilizável

Instalação e operação: [instalacao-pwa-framework.md](instalacao-pwa-framework.md). Estado real, evidências e próximo passo: [MEMORY.md](MEMORY.md).

**Operação:** comandos e trechos Compose/Nginx/VAPID/fila em [instalacao-pwa-framework.md](instalacao-pwa-framework.md). Bootstrap atualiza blocos gerenciados; aplicação da infra é manual.

Fundação reutilizável com Framework7 Vue, Laravel/MySQL, PWA e Web Push, configuração por ambiente e documentação SDD. Construir/validar a base uma vez; derivar produtos independentes.

**Finalidade:** especificação para construir e validar a fundação. O plano não presume etapas executadas; a IA deve conferir o código e registrar progresso/evidências em MEMORY.md.

## 0. Construir uma vez, configurar e inicializar após cada clone

**Construir a fundação uma vez pelas sprints da seção 14.** Cada produto recebe código pronto por clone/cópia versionada e identificação pelo arquivo central; não repetir sprints, recriar Laravel/Vite ou exigir o nome no chat.

### Fluxo de reutilização

1. Clonar uma release pronta na pasta do novo projeto.
2. Copiar .env.foundation.example para .env.foundation na raiz e preencher os dados locais.
3. Preparar o executor e todos os trechos de integração do Compose/Nginx, seguindo instalacao-pwa-framework.md. Conferir nomes, caminhos e portas com o central e a infraestrutura atual antes de aplicar; não copiar valores de outro produto.
4. O responsável aplica manualmente todas as alterações, valida o Compose, disponibiliza o mount PHP e valida/recarrega o Nginx. Não executar o bootstrap local antes dessa preparação.
5. Executar pwa-foundation-bootstrap: conferir infra, atualizar trechos e inicializar. Código 2 exige corrigir/aplicar pendências e repetir; frontend/build/push são integrados nas respectivas sprints.

**Entregar o bootstrap funcional, não apenas instruções.** Conferir o código existente e completar `scripts/bootstrap/index.mjs`, módulos, templates, Dockerfile e entrypoint para Windows/Linux via Docker. O serviço é `pwa-foundation-bootstrap`. Clones executam essa base pronta; `app:sync` continua restrito a caches e migrations.

**Ordem de implementação:**

- **Sprint 0:** contrato e mapeamento da infraestrutura.
- **Sprint 1:** executor, bootstrap, backend e bancos.
- **Sprint 2:** frontend Framework7 Vue e Hello.
- **Sprint 3:** design system.
- **Sprint 4:** build e PWA com `injectManifest`.
- **Sprint 5:** Push Notifications.
- **Sprint 6:** testes finais, clones, reexecução e portabilidade local/produção.

Cada etapa entrega código, atualiza o SDD e registra resultados/pendências em MEMORY.md. Alterações manuais da infraestrutura exigem trechos prontos no guia de instalação.

### Arquivo central: .env.foundation

`.env.foundation` é a entrada privada de cada projeto/ambiente. Versionar apenas o exemplo sem segredos. Ignorar no Git o central, `.foundation-state.json` e os `.env` privados derivados; preservar os exemplos. Localhost e produção mantêm configurações próprias.

Modelo inicial:

```dotenv
# Identidade: slug deve corresponder ao nome da pasta clonada
PROJECT_SLUG=meu-projeto
PROJECT_NAME="Meu Projeto"
APP_ENV=local

# Caminhos relativos à raiz do projeto e infraestrutura compartilhada
INFRA_COMPOSE_PATH=../infra/docker-compose.yml
CONTAINER_PROJECTS_ROOT=/var/www
DOCKER_NETWORK=infra_network
PHP_SERVICE=php-fpm
NGINX_SERVICE=nginx
NGINX_INTERNAL_URL=http://nginx

# Acesso local e produção
LOCAL_DOMAIN=meu-projeto.localhost
DEV_PORT=5176
PREVIEW_PORT=5177
PRODUCTION_URL=

# MySQL: usar exatamente a conta existente informada
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=meu_projeto
DB_TEST_DATABASE=meu_projeto_test
DB_USERNAME=root
DB_PASSWORD=""

# Regionalização e sessão
APP_LOCALE=pt_BR
APP_TIMEZONE=UTC
DISPLAY_TIMEZONE=America/Sao_Paulo
SESSION_LIFETIME=120

# Identidade pública da PWA
PWA_SHORT_NAME="Meu Projeto"
PWA_DESCRIPTION="Descrição do aplicativo"
PWA_THEME_COLOR="#007aff"
PWA_BACKGROUND_COLOR="#ffffff"

# Web Push (Sprint 5)
PUSH_ENABLED=false
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

| Grupo | Regra de resolução |
|---|---|
| Identidade | PROJECT_SLUG obrigatório, em minúsculas e hífens, igual ao nome da pasta; PROJECT_NAME é o nome de exibição. Se houver divergência, interromper e orientar ajuste explícito, sem renomear silenciosamente. |
| Raiz do projeto | Diretório que contém .env.foundation; detectar automaticamente. Caminhos relativos são resolvidos a partir dele, independentemente do diretório do terminal. |
| Infraestrutura | Padrões do modelo são ajustáveis à infraestrutura real. PHP_SERVICE/NGINX_SERVICE são nomes de serviços Compose, sem presumir container_name igual. A raiz interna e os mounts precisam corresponder ao mapeamento efetivo. |
| Acesso | LOCAL_DOMAIN pode assumir <slug>.localhost; DEV_PORT e PREVIEW_PORT devem ser válidas, diferentes e disponíveis para o projeto. Portas internas 5173/4173 e bind local 127.0.0.1 são padrões fixos da fundação. |
| Ambiente | APP_ENV aceita local ou production; produção exige PRODUCTION_URL HTTPS. Derivar APP_URL e modo debug do ambiente, com debug desativado em produção. Domínio público nunca é inventado. |
| Bancos | DB_DATABASE pode assumir o slug com sublinhados; DB_TEST_DATABASE vazio assume <DB_DATABASE>_test. São dois bancos distintos no mesmo servidor, com o mesmo usuário/senha informados; jamais criar usuários ou gerar senhas. |
| Regionalização | APP_LOCALE, APP_TIMEZONE, DISPLAY_TIMEZONE e SESSION_LIFETIME têm os padrões do modelo. Mapear idioma para o formato necessário no frontend/manifest; preservar a distinção entre instantes e datas civis. |
| PWA | PROJECT_NAME define nome principal/curto; descrição/cores seguem o modelo e a identidade aprovada. |
| Push | PUSH_ENABLED=false por padrão; VAPID por aplicativo/ambiente, com chave privada preservada fora do Git. Validação/preparação conforme seção 5. |

Derivar do slug o serviço `<slug>-node`, volumes `<slug_com_sublinhados>_vendor/node_modules`, cookie exclusivo e identidade do manifest. Derivar caminhos, mounts e origens stateful da configuração e infraestrutura reais, sem edição duplicada. Exemplo: pwa-teste → pwa-teste-node, pwa_teste_vendor, /var/www/pwa-teste/backend.

Design system controla tokens/estilos; manifests/lockfiles fixam versões; metadados identificam a release. Cores do manifest seguem a identidade aprovada. Gerar e preservar APP_KEY por aplicativo; a release modelo não contém chaves preenchidas.

### Execução portátil em Node.js pelo Docker

Implementar o bootstrap em JavaScript ES modules com Node 22 no Docker. O host Windows/Linux precisa apenas de Docker Engine/Desktop e Compose; não exigir Node, PHP, Composer ou npm no host.

Antes de analisar a infraestrutura, solicitar os arquivos atuais e confirmar Composer no PHP-FPM. Não arquivar cópias nem usar o serviço Node de outro produto.

Executar **pwa-foundation-bootstrap** sob demanda no Compose compartilhado, independente de `<slug>-node`. Entregar sua inclusão manual na Sprint 1. Não criar outro Compose nem daemon de bootstrap em produção.

Contrato obrigatório do executor a implementar:

- Imagem baseada em node:22-alpine, com Docker CLI **e plugin Docker Compose** disponíveis e compatíveis; a imagem Node pura não inclui essas ferramentas. Entregar Dockerfile e comandos de build, fixando as versões efetivas após validação.
- Montar projetos/infra e disponibilizar scripts, central e Compose. `--project` executa o index.mjs do alvo, restrito à raiz configurada e sem dependência de outro produto.
- Acesso ao Docker Engine existente pelo socket configurado e permissões necessárias, sem Docker-in-Docker. Validar o funcionamento no Docker Desktop em Windows e no Linux; não pressupor que o socket conceda acesso sem testar.
- Preservar projeto Compose, perfis e arquivos reais. Mapear paths internos aos binds do host pelo mount efetivo; tratar equivalência Docker Desktop/Windows. Não enviar /var/www cegamente ao daemon nem criar segunda pilha. Sem mapeamento inequívoco, interromper.
- Usar node:path/node:url e child_process com argumentos separados/shell desativado. Preservar espaços/aspas/caracteres especiais; não depender de shell do host nem interpolar credenciais.
- Carregar dotenv como dados usando parser disponível antes da instalação do frontend. Qualquer dependência do executor deve estar fixada e instalada na imagem/lockfile próprio do executor; ele não pode depender do node_modules do aplicativo que ainda está sendo preparado.
- Saídas: 0 validado, 1 erro, 2 ação manual pendente. Propagar códigos e estado sem segredos. Conferir portas no host/Engine; porta livre dentro do executor não comprova disponibilidade no Windows/VPS.

Na pasta infra, usar CMD no Windows ou terminal Linux; adaptar a raiz interna e integrar antes o executor:

```text
docker compose run --rm pwa-foundation-bootstrap --project /var/www/meu-projeto
```

`--project` localiza o central e o index.mjs do alvo; adaptar o caminho ao mount real. Implementar bootstrap, frontend e push nas etapas previstas. Comandos concretos ficam em instalacao-pwa-framework.md.

### Localhost, primeira instalação na VPS e atualizações

**Ambiente vem apenas de APP_ENV: local ou production.** Ausência, valor inválido ou argumento contraditório interrompem a execução. Não inferir por sistema operacional, hostname, IP, domínio ou Docker, nem assumir local silenciosamente.

| Regra | Localhost | VPS/produção |
|---|---|---|
| APP_ENV | local | production |
| URL efetiva do Laravel | Derivada de LOCAL_DOMAIN | PRODUCTION_URL obrigatória, HTTPS |
| APP_DEBUG derivado | true | false |
| Bancos e credenciais | Configuração local | Configuração própria de produção |
| Web Push/VAPID | Chaves/inscrições locais ou de teste | Chaves/inscrições próprias, HTTPS e fila operacional |
| Sessão/Sanctum/CSRF | Origens locais e portas efetivamente utilizadas | Domínio HTTPS efetivo; cookies seguros |
| Testes destrutivos | Apenas no ambiente testing isolado e banco exclusivo | Bloqueados |
| Migrations | Pelo app:sync | Pelo app:sync, com --force explicitamente informado |

Cada máquina mantém central/estado privados fora do Git. `git pull` deve preservá-los; schemas novos apontam campos ausentes sem copiar valores do exemplo. Evidências locais não validam a VPS.

Exemplo local, mantendo os demais campos do modelo preenchidos:

```dotenv
APP_ENV=local
LOCAL_DOMAIN=meu-projeto.localhost
PRODUCTION_URL=
```

Exemplo na VPS, com domínio real e demais valores próprios daquele ambiente:

```dotenv
APP_ENV=production
PRODUCTION_URL=https://meu-projeto.com.br
```

**Primeira publicação na VPS, inclusive no meio do desenvolvimento:**

1. Mapear Docker/Compose, mounts e serviços atuais da VPS; integrar o executor ausente.
2. Clonar/atualizar o aplicativo mantendo slug/pasta; sem recriar Laravel/Vite ou repetir sprints.
3. Criar central próprio na VPS: production, URL HTTPS, caminhos/serviços e credenciais; VAPID próprias quando habilitado.
4. Preparar/aplicar os trechos Compose/Nginx, serviços e certificado reais. Se o bootstrap gerar divergências, corrigir manualmente e validar antes de retomar.
5. Executar bootstrap: lockfiles, configuração, APP_KEY ausente, bancos permitidos, build e validação. Produção exige --force explícito para migrations; sem ele, não declarar conclusão.
6. Registrar versão/evidências/pendências; sem HTTPS/integração não há aceite de publicação.

Exemplo de reexecução autorizando migrations em produção, com o executor já integrado:

```text
docker compose run --rm pwa-foundation-bootstrap --project /var/www/meu-projeto --force
```

**Atualizações:** seguir backup/publicação da seção 19, aplicar `git pull` e repetir bootstrap (`--force` em produção). Comparar lockfiles/estado, reconstruir só o necessário e aplicar migrations pendentes. Infra divergente retorna 2 até aplicação manual. Preservar chaves APP_KEY/VAPID, dados, volumes e personalizações; não restaurar Hello sobre o produto. Transferência de banco exige exportação/importação separada.

`--force` autoriza apenas migrations em produção, não alterações automáticas de infra ou operações destrutivas. Backup/compatibilidade/recuperação seguem a seção 19.

### Contrato do bootstrap após o clone

**Preparação, disponível antes do serviço Node do projeto existir:**

- Versionar index.mjs, módulos, templates e executor em scripts/bootstrap/. Usar pwa-foundation-bootstrap sem Node do produto/runtime do host. Sem Compose separado; atalhos opcionais não contêm lógica própria.
- Validar arquivo central, sintaxe, valores obrigatórios, portas, identificadores, cores, caminhos e Docker/Compose. Ler dotenv como dados, sem executar o conteúdo como script; tratar espaços, aspas e caracteres especiais de senhas corretamente, sem imprimi-las ou passá-las em argumentos visíveis.
- Detectar conflitos de nomes/portas com outros projetos, distinguindo recursos já pertencentes ao clone. Comparar a configuração desejada com o estado efetivo, sem confiar somente em marcadores de execuções anteriores.
- Gerar no guia trechos mínimos de Node/mounts/volumes/Nginx sem credenciais, reutilizando recursos. O responsável aplica, valida, recria apenas serviços afetados e recarrega Nginx.
- Se faltarem alterações ou serviços, terminar com estado explícito de pendência e código distinto de sucesso/falha, documentado em 04-ambiente.md. Não prosseguir à instalação nem declarar pronto. Se a infraestrutura já estiver correta, avançar na mesma execução.

**Inicialização, após a infraestrutura estar disponível:**

- Conferir config Compose, serviços, runtime PHP/Composer, mounts vendor/node_modules, rede, portas e encaminhamento Nginx. Não iniciar/recriar serviços compartilhados ou alterar seus arquivos automaticamente.
- Instalar dependências PHP e JavaScript pelos lockfiles no PHP-FPM/Node configurados, somente quando ausentes ou desatualizadas; não recriar os esqueletos. Preparar permissões restritas ao projeto.
- Derivar .env/.env.testing do central, preservando configurações próprias e APP_KEY. Na Sprint 5, integrar validação/geração VAPID conforme seção 5, sem envios no bootstrap. Atualizar só blocos gerenciados, sem sobrescrever o produto.
- Frontend, Vite, manifest e atalhos recebem apenas campos públicos permitidos. Central/credenciais ficam no backend, nunca em VITE_, bundle ou diretório público; VAPID pública vem pela API autenticada.
- Usar a conta MySQL informada, inclusive root. Criar só bancos ausentes se permitido; caso contrário, pedir criação manual e parar. Não criar usuários, gerar/trocar senhas ou alterar grants.
- Testes destrutivos exigem APP_ENV=testing, conexão/servidor corretos e DB_DATABASE=DB_TEST_DATABASE central, distinto do principal. Bloquear fallback ao principal mesmo com credenciais iguais.
- app:sync limpa caches e aplica migrations pendentes no principal. Banco testing só pelo fluxo isolado. Bootstrap não executa fresh/reset/drop/seeders; produção exige --force nas migrations e proíbe testes destrutivos.
- Validar build/Nginx, /up, /status e API sem HTML indevido. Hello inicial em /; informar URL/resultados/pendências. Conferir cookies/CSRF nas origens reais. Não restaurar Hello sobre produto personalizado; sucesso não comprova aparelho real.

**Reexecução:** preservar configuração, chaves, dados, volumes e personalizações; não duplicar recursos ou reinstalar dependências inalteradas. Registrar estado sem segredos em `.foundation-state.json`, parar no primeiro erro e retomar pelo estado real. Mudanças de slug/pasta/bancos/volumes exigem migração explícita. Não imprimir senhas ou o central bruto.

Distribuir código, templates, lockfiles, documentação e recursos públicos. Excluir `.env` preenchidos, APP_KEY/VAPID privadas, bancos, subscriptions, sessões, caches, dependências e estado de outro projeto. Atualizar só blocos gerenciados; operação no guia, progresso no MEMORY.

### Construção inicial e mudanças de infraestrutura

Antes de nova análise/alteração de infraestrutura, pedir os arquivos atuais da tabela. Não confiar em snapshots nem guardar cópias, mesmo sanitizadas. Reutilizar os arquivos enviados na mesma sessão enquanto não houver mudança.

| Arquivo solicitado | O que conferir |
|---|---|
| `infra/docker-compose.yml` ou arquivo Compose realmente utilizado | Serviços, perfis, portas, redes, mounts, volumes, imagens e nomes existentes |
| Dockerfile do PHP-FPM, com o nome/caminho real | Versão PHP, extensões, Composer incorporado e processo de build |
| Configuração principal Nginx, por exemplo `infra/nginx/default.conf` montada como `nginx.conf` | Bloco http, includes, limites e relação com os arquivos de sites |
| Arquivo de sites Nginx ativo, por exemplo `infra/nginx/sites_local.conf` | Hosts existentes, roots, encaminhamento ao PHP-FPM e rotas |
| `php.ini` utilizado pela imagem | Timezone, limites, logs e configuração de extensões |

Pedir também o entrypoint e outros arquivos incluídos **somente se forem externos e necessários à análise**. Se o entrypoint estiver embutido no Dockerfile, não solicitar um arquivo separado. Confirmar a localização real das pastas `infra/` e do projeto; não presumir que um nome de arquivo determina seu destino no contêiner.

Solicitar Compose, Dockerfile PHP-FPM, Nginx principal/sites ativos, php.ini e localização de infra/projeto, com estrutura/caminhos preservados e segredos removidos. Não pedir `.env`, senhas, tokens ou chaves privadas.

A documentação inicial pode avançar enquanto esses arquivos são reunidos, registrando as lacunas. Não inventar infraestrutura, criar uma pilha independente ou declarar a Sprint 0 da construção concluída sem realizar seu mapeamento.

### Análise e validação inicial da infraestrutura

1. Mapear os arquivos em conjunto: origem e destino dos mounts, rede, nomes de serviços/contêineres, portas, volumes declarados e utilizados, includes do Nginx, configuração PHP e dependências já incorporadas à imagem.
2. Verificar o que já existe para o novo projeto. Não duplicar serviço Node, site, volume ou Composer. Se Composer já estiver na imagem, conferir e usar esse executável; o contêiner temporário é alternativa quando necessário.
3. Preparar somente as alterações necessárias e apresentar os trechos exatos e sua localização. **Neste fluxo, o responsável aplica manualmente as mudanças na infraestrutura compartilhada, salvo instrução explícita em contrário.** Não apresentar uma alteração preparada como já aplicada.
4. Pedir em um bloco: Compose config --quiet/ps -a, PHP -v/-m, Composer --version, nginx -t e portas no host. Adaptar pasta/serviços/shell e registrar comandos no guia.
5. Iniciar apenas serviços ausentes/parados e repetir checks falhos. Não subir todo perfil dev nem apagar volumes; outros projetos podem disputar portas.
6. Separar configuração declarada, alteração aplicada pelo responsável, validação relatada e teste executado pelo agente. `config --quiet` não comprova contêiner recriado, mount efetivo ou banco conectado; conferir o mount vendor antes da instalação e os demais recursos antes de seu primeiro uso.
7. Contratos/mapeamento no SDD; versões/evidências/pendências no MEMORY. Sem cópias da infra; pedir fontes atuais na próxima análise. Trechos próprios de integração no guia.

Incluir em AGENTS.md/RULES.md a exigência de arquivos atuais para nova análise de infraestrutura; histórico e cópias arquivadas não os substituem.

## 1. Stack tecnológica

| Camada | Tecnologia e finalidade |
|---|---|
| Interface | Framework7 **9.2.0** com a integração oficial **framework7-vue**, para componentes e navegação com foco mobile |
| Framework frontend | **Vue 3**, usando Single-File Components (.vue), Composition API e script setup em JavaScript |
| Linguagem frontend | JavaScript com módulos ES e templates Vue, sem TypeScript |
| Estilos/layout | CSS e grid responsivo oficiais do Framework7, tokens vinculados às suas variáveis e CSS compartilhado para composições próprias |
| Ícones | Framework7 Icons **5.0.5** e Lucide Icons, pelo pacote **lucide** |
| Tipografia | Nunito variável local em frontend/public/fonts/, @font-face/tokens.css e fallback system-ui, sans-serif. Sem CDN; mesma fonte inicial nos clones, troca só com aprovação e SDD atualizado. |
| Máscaras de entrada | **IMask 7.6.1**, pacote imask |
| Validação de formulários | **JustValidate 4.3.0**, pacote just-validate |
| Testes de lógica frontend | **Vitest** |
| Testes de navegador e regressão visual | **Playwright** |
| Testes backend | **PHPUnit**, integrado às ferramentas de teste do Laravel |
| Desenvolvimento e build | Vite **8.3.4** com **@vitejs/plugin-vue** para componentes .vue |
| Ambiente Node | Imagem Docker **node:22-alpine** |
| PWA/Service Worker | **vite-plugin-pwa + Workbox injectManifest**, fonte única frontend/src/sw.js, precache, offline, atualização e eventos push/clique |
| Push Notifications | Notifications Laravel + **laravel-notification-channels/webpush**, Web Push/VAPID e cliente Push API; versão compatível a fixar na Sprint 5 |
| Fila de envio | Laravel **database** no MySQL existente; Jobs/worker no PHP-FPM, operados por mecanismo existente ou Cron, sem novo contêiner |
| Backend/API | Laravel **12.70.0** |
| PHP | PHP **8.2.x**, executado com PHP-FPM |
| Dependências PHP | Composer 2, com dependências fixadas pelo composer.lock |
| Banco | MySQL **8.0** |
| Autenticação | Sessão Laravel/Sanctum, cookies e CSRF, incluindo APIs push; usuário de teste isolado, sem login completo de produção |
| Servidor web | Nginx |
| Infraestrutura | Docker Compose, reaproveitando os serviços existentes |
| HTTPS | Let's Encrypt e Certbot |
| Versionamento | Git, com branch principal **master** |

A interface utiliza Framework7 com Vue 3 por meio do pacote oficial framework7-vue. Manter JavaScript, sem React ou TypeScript. As APIs Core do Framework7 continuam disponíveis quando necessárias, integradas ao ciclo de vida Vue; não manter uma segunda aplicação Core independente.

Fixar versões de Vue, framework7-vue, @vitejs/plugin-vue, Lucide, vite-plugin-pwa, WebPush/Workbox e testes após conferir documentação, exports, engines, peerDependencies e navegadores alvo. Alinhar framework7/framework7-vue. Não mudar a stack silenciosamente; lockfiles tornam a instalação reproduzível.

## 2. Estrutura do projeto

```text
nome-do-projeto/
├── README.md
├── AGENTS.md
├── MEMORY.md
├── RULES.md
├── .env.foundation.example
├── .env.foundation       # Local, ignorado no Git
├── scripts/
│   └── bootstrap/        # index.mjs, módulos, templates e executor Docker
├── instalacao-pwa-framework.md        # Roteiro único e trechos gerenciados sem segredos
├── frontend/
│   ├── vite.cmd
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── routes.js
│   │   ├── sw.js        # Service Worker único, criado na Sprint 4; push na Sprint 5
│   │   ├── components/  # Componentes oficiais/composições, incluindo PushSettings.vue na Sprint 5
│   │   ├── services/    # api.js e push.js (Sprint 5)
│   │   ├── pages/
│   │   │   └── hello.vue # Página inicial de demonstração da fundação
│   │   └── css/         # Tokens e estilos compartilhados do design system
│   ├── public/
│   └── dist/              # Gerada pelo build
├── backend/
└── docs/
    ├── telas/              # Imagens de propostas e layouts aprovados
    └── sdd/
```

| Caminho | Responsabilidade |
|---|---|
| .env.foundation | Entrada central por projeto/ambiente; não versionar nem servir ao navegador |
| .env.foundation.example | Modelo versionado sem credenciais, com padrões e campos explicados |
| scripts/bootstrap/index.mjs | Entrada Node portátil: preparação, espera por infraestrutura manual e inicialização; executada pelo serviço pwa-foundation-bootstrap |
| scripts/bootstrap/ | Módulos, templates, Dockerfile e entrypoint do executor; trecho para inclusão manual no Compose compartilhado |
| instalacao-pwa-framework.md | Roteiro único de instalação e operação; blocos Compose/Nginx gerenciados pelo bootstrap, sem alterar a infraestrutura automaticamente |
| frontend/ | Projeto independente com Vite, Vue 3, Framework7 Vue e recursos da PWA |
| frontend/vite.cmd | Atalho Windows obrigatório, criado na fundação para executar desenvolvimento e build pelo Docker Compose |
| frontend/src/ | Navegação, telas, componentes, estilos, API, cliente push e worker único |
| frontend/src/css/tokens.css | Valores visuais compartilhados, vinculados às variáveis Framework7 |
| frontend/public/ | Manifest, ícones de instalação, fontes locais e arquivos estáticos |
| frontend/vite.config.js | Plugins Vue/PWA, proxy e entrada do aplicativo, com valores públicos derivados do central |
| frontend/dist/ | Arquivos compilados servidos pelo Nginx em produção |
| frontend/src/components/ | Componentes .vue de composição/personalização do Framework7 Vue, criados progressivamente conforme o design system |
| frontend/src/pages/hello.vue | Página Hello na rota /, com demonstrações oficiais, status real da API/banco e experiência PWA |
| backend/ | Laravel/API, sessão/CSRF, modelos/migrations, Notifications/Jobs e serviço central PushNotificationService |
| docs/sdd/ | Especificações detalhadas e atualizadas do projeto |
| docs/telas/ | Imagens locais de propostas e referências aprovadas, organizadas por tela |

O design system é documentado em docs/sdd/02-design-system.md e implementado nos tokens, estilos e componentes compartilhados do frontend.

## 3. Composer e desempenho no Windows

Manter o código no mount Windows e **backend/vendor em volume Docker exclusivo por projeto**, para reduzir a lentidão de leitura das dependências. Conferir o mount efetivo antes de instalar; declarar o volume no Compose não comprova sua aplicação no contêiner ativo.

Executar Composer no PHP-FPM, com o PHP e as extensões da aplicação. Reutilizar o executável incorporado à imagem; se ausente, criar um contêiner temporário composer:2, copiar seu executável para o PHP-FPM e remover o temporário. As dependências permanecem no volume vendor.

Garantir escrita de www-data em storage/ e bootstrap/cache, ajustando apenas o projeto. Novo mount pode exigir recriar só PHP-FPM, com breve interrupção dos sites compartilhados; informar antes. Usar caminhos reais.

## 4. Desenvolvimento, build e produção

**Não instalar Node/npm no Windows.** Executar dependências, dev, build e testes via Docker/atalhos. Instruções operacionais informam pasta, serviço real e comando Docker completo; scripts npm não são comandos diretos do host.

| Etapa | Funcionamento |
|---|---|
| Desenvolvimento frontend | Vite executado em contêiner Node, com HMR e polling quando necessário para volumes do Windows |
| Comunicação local | Proxy do Vite para /api, /sanctum e /up no Nginx |
| Desenvolvimento backend | Laravel executado pelo PHP-FPM, com vendor em volume exclusivo |
| Instalação frontend | npm ci dentro do contêiner Node, seguindo o package-lock.json; fornecer comando Docker completo |
| Build frontend | frontend/vite.cmd build executa npm run build no contêiner Node, gerando frontend/dist/ |
| Build na VPS | Contêiner temporário node:22-alpine, removido ao terminar |
| Produção frontend | Nginx serve os arquivos estáticos de frontend/dist/ |
| Produção backend | Nginx encaminha as requisições Laravel ao PHP-FPM |
| Persistência | Laravel acessa o MySQL, com os dois bancos e a conta existente informados no arquivo central |
| Origem | Frontend e API sob o mesmo domínio HTTPS |
| API | Base /api/v1 |
| Node em produção | Necessário para build, sem servidor Node permanente para servir o frontend |

O Nginx deve encaminhar /api/*, /sanctum/csrf-cookie e /up ao Laravel. Rotas da API não podem receber o HTML do frontend por engano.

Reaproveitar Compose, Nginx, PHP-FPM e MySQL existentes. Conferir redes, mounts e configurações reais antes de adaptar a infraestrutura compartilhada. Domínio, portas locais e nomes dos serviços vêm da configuração central e das derivações da seção 0.

### Instalação do backend

O build Vite não instala nem publica o Laravel. Executar o ciclo backend no PHP-FPM:

1. Se backend/ estiver vazio na construção inicial, criar esqueleto oficial temporário sem conflito com vendor. Fixar laravel/framework e registrar origem de laravel/laravel (versões distintas). Clones usam composer install/lockfile, nunca create-project.
2. Preparar .env.example sem segredos. O bootstrap deriva APP_URL, DB_CONNECTION=mysql e conexão de backend/.env e backend/.env.testing do arquivo central (seção 0). Não editar valores compartilhados nos arquivos derivados; conferir os bancos reais sem presumir execução de scripts init do MySQL.
3. Preservar APP_KEY válida, dados e configurações não gerenciadas dos .env. Sincronizar credenciais somente pelos campos centrais; não gerar senhas, concatenar/regenerar chaves ou solicitar segredos no chat.
4. Preparar os bancos principal e de testes distintos com a conta existente definida no central. root é aceito quando informado. Não criar usuários, gerar senhas nem alterar grants; se faltar permissão para criar banco, orientar criação manual.
5. Conferir conexão e isolamento dos testes conforme a seção 0, sem credenciais administrativas adicionais, valores hardcoded ou exposição de segredos.
6. Garantir limpeza de cache antes das migrations; se depender de tabela ainda ausente, usar configuração inicial apropriada, como cache em arquivo. Aplicar php artisan migrate. Após mudanças no .env, executar php artisan config:clear, php artisan route:clear e php artisan view:clear.
7. Integrar a instalação ao bootstrap da seção 0, independente do diretório do terminal e com parada no primeiro erro. Não criar instalador paralelo; procedimentos no guia.

Entregar código, composer.json, composer.lock, migrations, testes e exemplos de ambiente. Identificar precisamente o que não pôde ser instalado ou validado.

### Comando operacional `app:sync`

Criar este comando Artisan próprio na Sprint 1. Executar optimize:clear e, somente após sucesso, migrations pendentes. Interromper e propagar qualquer falha com código diferente de zero, sem anunciar sucesso parcial. Não instalar dependências, buildar, executar seeders, apagar dados ou regenerar APP_KEY.

Em produção, exigir --force explícito antes de alterar o ambiente e repassá-lo às migrations; documentar procedimentos de publicação, backup e recuperação em instalacao-pwa-framework.md. Validar também o caso sem migrations pendentes.

Após implementação e validação, executar pelo PHP-FPM com o caminho real do projeto. O exemplo pressupõe container_name php-fpm; o bootstrap deve resolver o serviço PHP_SERVICE via Compose, sem presumir esse nome de contêiner:

```bash
docker exec -w /var/www/novo-projeto/backend php-fpm php artisan app:sync
```

### Site local no Nginx

O site local é configurado no arquivo de sites da infra compartilhada. Em desenvolvimento o Vite roda na porta interna 5173 (publicada na porta local definida para o serviço); em produção o Nginx serve `frontend/dist/` e encaminha `/api`, `/sanctum`, `/up` e `/status` ao PHP-FPM.

### Configuração obrigatória do Vite no Docker

O servidor Vite deve escutar em todas as interfaces **dentro do contêiner**, usando server.host: true ou server.host: '0.0.0.0'. Escutar apenas em localhost dentro do contêiner impede o acesso pela porta publicada pelo Docker.

### Importação do CSS do Framework7 (modo correto)

Com Vite 8 (rolldown), **não copiar os arquivos CSS do Framework7 para a pasta `public/`**. Importar diretamente pelo pacote usando os subpaths definidos no campo `exports`:

```js
import Framework7 from 'framework7/lite-bundle';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
```

Importar CSS pelos exports da versão instalada: `framework7/css/bundle`; `framework7/framework7-bundle.css` não resolve na referência adotada. Embutir pelo build/lockfile, sem cópias manuais em public/.

Trecho mínimo ilustrativo de frontend/vite.config.js (complementado pelo plugin PWA e entradas do build nas sprints). O bootstrap deve fornecer target, Host e portas pelos valores públicos derivados da configuração central, sem editar estes literais a cada clone:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const backendProxy = () => ({
  target: 'http://nginx',
  changeOrigin: true,
  headers: { Host: 'novo-projeto.localhost' },
});

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': backendProxy(),
      '/sanctum': backendProxy(),
      '/up': backendProxy(),
    },
  },
});
```

Exemplo: Nginx novo-projeto.localhost, Vite interno 5173, publicação disponível `127.0.0.1:5176:5173` e acesso http://localhost:5176. Resolver nginx pela infra_network; adaptar os valores reais. O exemplo não substitui a configuração completa da PWA.

### Layout, grid e estilos

Framework7 fornece controles, grid responsivo e utilitários nativos. Tokens definem os valores visuais; CSS compartilhado cobre composições que o framework não atende.

- Usar o grid oficial para colunas/espaçamento; personalizações usam CSS Grid/Flexbox em frontend/src/css/.
- Centralizar cores, fonte, espaçamentos e raios em tokens.css, vinculados às variáveis Framework7, incluindo --f7-grid-gap.
- Não duplicar paletas/escalas nem recriar controles. Estilos de páginas/componentes seguem os mesmos tokens.
- Importar CSS compartilhado uma vez pela entrada global e validar responsividade/cascata no dev e build.

Exemplo oficial: uma coluna por padrão e duas a partir do breakpoint medium.

```html
<div class="grid grid-cols-1 medium-grid-cols-2 grid-gap">
  <div>Conteúdo 1</div>
  <div>Conteúdo 2</div>
</div>
```

### Inicialização Vue e navegação

main.js integra Framework7Vue ao Framework7, registra componentes oficiais e monta App.vue em #app. App.vue contém f7-app/view principal e recebe apenas configuração pública. Conferir imports/registro na versão fixada.

Manter frontend/src/routes.js com o roteador do Framework7 Vue, associando as rotas aos componentes .vue de pages/. Preservar avanço, retorno e transições nativas; não adicionar Vue Router nem controlar o mesmo fluxo por dois roteadores. Usar Composition API com <script setup> em JavaScript nos componentes próprios.

### Integração obrigatória ao Compose compartilhado da infraestrutura

A nova aplicação deve ser integrada ao **docker-compose.yml existente na pasta infra/**, seguindo a organização presentada pelo usuário. Não criar uma segunda pilha independente de Nginx, PHP-FPM e MySQL para este projeto.

Na organização padrão, infra/ e projeto são pastas irmãs sob a raiz montada em /var/www. O bootstrap resolve INFRA_COMPOSE_PATH e CONTAINER_PROJECTS_ROOT conforme o ambiente real; o caminho %~dp0..\..\infra\docker-compose.yml ilustra somente a saída padrão de frontend/vite.cmd.

Os exemplos abaixo usam **novo-projeto** para a pasta, **novo-projeto-node** para o serviço e **novo_projeto** como base dos volumes. O bootstrap deriva os valores reais do central; não fazer substituições manuais a cada clone.

| Item | Integração ao Compose existente |
|---|---|
| Rede compartilhada | infra_network, com nome infra_network e driver bridge, já existente |
| Serviço frontend | Adicionar novo-projeto-node, com imagem node:22-alpine e working_dir /app |
| Código frontend | Montar ../novo-projeto/frontend:/app no serviço Node |
| Dependências frontend | Montar novo_projeto_node_modules:/app/node_modules e declarar o volume em volumes |
| Desenvolvimento | Associar o serviço Node ao perfil dev e à rede infra_network |
| Porta | Selecionar uma porta local disponível e configurar Vite, mapeamento Docker e documentação de forma compatível |
| Dependências PHP | Acrescentar novo_projeto_vendor:/var/www/novo-projeto/backend/vendor aos volumes do serviço php-fpm existente |
| Volume vendor | Declarar novo_projeto_vendor em volumes, com name: novo_projeto_vendor para manter identidade estável |
| Código backend | Reaproveitar a montagem ../:/var/www já presente no PHP-FPM e no Nginx |
| Banco | Reutilizar o servidor MySQL configurado, com bancos principal/testes e credenciais existentes do arquivo central |
| Servidor web | Adicionar a configuração do site da nova aplicação ao Nginx compartilhado, apontando frontend e backend para seus caminhos reais |
| Atalho Windows | Executar o serviço correspondente ao projeto pelo Compose compartilhado |

O serviço Node é utilizado pelos comandos temporários de desenvolvimento/build do vite.cmd; não exige execução permanente em produção. O serviço composer:2 também permanece temporário, conforme o fluxo definido neste documento.

Adicionar apenas recursos faltantes, preservando projetos/serviços/volumes existentes. Derivar nomes próprios e manter coerência entre Compose, Vite, vite.cmd, Nginx e docs; não copiar credenciais ou identidade de outro produto.

### Portas no Windows e acesso Android por USB

No mapeamento 127.0.0.1:5176:5173, Vite escuta 5173 no contêiner e o navegador usa localhost:5176 no Windows. ADB encaminha a porta do Windows. O roteiro completo de prévia/PWA está na Sprint 4; para interface/HMR, usar a porta de desenvolvimento da tabela desse roteiro. O modo dev não registra service worker.

### Atalho Windows obrigatório: frontend/vite.cmd

O arquivo **frontend/vite.cmd deve ser criado já na fundação do projeto**, junto com a configuração do serviço Node no Compose existente. Não deixar sua criação para uma etapa posterior. Ele permite executar os comandos abaixo dentro de frontend/ no Prompt de Comando do Windows:

```bat
vite dev
vite build
```

No Prompt de Comando (CMD), dentro da pasta frontend, utilizar `vite.cmd dev` e `vite.cmd build`.

O bootstrap deve gerar o atalho a partir do caminho Compose central e do serviço derivado. O modelo abaixo ilustra a saída; os nomes e caminhos fixos não são uma segunda fonte de configuração:

```bat
@echo off
setlocal

if /I "%~1"=="dev" goto dev
if /I "%~1"=="build" goto build

echo Use: vite dev ou vite build
exit /b 1

:dev
docker compose -f "%~dp0..\..\infra\docker-compose.yml" --profile dev run --rm --no-deps --service-ports novo-projeto-node npm run dev
exit /b %errorlevel%

:build
docker compose -f "%~dp0..\..\infra\docker-compose.yml" --profile dev run --rm --no-deps novo-projeto-node npm run build
exit /b %errorlevel%
```

- Usar %~1 e %~dp0 literalmente, sem asteriscos ou escapes de formatação. Resolver o Compose pela localização do script; conferir o caminho relativo na estrutura real.
- Manter os parâmetros do modelo: dev publica portas via --service-ports; build não publica. --rm remove o temporário e --no-deps exige backend disponível quando utilizado. Propagar o código Docker com exit /b %errorlevel%.
- Não instalar dependências automaticamente: executar npm ci pelo Docker antes do primeiro uso ou quando o lockfile exigir. Serviço, mounts, volume e porta seguem a tabela de integração; registrar comandos e pré-requisitos em instalacao-pwa-framework.md.

## 5. Recursos da PWA

A fundação deve incluir:

- Manifest com nome, cores, ícones e exibição standalone.
- **vite-plugin-pwa** integrado ao build do Vite, utilizando Workbox com **injectManifest** e fonte em frontend/src/sw.js desde a Sprint 4.
- Cache dos arquivos estáticos e página de indisponibilidade offline.
- Identificação da versão do build.
- Atualização automática com tratamento para preservar formulários em preenchimento.
- Instalação em dispositivos compatíveis.
- Publicação com HTTPS.
- Web Push reutilizável: inscrições, preferências, envio em fila e clique seguro (Sprint 5).

vite-plugin-pwa/Workbox compila o worker e o manifest de cada produto; não criar plugin próprio. Offline cobre shell estático/indisponibilidade, sem sincronização de registros. Dados privados da API não entram no cache público.

### Registro, atualização e cache

- Registrar um único SW por virtual:pwa-register; fonte sw.js compilada com injectManifest/self.__WB_MANIFEST. Eventos push/notificationclick usam a mesma registration.
- Usar registerType: 'prompt': detectar atualização automaticamente e ativar em momento seguro. Formulário alterado exige salvar/descartar/confirmar; sem recarga incondicional.
- Incluir no precache somente recursos públicos necessários ao aplicativo.
- Não armazenar respostas de API, sessão, CSRF ou diagnóstico no cache do service worker. Excluir /api, /sanctum, /up e /status do fallback de navegação.
- Manter o service worker desativado no servidor Vite de desenvolvimento. Validar cache, offline e atualizações usando o build, servido pelo Nginx em localhost ou HTTPS.
- Não aplicar cache HTTP imutável ao HTML, manifest ou service worker; assets versionados podem ter cache de longa duração.

### Inscrições e envio Web Push

Implementar na Sprint 5 sobre a stack e o SW único acima. Antes de instalar WebPush, conferir código/lockfiles e compatibilidade com Laravel 12/PHP 8.2; não atualizar a stack para acomodar o pacote.

- Centralizar envio individual e em lote em `backend/app/Services/PushNotificationService.php`, usando Notifications/Jobs Laravel. Os produtos derivados definem destinatários autorizados, conteúdo e gatilhos, sem implementar novamente a infraestrutura.
- Configurar PUSH_ENABLED/VAPID no central privado → backend/.env → config/webpush.php. Push desabilitado por padrão. Habilitado e par vazio: gerar/persistir pelo backend sem imprimir. Par válido: preservar por produto/ambiente; parcial/inválido: parar; rotação explícita. Subject real mailto:/HTTPS informado pelo responsável.
- Persistir dono da sessão, preferência global e subscriptions idempotentes com endpoint único/múltiplos dispositivos. Não aceitar dono do payload nem transferir endpoint silenciosamente. Tratar troca de conta/logout/revogação/falhas parciais e reconciliar; revalidar inscrição/preferência nos jobs.
- APIs Sanctum/sessão com CSRF, ownership, rate limit e validação; sem broadcast público. Push desabilitado recusa inscrição/envio, mas permite consultar/revogar vínculos antigos; documentar os status.
- Validar payload e clique na mesma origem/escopo. Proteger envio contra SSRF, redes privadas e redirects indevidos. Sem endpoints completos/chaves/cookies/conteúdo privado nos logs; mensagem mínima na tela bloqueada e autorização revalidada no destino.
- Fila Laravel database/MySQL, reaproveitando jobs/failed_jobs. Worker existente ou Cron/PHP-FPM com lock, tempo limitado, retry/backoff/timeout. Scheduler não consome fila. Sem contêiner extra, Redis/broker ou SDK Firebase/OneSignal. Transporte usa provedores dos navegadores; aceite não garante exibição/leitura.
- Remover inscrições definitivamente expiradas; limitar retentativas em falhas transitórias. Erros VAPID/configuração não apagam inscrições válidas em massa. Diferenciar enfileirado, aceito pelo provedor e falha; percorrer lotes em blocos.
- Implementar services/push.js e PushSettings.vue Framework7 na Hello. Estados: sem suporte, HTTPS/instalação, desabilitado, autenticação, permissão, inscrito/cancelado e falha. Permissão só por clique; sem prompt ao abrir ou repetição após recusa.
- Reutilizar registration/getSubscription/subscribe/unsubscribe. Integrar push/notificationclick e event.waitUntil no sw.js único, com payload defensivo, foco/reuso/abertura segura da rota. Preservar precache/offline/prompt/formulários/múltiplas abas; sem cache de APIs push/sessão/CSRF/preferências.
- Login completo não faz parte da fundação. Validar ownership com usuários de teste e sessão real isolada para aparelhos/navegador, sem credencial fixa/acesso de teste em produção. Sem sessão, mostrar autenticação necessária; não liberar APIs.

| Método e rota | Finalidade |
|---|---|
| GET /api/v1/push/config | Disponibilidade e chave pública VAPID; no-store |
| POST /api/v1/push/subscriptions | Inscrição idempotente do usuário atual; 201/200 |
| GET /api/v1/push/subscriptions | Dispositivos próprios, sem endpoints/chaves completos |
| DELETE /api/v1/push/subscriptions/{id} | Revogar inscrição própria; 204, ou 404 para outra conta |
| GET /api/v1/push/preferences | Ler preferência global |
| PUT /api/v1/push/preferences | Atualizar preferência global, respeitada também pelos jobs pendentes |

Respeitar respostas 401/419/422/429 e documentar contratos completos em 05-api.md. Expor apenas a chave pública ao frontend por API autenticada no-cache. Não enviar notificações nem solicitar permissão durante o bootstrap; fornecer teste explícito e limitado para usuário/dispositivo autorizado.

**Aceite push:** isolamento/CSRF, preferências, dispositivos, expiração, retentativas, VAPID preservado e fila processada. Demonstrar recebimento/clique com app aberto/fechado em aparelhos compatíveis; distinguir simulação, aceite do provedor e entrega. Produção/testes externos usam HTTPS; iOS instalado. Registrar versões/pendências e regressão offline/precache/atualização. Toast/notification Framework7 não comprova Web Push.

Contratos nos sete SDD; resultados no MEMORY. Preparação VAPID, fila/Cron, teste e operação no guia. AGENTS/RULES exigem autenticação, serviço central, SW único, permissão explícita e chaves preservadas.

## 6. Design system obrigatório

**REGRA OBRIGATÓRIA — TODA TELA E TODO COMPONENTE DEVEM SEGUIR O DESIGN SYSTEM DO PROJETO.** Consultar os padrões existentes antes de implementar ou alterar a interface. Não criar cores, medidas, estilos ou variações isoladas por página. Esta regra deve constar explicitamente em AGENTS.md e RULES.md desde a fundação.

### Fonte oficial e implementação

- docs/sdd/02-design-system.md é a fonte documental dos padrões aprovados: cores e usos semânticos, tipografia, espaçamentos, dimensões, bordas, raios, sombras, ícones, estados e variações dos componentes.
- frontend/src/css/tokens.css centraliza os valores compartilhados, vinculados às variáveis nativas Framework7; sem escalas/paletas independentes.
- components/ reúne composições Vue reutilizáveis sobre Framework7, criadas por uso real. Compartilhar estilos/comportamentos; não gerar biblioteca antecipada.
- As páginas devem consumir os mesmos tokens, estilos e componentes. As referências visuais aprovadas complementam essas definições e ficam em docs/telas/.

### Consistência e evolução

Padronizar controles, formulários, listas, cards, navegação e feedback. Cobrir normal/foco/desabilitado/carregando/erro/sucesso, validação e acessibilidade quando aplicáveis; criar só variações utilizadas.

**Aprovar uma tela não autoriza alterar o design system.** Mudanças globais exigem aprovação, atualização compartilhada e revisão das telas afetadas. Documentar contexto/finalidade/limites das exceções.

O design system começa na fundação com os padrões nativos adotados e os tokens iniciais, sem inventar uma identidade visual definitiva. Evolui conforme as decisões forem aprovadas. Antes de concluir cada entrega de interface, conferir sua aderência aos padrões documentados e corrigir divergências.

## 7. Componentes oficiais do Framework7 Vue

**Usar controles oficiais Framework7 Vue.** Sem equivalente Vue, integrar a API Core documentada ao ciclo de vida. Partir do visual nativo; personalizações seguem design system/aprovação. Apresentar lacunas antes de trocar a solução. Lucide/Framework7 Icons fornecem ícones, não controles.

### Criação progressiva em frontend/src/components/

- Criar componentes próprios somente quando houver necessidade real de reutilização, composição ou personalização aprovada. Usar diretamente os componentes oficiais quando suficientes; não criar um wrapper para cada controle por obrigação.
- Nomear componentes reutilizáveis .vue em PascalCase e definir props, eventos e slots conforme o uso real. Telas ficam em pages/ e importam components/; a página inicial tem o nome explicitamente definido hello.vue, em minúsculas.
- Usar tokens e variáveis Framework7 aprovados. CSS local/scoped também deve preservar cores, dimensões e estados do design system.
- Documentar finalidade, estados, variações e regras de uso em 02-design-system.md, referenciando o componente existente. Atualizar especificação e implementação quando uma mudança aprovada afetar outros usos.
- Preservar acessibilidade, encaminhamento de atributos/eventos e comportamento dos controles oficiais ao compor um componente. Não manipular diretamente o DOM que Vue gerencia quando bindings, props e eventos resolvem a necessidade.

## 8. Consistência visual e aprovação de novas páginas

Aplicar o design system da seção 6 a todas as páginas, incluindo hierarquia de textos, dimensões dos controles, alinhamento dos formulários, navegação e comportamento responsivo.

### Fluxo de uma nova página

1. Consultar as especificações, o design system, os componentes compartilhados e as referências visuais já aprovadas.
2. Quando solicitada, gerar uma imagem de proposta da nova página usando esses padrões.
3. Submeter o layout à aprovação do usuário antes de implementar a nova tela.
4. Implementar a tela .vue conforme a imagem aprovada, reutilizando os componentes oficiais do Framework7 Vue e os componentes compartilhados existentes.
5. Atualizar o design system e os componentes compartilhados quando houver um novo padrão ou uma variação aprovada.
6. Atualizar os documentos SDD responsáveis pelas definições e registrar decisões pertinentes em MEMORY.md.

### Transições de navegação

Usar transições nativas Framework7. Priorizar parallax, dive e cover-v conforme o fluxo. A Hello demonstra cover-v, dive, fade e parallax com avanço/retorno; produtos não precisam usar todas.

- Definir as transições na configuração de navegação/rotas do Framework7, usando os identificadores suportados pela versão adotada.
- Manter consistência: fluxos equivalentes devem utilizar o mesmo padrão de transição.
- Preservar o comportamento nativo de avanço e retorno do framework.
- Não criar animações próprias para substituir as transições de navegação do Framework7.
- Respeitar as preferências de redução de movimento do usuário, reduzindo ou desativando animações quando necessário.
- Registrar a transição escolhida para cada tela ou fluxo em docs/sdd/01-telas.md.

### Imagens de referência das telas

Criar **docs/telas/** já na fundação. Organizar as imagens por identificador da tela, usando nomes estáveis e versionados para distinguir propostas e aprovações:

```text
docs/telas/
└── inicio/
    ├── inicio-v01-proposta.png
    └── inicio-v02-aprovada.png
```

Os nomes acima ilustram a convenção; não criar imagens fictícias nem presumir aprovação. Salvar as imagens efetivamente produzidas ou fornecidas para o projeto e preservar as versões aprovadas anteriores quando forem necessárias para rastrear uma alteração.

- Referenciar as imagens por caminhos relativos em docs/sdd/01-telas.md e docs/sdd/02-design-system.md, identificando a versão vigente aprovada. Por exemplo, a partir desses documentos: ../telas/inicio/inicio-v02-aprovada.png.
- Registrar a decisão de aprovação ou substituição em MEMORY.md. Os documentos SDD apontam para a referência vigente, sem duplicar o histórico da decisão.
- Não depender exclusivamente de links privados da conversa ou de arquivos acessíveis somente na conta original. Garantir que as imagens necessárias acompanhem o repositório ou o ZIP de transferência.
- Ao aprovar uma imagem gerada em conversa, incorporá-la aos arquivos do projeto. Se os bytes não estiverem disponíveis, registrar a pendência e solicitar o arquivo antes de declarar a referência preservada.
- Referências visuais não substituem tokens.css, componentes compartilhados nem especificações de comportamento.

## 9. Documentos de orientação

Criar na raiz desde a fundação, com conteúdo específico e conciso:

| Arquivo | Responsabilidade |
|---|---|
| AGENTS.md | Entrada para IA/desenvolvedor: contexto, stack, estrutura, convenções, mudanças mínimas, criação de arquivos somente quando necessária e leituras obrigatórias. Apontar para RULES.md, MEMORY.md, SDD pertinente e comandos em instalacao-pwa-framework.md. |
| MEMORY.md | Resumo de retomada, decisões, andamento, verificações, pendências e próximo passo, conforme a seção 11. |
| RULES.md | Regras obrigatórias de desenvolvimento, componentes nativos, design system, aprovação e procedimento de documentação da seção 11. |

Atualizar somente quando o conteúdo responsável mudar, sem aumentar os arquivos artificialmente ou duplicar especificações e comandos.

## 10. Documentação SDD enxuta e progressiva

A pasta docs/sdd/ existe desde a fundação, com esta estrutura inicial fixa:

```text
docs/sdd/
├── 00-visao.md
├── 01-telas.md
├── 02-design-system.md
├── 03-arquitetura.md
├── 04-ambiente.md
├── 05-api.md
└── pedidos-componentes.md
```

Criar os sete arquivos SDD desde a fundação e preencher decisões já aprovadas. Somente indefinições reais ficam pendentes; não inventar escopo. Documentos ainda sem definição recebem título e orientação.

| Arquivo | Conteúdo |
|---|---|
| 00-visao.md | O que é o produto, para quem se destina, escopo incluído e excluído e requisitos |
| 01-telas.md | Um bloco por tela com objetivo, componentes usados, transição de navegação, estados vazio/erro/carregando, critérios de aceitação e status proposta/aprovada/implementada |
| 02-design-system.md | Tokens aprovados de cores, espaçamentos, raios e demais padrões; componentes Framework7 Vue adotados, componentes próprios de components/ e suas variações; links para imagens de referência aprovadas |
| 03-arquitetura.md | Estrutura do projeto, modelo de dados, regras de negócio e autenticação com Sanctum, sessão e CSRF |
| 04-ambiente.md | Contrato técnico do ambiente: arquivo central, derivações, bootstrap, estados/códigos, mounts, build, testes, publicação e operação da fila. Comandos e procedimentos ficam em instalacao-pwa-framework.md. |
| 05-api.md | Contratos dos endpoints sob /api/v1: método, rota, payload, resposta e erros; documentar também as rotas técnicas /up e /status em seção própria |
| pedidos-componentes.md | Registro do componente que faltou e do contexto de uso antes de interromper o trabalho por essa ausência |

02-design-system.md é a fonte documental obrigatória dos padrões visuais e de consistência entre telas; tokens.css, os estilos e os componentes compartilhados implementam esses padrões. Documentar cada padrão uma única vez e referenciá-lo nas especificações das telas.

AGENTS.md aponta para instalacao-pwa-framework.md para comandos e procedimentos operacionais, e para 04-ambiente.md para o contrato técnico do ambiente. Não duplicar os comandos. O mesmo vale para especificações detalhadas: apontar para o arquivo responsável em vez de duplicar seu conteúdo.

**SDD descreve o sistema; MEMORY registra progresso, decisões, evidências e pendências.** Plano de sprints neste README; critérios de UI em 01-telas.md. Não criar acompanhamento paralelo, changelog, índice ou sprints no SDD.

Se 01-telas.md crescer a ponto de dificultar a consulta, migrar seu conteúdo para telas/, com um arquivo por tela, e atualizar os apontamentos sem manter duas cópias. Se a API crescer, substituir os contratos de 05-api.md por uma especificação OpenAPI e deixar nele somente a referência de acesso, sem contratos paralelos.

A documentação cresce junto com o projeto e deve permitir a continuidade por outra pessoa ou IA, preservando essa responsabilidade única de cada informação.

## 11. Regras gerais

1. Preservar a stack aprovada. Apresentar novas bibliotecas e mudanças de arquitetura para aprovação antes da adoção.

> **REGRA OBRIGATÓRIA — NÃO ADIVINHAR O FUNCIONAMENTO DA STACK. Ao menor sinal de dúvida sobre qualquer ferramenta, SEMPRE consultar sua documentação oficial antes de escrever código ou responder.** O acesso está explicitamente autorizado, sem pedir permissão. Incorporar esta regra com a mesma ênfase a AGENTS.md e RULES.md desde o início.
2. Usar componentes oficiais do Framework7 Vue e criar componentes próprios progressivamente em frontend/src/components/, conforme as seções 6 e 7.
3. Seguir obrigatoriamente o design system em todas as páginas e componentes.
4. Manter o design system e sua implementação compartilhada coerentes a cada mudança visual aprovada.
5. Atualizar a documentação correspondente a cada mudança relevante.
6. Manter decisões e pendências registradas para continuidade do trabalho.
7. Não incluir credenciais ou segredos no frontend, no Git ou na documentação.
8. Manter Vue 3 com JavaScript e componentes .vue, sem TypeScript, e a branch principal como master.

### Procedimento obrigatório de continuidade e documentação

**Documentação integra a entrega e permite continuidade sem histórico.** Exigir este procedimento em AGENTS/RULES; tarefa com documentação desatualizada não está concluída.

1. **Retomar:** ler AGENTS/RULES/MEMORY e SDD pertinente; conferir código/configuração/evidências e distinguir implementado, validado e pendente. Perguntar só o indispensável.
2. **Especificar:** registrar decisão aprovada/aceite antes da mudança. Proposta não é aprovação; esclarecer divergências.
3. **Atualizar:** SDD afetado e MEMORY após mudanças, validações, decisões, bloqueios ou interrupção; não esperar o fim da sprint.
4. **Encerrar:** revisar diff/coerência e ajustar AGENTS/RULES quando necessário. Se faltar documentação, registrar/informar a pendência.
5. **MEMORY:** começar por objetivo, estado/última etapa, decisões, evidências, pendências/bloqueios e próximo passo. Separar histórico, propostas e suposições.
6. **Pacote:** código, lockfiles, docs e recursos aprovados, sem segredos ou cópias da infra compartilhada. Contratos no SDD; trechos no guia; próxima etapa no MEMORY. Conferir completude; sem documento de passagem paralelo.

Respeitar as responsabilidades da seção 10: SDD descreve a especificação; MEMORY.md registra andamento; RULES.md contém regras; AGENTS.md orienta o trabalho. Cada informação tem um único local responsável.

Na Sprint 6, verificar de forma reproduzível a existência dos documentos e os links locais Markdown, excluindo dependências e diretórios gerados. Essa checagem não substitui a revisão semântica; registrar exceções justificadas sem criar atualizações fictícias.

## 12. Máscaras e validação de formulários

As dependências abaixo devem ser instaladas com versões exatas no frontend e registradas no package-lock.json:

```json
{
  "imask": "7.6.1",
  "just-validate": "4.3.0"
}
```

- **IMask:** aplicar máscaras aos campos que exigirem formato específico, conforme os requisitos de cada formulário.
- **JustValidate:** executar a validação dos formulários no frontend, com mensagens claras e integração aos estados de erro dos campos do Framework7.
- Manter inputs, formulários e controles oficiais do Framework7 Vue; IMask e JustValidate complementam seu comportamento. Acessar os elementos reais por refs/APIs documentadas após renderização, sem presumir que a ref de um componente seja o input HTML.
- Compartilhar configurações de máscaras, validadores e mensagens entre páginas, evitando regras divergentes para o mesmo tipo de campo.
- Vincular máscara/validador ao ciclo Vue/F7 e sincronizar estado. Páginas retidas podem não desmontar ao sair; limpar instâncias/listeners sem duplicação ou ciclos.
- Tratar explicitamente a conversão entre valores exibidos com máscara e o formato esperado pela API, conforme o contrato de cada campo.
- Manter a validação obrigatória no Laravel. A validação no navegador melhora a experiência e não substitui a validação do backend.
- Padronizar no design system a apresentação dos estados válidos, inválidos e das mensagens de erro das máscaras e validações adotadas; reutilizar as configurações comuns dos formulários.

## 13. Testes e validação

| Camada | Ferramenta | Escopo |
|---|---|---|
| Lógica frontend | Vitest | Funções JavaScript, validações próprias, formatação, transformações e comportamentos próprios extraídos dos componentes Vue |
| Fluxos no navegador | Playwright | Navegação, formulários, modais, API, estados/permite-cancela push e dimensões mobile; login só se implementado |
| Regressão visual | Playwright, com comparação de screenshots | Páginas e componentes utilizados no aplicativo, usando referências visuais aprovadas e os padrões do design system |
| Backend | PHPUnit/Laravel | API, autenticação/CSRF/ownership, persistência, subscriptions/preferências, fila e expiração/retry push |
| Web Push real | Build/HTTPS + aparelhos | Recebimento/clique com app aberto/fechado, adesão/cancelamento e atualização; mocks não comprovam entrega |

### Organização e execução

- Manter testes unitários do frontend em frontend/tests/unit/ e testes de navegador em frontend/tests/e2e/.
- Manter testes backend em backend/tests/Unit/ e backend/tests/Feature/.
- Executar Vitest e Playwright no ambiente de desenvolvimento/testes com Node e as dependências de navegador necessárias.
- Executar os testes PHPUnit no ambiente PHP compatível com a aplicação e suas extensões.
- Fixar versões compatíveis das ferramentas nos respectivos manifests e lockfiles durante a implementação.
- Playwright usa serviço temporário no Compose existente e imagem oficial alinhada ao pacote. Não executar Firefox/WebKit em node:22-alpine; manter Alpine para dev/build. Referência: https://playwright.dev/docs/docker.
- Definir formatação e lint do JavaScript/CSS e PHP, escolhendo ferramentas compatíveis antes da instalação, fixando versões e documentando scripts e comandos. Executar as verificações aplicáveis na entrega e na integração contínua quando configurada.
- Documentar os comandos concretos de execução em instalacao-pwa-framework.md, após configurar os scripts do projeto. AGENTS.md deve apontar para esse guia.
- Utilizar ambiente de testes isolado, com banco MySQL exclusivo e dados controlados. Os testes nunca devem acessar ou limpar o banco real.
- Manter as ferramentas de teste como dependências de desenvolvimento; elas não devem integrar o pacote frontend servido ao usuário.

### Critérios de cobertura

- Priorizar regras de negócio, permissões, contratos da API e jornadas críticas do usuário.
- Testar a integração das máscaras e validações com os formulários e o formato enviado à API, incluindo entradas inválidas e casos relevantes de limite.
- Testar contratos próprios (props/eventos/estado/integração) e jornadas Playwright, não internals das bibliotecas. Ferramentas Vue adicionais exigem necessidade/aprovação.
- Adicionar testes proporcionais ao risco da mudança, sem criar testes que apenas reproduzam a implementação.
- Usar referências visuais aprovadas e dados determinísticos nas comparações de screenshots. Não substituir referências automaticamente para esconder regressões.
- Validar o comportamento de indisponibilidade offline, cache estático e atualização da PWA no build de produção, com cenários apropriados ao suporte dos navegadores.
- Complementar a automação com validação em aparelhos reais Android e iPhone, especialmente para instalação, teclado, navegação e comportamento da PWA.
- A emulação mobile no navegador não substitui a validação em dispositivos reais.

## 14. Construção da fundação por sprints

As sprints constroem e validam a fundação reutilizável uma vez. Clones executam somente o bootstrap da seção 0, sem repetir estas sprints. Não há duração fixa: cada sprint termina após demonstrar seus critérios de aceite.

**Hello:** frontend/src/pages/hello.vue, rota /, com aparência nativa Framework7. Sprint 2 cria componentes; 3 confere design system; 4 integra PWA; 5 integra push; 6 valida o conjunto. Telas de negócio/identidade personalizada exigem aprovação.

| Sprint | Resultado verificável | Dependência |
|---|---|---|
| 0 — Preparação | Estrutura, orientação, SDD, configuração central e contrato de inicialização | Infraestrutura de referência disponível |
| 1 — Backend e infraestrutura | Laravel acessível, banco conectado e tela de status OK | Sprint 0 |
| 2 — Frontend integrado | Hello com demonstrações oficiais Framework7 Vue, Lucide, quatro transições e status real Laravel/MySQL | Sprint 1 |
| 3 — Design system | Padrões documentados e implementados em tokens, estilos e componentes compartilhados | Sprint 2 |
| 4 — PWA e build | Build pelo vite.cmd, frontend servido pelo Nginx, PWA instalável e SW único injectManifest | Sprint 3 |
| 5 — Push Notifications | Backend/fila, VAPID, inscrições autenticadas, componente Hello e recebimento/clique | Sprint 4 |
| 6 — Testes e entrega | Verificações automatizadas, roteiro reproduzível e evidências | Sprints 1 a 5 |

### Sprint 0 — Preparação e especificações

**Entregas:**

- Mapear infra/schema/templates e definir executor/provisionamento conforme seção 0.
- Criar estrutura, sete SDD e AGENTS/RULES conforme seções 2 e 9–11, com decisões aprovadas, continuidade sem histórico e infra manual.
- Conferir versões/compatibilidade antes de instalar; apresentar bloqueios antes de substituir tecnologias.

**Aceite:** schema/derivações, documentos, mapeamento atual e contrato do bootstrap definidos, sem declarar implementação pronta.

### Sprint 1 — Laravel, banco e status do backend

**Entregas:**

- Instalar Laravel no PHP-FPM com Composer existente ou temporário composer:2; criar esqueleto só se ausente, sem conflito com vendor (seção 3).
- Entregar executor/bootstrap completo da seção 0, vendor exclusivo, Node/volumes/perfil faltantes e frontend/vite.cmd para validação na Sprint 2.
- Configurar APP_KEY/permissões/sessão/Sanctum/CSRF/migrations e app:sync com propagação de falhas.
- Integrar Nginx real aos contratos abaixo; /status não depende de Vite.

| Rota | Resposta esperada |
|---|---|
| GET /up | Saúde padrão do Laravel; não representa, sozinha, a saúde do banco |
| GET /api/v1/status | JSON agregado; HTTP 200 com status ok quando Laravel e consulta simples ao MySQL funcionarem; HTTP 503 com status error quando o banco estiver indisponível |
| GET /status | Tela HTML simples renderizada pelo Laravel, independente do frontend Vite; exibe Backend OK e Banco OK somente após verificações reais, ou indisponibilidade com HTTP 503 |

Exemplo mínimo de resposta saudável da API:

```json
{
  "status": "ok",
  "checks": {
    "application": "ok",
    "database": "ok"
  }
}
```

Diagnósticos agregados são públicos, no-store e sem credenciais, exceções, caminhos, versões detalhadas ou dados pessoais. Detalhes privados ficam nos logs; diagnósticos detalhados exigem proteção.

**Aceite:** tela /status acessível pelo domínio local com backend e banco OK; API retorna JSON real e responde 503 em teste controlado de falha; /up acessível; mounts e volumes corretos; demais sites da infra preservados.

### Verificações obrigatórias da Sprint 1

- HTML/JSON compartilham consulta real, sem sessão anterior ao diagnóstico; falha com Origin stateful mantém 503.
- Cookies exclusivos/host-only/CSRF compatíveis com Nginx e Vite/proxy; isso não implementa login.
- Nginx usa backend/public nesta etapa, / → /status; frontend/dist só na Sprint 4.
- Testar saúde/falha, no-store/privacidade, CSRF e app:sync duas vezes. Simular falha só no processo testing; não desligar MySQL compartilhado. Conferir interrupção após falha de cache/migration.
- Registrar runtime/versões/resultados reais e limites no MEMORY; /status não substitui a suíte integrada.

### Sprint 2 — Frontend Framework7 Vue integrado

**Entregas:**

- Criar frontend Vite/Vue/F7 e dependências da stack com versões compatíveis/lockfile. Usar JS/script setup, roteador F7 e estrutura das seções 4/18.
- Configurar grid Framework7, tokens iniciais e CSS compartilhado; conferir colunas responsivas, espaçamentos e visual dos controles.
- Integrar npm dev/build/ci ao bootstrap/volume node_modules e gerar configuração pública/atalhos do central.
- Vite: host true, porta fixa/strictPort, polling quando necessário e proxy /api, /sanctum, /up → nginx com Host do site.
- Implementar Hello, status real e tabela abaixo. Formulário e-mail/telefone com IMask/JustValidate, confirmação e sem persistência.
- Página auxiliar realiza as quatro transições nativas com retorno. Limpar máscaras/validadores/listeners em páginas retidas.
- Cliente API preparado para cookies/CSRF; sem módulos de negócio ou login completo.

#### Página Hello — conteúdo obrigatório da Sprint 2

**Finalidade:** permitir que a pessoa abra a base instalada e experimente Framework7 Vue, integração Laravel/MySQL e os recursos da PWA. Não criar controles próprios para imitar os oficiais, nem uma aplicação separada para as demonstrações. A página acompanha cada clone até ser substituída pela página inicial do produto.

Exibir mensagem de boas-vindas, nome do projeto vindo da configuração central, estado de conexão, atualização manual do status e indicação dos resultados reais. Identificar cada demonstração pelo nome do componente.

| Demonstração | Implementação exigida |
|---|---|
| Accordion | Componente oficial, com expansão e recolhimento interativos. |
| Autocomplete | API oficial ligada ao input padrão do Framework7, com sugestões locais de exemplo e seleção funcional. |
| Buttons | Botões oficiais com ações demonstrativas; variações seguem o design system. |
| Calendar | Calendário oficial aberto como sheet de baixo para cima, inclusive em desktop; não substituir por modal central ou datepicker do navegador. |
| Checkbox | Controle oficial com estado reativo. |
| Dialog | Diálogo modal oficial com abertura, confirmação/cancelamento e fechamento. |
| FAB | Floating Action Button oficial com ação demonstrativa. |
| Ícones Lucide | Seção com aproximadamente 20 ícones Lucide distintos, identificados; não usar Framework7 Icons nessa seção. |
| Notifications | Notificações oficiais com abertura e fechamento. |
| Sheet Modal | Sheet oficial com abertura e fechamento, além da demonstração do calendário. |
| Smart Select | Componente oficial com opções locais e seleção refletida no campo. |
| Toast | Toast oficial acionado por uma ação da página. |
| Page transitions | Ações separadas para cover-v, dive, fade e parallax, usando roteador/transições oficiais e página auxiliar com retorno. |

Usar Framework7 Vue ou API Core oficial, com refs/estado/limpeza no ciclo de vida correto. Conferir suporte na versão fixada; se faltar, registrar impedimento em vez de simular controle oficial.

Status vem de /api/v1/status com carregando/sucesso/erro/indisponível/não verificado. Offline/falha não mantém OK antigo. Navegador não acessa MySQL ou credenciais. Dados locais das demonstrações não comprovam persistência.

Reservar na mesma página os estados de instalação, preparo offline e atualização da PWA, cuja integração funcional pertence à Sprint 4; na Sprint 2 não declarar esses recursos concluídos. Documentar Hello e página auxiliar em 01-telas.md, padrões/componentes em 02-design-system.md e comandos/URL em instalacao-pwa-framework.md.

**Aceite Sprint 2:** Hello via Vite/Windows, HMR .vue/JS/CSS, status real pelo proxy e todas as demonstrações da tabela funcionais, incluindo autocomplete, calendar sheet, formulário/máscara/validação e quatro transições com retorno. Usar APIs oficiais, sem persistência fictícia. PWA na Sprint 4; push na 5.

### Sprint 3 — Design system e consistência

**Entregas:**

- Consolidar tokens/estados/variações em 02-design-system.md, CSS e componentes reais compartilhados (seções 6–8).
- Conferir variáveis Framework7/tokens compartilhados, Hello/auxiliar, formulários, feedback, foco/acessibilidade e duplicações.
- Preservar imagens aprovadas em docs/telas; AGENTS/RULES exigem consulta e manutenção do design system.

**Aceite:** telas/tokens/componentes seguem o design system; grid responsivo e estilos compartilhados são consistentes. Variações e mudanças globais têm aprovação; visual/estados Framework7 preservados.

### Sprint 4 — PWA, publicação e atualização

**Execução:** seguir a regra Docker da seção 4 e o roteiro de build/prévia abaixo. Atualizar dependências pelo lockfile quando necessário, sem --service-ports para instalação; não recriar o projeto ao retomar. Se infra/ não estiver no caminho esperado, fornecer o Compose real com -f.

**Entregas:**

- Implementar a PWA da seção 5: injectManifest, sw.js único/self.__WB_MANIFEST, virtual:pwa-register, precache/offline/fallback/exclusões e atualização prompt. Push chega na Sprint 5.
- Manifest público central, ícones 192/512 e identidade provisória; visual final exige aprovação.
- Hello integra conexão/offline/atualização sem perder formulário. Instalação acionável quando suportada; instrução manual nos demais casos, incluindo iPhone.
- Integrar build ao bootstrap/vite.cmd e servir dist pelo Nginx. Com Vite parado, validar HTML/cache, API, /up, /status e CSRF.
- Preparar domínio/HTTPS quando houver dados/ambiente reais; sem PWA paralela de demonstração.

**Aceite:** build reproduzível via Nginx sem Vite, manifest/SW válidos, instalação acionável ou orientada, Hello/página auxiliar offline sem falso status de banco, API sem cache e atualização sem perda de formulário. Localhost para teste compatível; publicação externa com HTTPS.

#### Portabilidade obrigatória do build no Docker

Identificar a entrada pelo caminho absoluto resolvido a partir de vite.config.js, sem depender do nome frontend/ ou da pasta do projeto. Com mount em /app e working_dir /app, ela é /app/index.html.

```js
import { fileURLToPath } from 'node:url';
const appEntry = fileURLToPath(new URL('index.html', import.meta.url));
```

Helpers de precache recebem appEntry e comparam facadeModuleId completo normalizado, incluindo separadores Windows. Falhar se faltar entrada. Testar mount real e pasta sem nome frontend; identificar reproduções fora do Docker do responsável.

#### Fluxo único para testar a PWA no Android por USB

**Ordem obrigatória: aplicar arquivos → dependências quando necessário → build com sucesso → conferir dist → uma prévia → acesso no Windows → ADB → acesso no Android.** Usar Node pelo Docker, conforme a seção 4.

Os exemplos usam pwa-teste-node, mount /app, infra em C:\var\www\infra e adb.exe em C:\tools\platform-tools. Adaptar uma vez aos nomes, caminhos e portas disponíveis da seção 0; documentar os comandos concretos em instalacao-pwa-framework.md.

1. Entregar arquivos prontos na raiz correta, preservando .env/volumes; não exigir montagem de patches. Informar build se não houver dist. Em erro persistente, conferir bytes lidos pelo contêiner antes de reinstalar ou mudar infra.
2. Na pasta infra, instalar dependências na primeira execução ou quando o lockfile mudar; correções sem mudança de dependências não exigem npm ci:

```bat
cd C:\var\www\infra
docker compose --profile dev run --rm --no-deps pwa-teste-node npm ci
```

3. Buildar e conferir código de saída zero, HTML principal, manifest, worker, dependências públicas e exclusões do cache. Arquivos parciais sw.js/workbox-*.js não comprovam sucesso. Se houver check:pwa implementado, executá-lo também pelo Docker; não recomendar scripts inexistentes.

```bat
docker compose --profile dev run --rm --no-deps pwa-teste-node npm run build
docker compose --profile dev run --rm --no-deps pwa-teste-node ls -l /app/dist/index.html /app/dist/manifest.webmanifest /app/dist/sw.js
```

frontend/vite.cmd build é alternativa. Em falha, resolver a primeira mensagem e interromper o fluxo.

4. Entregar npm run preview como `vite preview --host 0.0.0.0 --port 4173 --strictPort`. Iniciar uma única prévia e manter o terminal aberto:

```bat
docker compose --profile dev run --rm --no-deps -p 127.0.0.1:5177:4173 pwa-teste-node npm run preview
```

Não adicionar --service-ports: publicar somente 5177→4173, sem disputar a porta de desenvolvimento. O log localhost:4173 indica a porta interna; o Windows usa http://localhost:5177/. Ctrl+C encerra a prévia. Não criar outro Compose ou serviço permanente; preview serve o build, sem substituir Nginx de produção.

5. Conferir primeiro http://localhost:5177/ no Windows; somente após resposta correta, encaminhar por USB em outro terminal, com depuração autorizada:

```bat
C:\tools\platform-tools\adb.exe reverse tcp:5177 tcp:5177
C:\tools\platform-tools\adb.exe reverse --list
```

Abrir a mesma URL no Chrome Android, mantendo cabo e servidor ligados. ADB encaminha a porta do Windows, não a interna Docker; seu retorno não comprova disponibilidade HTTP. Selecionar o aparelho com -s se houver vários e refazer reverse após reconexão quando necessário.

| Modo | Porta interna | Porta Windows | URL Android por ADB |
|---|---|---|---|
| Desenvolvimento/HMR, sem SW | 5173 | 5176 | http://localhost:5176/ |
| Prévia do build/PWA | 4173 | 5177 | http://localhost:5177/ |

Para HMR, executar vite.cmd dev e adaptar os comandos ADB para 5176. Só mudar portas diante de conflito identificado, atualizando Docker, ADB, URL e documentação juntos.

#### Diagnóstico e encerramento

| Sinal | Ação |
|---|---|
| Entrada ausente no precache | Conferir arquivos efetivos e caminho no mount; corrigir reconhecimento e rebuildar. |
| Raiz retorna 404 | Conferir sucesso do build, dist/index.html, processo e porta; uma resposta HTTP não identifica a prévia correta. |
| Porta ocupada | Encerrar a prévia anterior com Ctrl+C; identificar o ocupante antes de mudar a porta. |
| Windows funciona e Android falha | Conferir autorização USB, aparelho, reverse --list e porta da URL. |
| Mesmo erro após atualização | Comparar arquivos efetivos do contêiner com a entrega; não repetir npm ci ou alterar Compose sem evidência. |

Listar somente os contêineres Node do projeto e preferir docker stop com o ID identificado:

```bat
docker ps --filter "label=com.docker.compose.service=pwa-teste-node" --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}"
```

Para encerrar todos os contêineres desse serviço, incluindo dev e prévias, somente quando essa interrupção for desejada, usar em CMD/Cmder interativo (em .bat, trocar %i por %%i):

```bat
for /f %i in ('docker ps -q --filter "label=com.docker.compose.service=pwa-teste-node"') do docker stop %i
```

Não executar parada global, down -v ou apagar volumes; preservar outros projetos e serviços compartilhados. Remover somente o encaminhamento de teste, sem reverse --remove-all:

```bat
C:\tools\platform-tools\adb.exe reverse --remove tcp:5177
```

Se necessário, reiniciar uma única prévia na mesma porta e refazer o reverse.

#### Instalação, offline e atualização

- Manter SW desativado em vite dev e ativo no build. Conferir proxy de API/CSRF ao Nginx e origens stateful ao introduzir outra porta; preview herda server.proxy quando preview.proxy não o sobrescreve. Status técnico não comprova login/sessão.
- Preparar online/offline e instalar pelo navegador compatível. Localhost por USB difere de HTTP por IP; publicação remota exige HTTPS. Registrar acesso, instalação, offline e atualização separadamente.
- Testar offline com DevTools remoto na aba Android: desligar Wi-Fi/dados pode manter localhost acessível por USB. Conferir shell, fontes, ícones, aviso offline e serviços sem confirmação. Não desligar MySQL compartilhado.
- Testar atualização entre dois builds com formulário alterado, cancelamento/confirmação de descarte e outra aba ativa. Rebuild não limpa cache; usar o fluxo normal de atualização. Para zerar testes, remover somente worker/caches da origem de teste.
- Registrar resultados, limitações e próximo passo em MEMORY.md. A prévia não substitui validar aplicativo, backend e headers no Nginx compartilhado. Não declarar aceites sem evidência.

Referências: [Vite preview](https://vite.dev/config/preview-options), [USB](https://developer.chrome.com/docs/devtools/remote-debugging/local-server), [contextos seguros](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

### Sprint 5 — Push Notifications

**Entregas:**

- Implementar o contrato push da seção 5 e a stack correspondente, com serviço central, persistência/APIs autenticadas, preferências/dispositivos, VAPID preservado e fila database.
- Integrar PushSettings/push.js à Hello e eventos ao SW único; sem alterar o contrato offline/atualização.
- Entregar operação/teste limitado no PHP-FPM e guia; validar com usuário de teste e sessão real isolada, sem login de produção inventado.
- Atualizar SDD/AGENTS/RULES e registrar evidências de fila/recebimento/clique ou pendências de aparelhos/HTTPS.

**Aceite:** cumprir os critérios de push da seção 5, preservando offline/atualização e o worker único. Não declarar entrega ao dispositivo com base apenas em job enfileirado, mock ou notificação local.

### Sprint 6 — Testes, evidências e fechamento

**Entregas:**

- Executar os testes da seção 13: lógica própria, PHP/MySQL isolado e Playwright cobrindo status/falha, formulário/máscara, componentes, Lucide, transições e estados push. Não repetir internals de bibliotecas.
- Comparação visual aprovada com fontes/dados/animações estáveis; conferir grid/responsividade, CSS compilado e ausência de listeners/overlays duplicados.
- Validar PWA/Hello no build/Nginx: instalação, offline, atualização preservando formulário e push com app aberto/fechado. Registrar aparelhos/versões; mocks não comprovam entrega.
- Validar dois clones e reexecução pelo contrato da seção 0: isolamento de pastas/portas/volumes/bancos/chaves, sem perda de dados, recursos duplicados ou reinstalação desnecessária.
- Cobrir Windows/Linux, espaços/mapeamento/identidade, dotenv especial, falha parcial, APP_ENV/HTTPS/--force, banco testing e privacidade. Registrar primeira instalação/atualização em produção; sem VPS, explicitar pendências.
- Conferir guia operacional e links/documentação pela seção 11; registrar somente no MEMORY resultados reais, simulações e próximo passo.

**Aceite:** checks aplicáveis passam; outra IA sem histórico reproduz a base e identifica o próximo passo. Imagens aprovadas acompanham o projeto; evidências e aparelhos/publicação pendentes ficam registrados.

### Definição de construção da fundação concluída

**Fundação concluída:** Hello oficial/Lucide/quatro transições, API/banco, design system, PWA/build, push, atalhos Windows e testes validados; documentação atualizada e bootstrap com dois clones isolados/reexecução comprovados. Arquivos criados ou OK fixo não satisfazem o aceite.

## 15. Definições pendentes da nova aplicação

- Identidade no arquivo central, objetivo e funcionalidades do produto.
- Repositório, domínio e porta local.
- Valores do arquivo central e disponibilidade dos recursos derivados, incluindo bancos principal e de testes.
- Identidade visual e primeiras telas a aprovar.
- Versões exatas compatíveis de Vue 3, framework7-vue, @vitejs/plugin-vue, Lucide, vite-plugin-pwa, WebPush/Workbox, Vitest, Playwright e PHPUnit, conforme a seção 1.
- Configuração final de Compose, Nginx, sessão e publicação, baseada na infraestrutura real.

Essas definições serão incorporadas à documentação conforme forem aprovadas.

## 16. Referências técnicas

- [Framework7 — Grid](https://framework7.io/docs/grid): colunas responsivas e espaçamento.
- [Framework7 Vue — inicialização](https://framework7.io/vue/init-app): integração e aplicação raiz.
- [Framework7 Vue — navegação](https://framework7.io/vue/navigation-router): rotas associadas a componentes Vue.
- [Vue — Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html): estrutura dos arquivos .vue.
- [Vite — opções do servidor](https://vite.dev/config/server-options): host, porta e configuração de desenvolvimento.
- [vite-plugin-pwa — guia](https://vite-pwa-org.netlify.app/guide/): integração Vite, registro e geração de service worker.
- [vite-plugin-pwa — atualização controlada](https://vite-pwa-org.netlify.app/guide/prompt-for-update): aplicação de novas versões em momento seguro.

## 17. Reutilização, versões e evolução da fundação

### Fundação e aplicativos derivados

Entregar repositório modelo/cópia versionada com código, lockfiles e bootstrap funcional. Cada aplicativo tem repositório/histórico próprios, sem dependência de runtime entre projetos. Bootstrap integra a fundação, não é melhoria opcional.

- Identificar cada release da fundação por versão e tag Git, usando versionamento semântico: correções, adições compatíveis e mudanças incompatíveis devem ser distinguíveis.
- Registrar no README de cada aplicativo a versão e o commit de origem da fundação e o ponto de referência das atualizações posteriormente incorporadas.
- Não aplicar atualizações sobrescrevendo o aplicativo. Comparar a release de origem com a release desejada, selecionar alterações pertinentes, adaptar conflitos e validar as personalizações do produto.
- Toda release da fundação deve descrever mudanças, requisitos, incompatibilidades e passos de atualização em suas notas de release. A documentação SDD do aplicativo descreve o resultado incorporado; MEMORY.md registra o andamento da incorporação.
- A versão da fundação é distinta da versão do aplicativo e do identificador do build da PWA.

### Criação de um aplicativo

Criar produtos pelo fluxo da seção 0, sem repetir sprints ou perguntar nome no chat. Gerar no README a identidade pública do central: projeto/pasta/domínios/portas, Node/volumes/bancos e versão/commit de origem. Comandos no guia.

Templates atualizam somente campos/blocos gerenciados; não realizar substituição global cega nem copiar configurações privadas de outro produto. Versionar o exemplo central, scripts e templates; excluir credenciais e estado local. A mudança de identidade depois da inicialização segue o plano explícito de migração da seção 0.

## 18. Convenções compartilhadas da implementação

### Organização frontend

Adotar os seguintes locais desde a criação do frontend e detalhar suas responsabilidades em docs/sdd/03-arquitetura.md:

| Caminho | Responsabilidade |
|---|---|
| frontend/src/main.js | Entrada JavaScript: integração Framework7 Vue, imports globais e montagem da aplicação |
| frontend/src/App.vue | Raiz Vue com f7-app, configuração pública e view principal |
| frontend/src/routes.js | Rotas Framework7 Vue associadas às páginas .vue e configuração de navegação |
| frontend/src/pages/ | Telas .vue e comportamento de página integrado ao ciclo de vida Vue/Framework7 |
| frontend/src/components/ | Componentes .vue compartilhados, criados conforme o uso e as regras do design system |
| frontend/src/services/api.js | HTTP centralizado, sessão/CSRF e erros |
| frontend/src/services/push.js | Adesão, cancelamento, reconciliação e preferência push |
| frontend/src/components/PushSettings.vue | Controles Framework7 e estados de push na Hello/produtos |
| frontend/src/sw.js | Worker único: precache/offline/atualização, push e notificationclick |
| backend/app/Services/PushNotificationService.php | Envio individual/em lote por Notifications/Jobs e VAPID |
| frontend/src/forms/ | Configurações compartilhadas de máscaras, conversões e validadores |
| frontend/src/css/ | Tokens e estilos compartilhados de layout/componentes |

Criar módulos por uso real; páginas reutilizam componentes/tokens/estilos. Extrair regras verificáveis dos handlers visuais.

### API e sessão

Antes do primeiro endpoint de negócio, registrar em docs/sdd/05-api.md o padrão de sucesso, erros, validação de campos, paginação e datas. Preservar o contrato técnico de status já definido neste README.

- Usar códigos HTTP coerentes; distinguir falta de autenticação (401), falta de permissão (403), validação (422), falha de CSRF/sessão (419) e indisponibilidade. Não transformar erro em resposta aparente de sucesso.
- Padronizar mensagem geral e erros por campo, aproveitando o formato de validação Laravel, e definir a resposta de paginação antes do primeiro endpoint paginado.
- Representar instantes em ISO 8601 com fuso explícito, preferencialmente UTC; representar datas civis sem horário como YYYY-MM-DD. Definir o fuso de exibição do produto e não converter datas civis como se fossem instantes.
- Documentar cookies, domínios stateful incluindo portas locais, middleware, headers de requisição, inicialização CSRF e envio do token pelo cliente HTTP. Verificar a configuração oficial do Sanctum: https://laravel.com/docs/12.x/sanctum.
- Validar sessão/CSRF por Vite/proxy e Nginx. Push exige sessão e ownership; usar usuário de teste isolado, sem liberar APIs ou credencial fixa em produção. Proxy não comprova login.
- Definir o comportamento de sessão expirada e preservação de formulários. Não reenviar automaticamente operações de gravação após recuperar a sessão sem garantir que isso não duplicará a operação.

### Acessibilidade

Adotar WCAG 2.2 AA: rótulos/erros associados, nomes de ícones, foco e teclado, gestão de foco em diálogos, contraste, ampliação e movimento reduzido. Validar jornadas com teclado/leitor de tela e registrar limitações; controles nativos não dispensam avaliação.

## 19. Publicação, backup e recuperação

Registrar procedimentos concretos em instalacao-pwa-framework.md antes da primeira publicação externa:

- Como preparar e validar uma release, instalar dependências, buildar, aplicar migrations e conferir saúde e jornadas críticas.
- Backup/restauração isolada de banco, arquivos e VAPID privadas, com retenção/acesso definidos. Rotação VAPID exige plano explícito de reinscrição; não compartilhar par entre produtos/ambientes.
- Como recuperar a release anterior, incluindo assets necessários aos clientes que ainda estejam usando a versão anterior da PWA. Evitar publicar HTML que aponte para assets ainda indisponíveis.
- Como manter compatibilidade entre clientes antigos, nova API e alterações de banco durante a atualização. Preferir mudanças aditivas e prever a retirada de estruturas em etapa posterior quando necessário.
- Distinguir rollback de código de recuperação de dados. Não presumir que uma migration reversa seja segura ou suficiente; registrar operações irreversíveis e o plano de recuperação antes de executá-las.
- Validar configuração/logs sem segredos e fila/Cron ativa. Na publicação, reiniciar worker quando aplicável; job enfileirado não comprova processamento/envio.

Sprints constroem a fundação; seção 0 rege clones. Aplicar convenções e registrar evidências por etapa. Publicação, aparelhos e entrega push real continuam pendentes até validação no ambiente correspondente.
