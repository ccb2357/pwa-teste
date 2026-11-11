# PWA Framework — fundação técnica reutilizável

Instalação desta entrega: [instalacao-pwa-framework.md](instalacao-pwa-framework.md). Estado real, evidências e próximo passo: [MEMORY.md](MEMORY.md).

**Instalação centralizada:** todos os passos e blocos Compose/Nginx ficam em [instalacao-pwa-framework.md](instalacao-pwa-framework.md). O bootstrap atualiza somente os blocos gerenciados desse guia, sem alterar a infraestrutura compartilhada.

Fundação reutilizável para PWAs com stack, padrões visuais, infraestrutura e documentação comuns. Primeiro construir e validar a base; depois criar produtos com nomes e funcionalidades próprios.

**Estado:** Sprint 1 concluída e validada no ambiente local Windows/Docker do responsável. Próxima etapa: Sprint 2 — frontend Framework7 Vue e página Hello. Fundação completa ainda em construção; evidências e demais aceites em MEMORY.md.

## 0. Construir uma vez, configurar e inicializar após cada clone

**A fundação será construída e validada uma vez pelas sprints da seção 14. Cada novo produto recebe essa base pronta por clone ou cópia versionada; não repetir as sprints, recriar Laravel/Vite nem perguntar obrigatoriamente o nome no chat.** A identificação vem do arquivo central. PWA Framework identifica a fundação, não define automaticamente o nome dos produtos.

### Fluxo de reutilização

1. Clonar uma release pronta na pasta do novo projeto.
2. Copiar .env.foundation.example para .env.foundation na raiz e preencher os dados locais.
3. Preparar o executor e todos os trechos de integração do Compose/Nginx, seguindo instalacao-pwa-framework.md. Conferir nomes, caminhos e portas com o central e a infraestrutura atual antes de aplicar; não copiar valores de outro produto.
4. O responsável aplica manualmente todas as alterações, valida o Compose, disponibiliza o mount PHP e valida/recarrega o Nginx. Não executar o bootstrap local antes dessa preparação.
5. Executar o bootstrap pelo serviço pwa-foundation-bootstrap. Ele confere a infraestrutura efetiva, atualiza os trechos do guia e inicializa o backend. Se encontrar divergências, para com código 2: aplicar somente as pendências, validar os serviços afetados e repetir o comando. Integração de frontend/build segue as sprints correspondentes.

**INSTRUÇÃO OBRIGATÓRIA PARA A IA QUE EXECUTAR ESTE README: criar e entregar o bootstrap funcional em Node.js conforme todas as especificações desta seção e as entregas das sprints.** A entrada é scripts/bootstrap/index.mjs, executada pelo Docker em Windows e Linux. Implementar os arquivos JavaScript, módulos, templates, Dockerfile e entrypoint do executor, além do trecho de inclusão manual do serviço pwa-foundation-bootstrap no Compose compartilhado. Não limitar a entrega a documentação, pseudocódigo ou instruções para o usuário programar depois. Não presumir que o inicializador já exista: verificar os arquivos do projeto e criar o que estiver ausente, completando ou corrigindo o que já existir para atender ao contrato. A inicialização de cada clone é distinta da construção da fundação e do app:sync, que continua restrito a limpeza de caches e migrations.

**Ordem de implementação:** Sprint 0 define o contrato e mapeia a infraestrutura; Sprint 1 cria o executor e o bootstrap executável com preparação da infraestrutura e backend/bancos; Sprint 2 integra dependências e configuração do frontend; Sprint 4 integra build e verificações finais; Sprint 5 valida reexecução, isolamento, portabilidade e os fluxos local/produção. Cada etapa deve entregar o código correspondente, atualizar o SDD e registrar em MEMORY.md o que foi entregue, instalado, validado ou permanece pendente. A aplicação manual de alterações na infraestrutura não elimina a obrigação de entregar os arquivos do inicializador prontos para uso.

### Arquivo central: .env.foundation

Fonte de entrada única para os valores compartilhados de cada projeto/ambiente. Versionar somente .env.foundation.example sem segredos; ignorar .env.foundation e os arquivos derivados com credenciais. Incluir explicitamente no .gitignore .env.foundation, .foundation-state.json e os .env privados derivados, mantendo os exemplos versionados. Cada máquina mantém sua própria configuração local, inclusive a produção; não copiar senhas locais automaticamente para a VPS.

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
| PWA | Nome principal vem de PROJECT_NAME; nome curto pode assumir esse valor. Descrição e cores têm padrões do modelo. Identidade gráfica definitiva e ícones seguem aprovação. |

Derivar do slug o serviço <slug>-node, os volumes <slug_com_sublinhados>_vendor e <slug_com_sublinhados>_node_modules, o cookie de sessão exclusivo e o identificador estável do manifest. Derivar caminhos internos da raiz configurada e da pasta, mounts da relação real entre infra e projeto e origens stateful dos domínios/portas. Exemplo: pwa-teste → pwa-teste-node, pwa_teste_vendor e /var/www/pwa-teste/backend. Não manter esses valores para edição manual em múltiplos arquivos.

Tokens, fontes, estilos e variações permanecem no design system; versões de dependências nos manifests/lockfiles e versão de origem nos metadados da release. As cores do manifest devem acompanhar a identidade aprovada, sem gerar tokens CSS arbitrariamente. A APP_KEY é gerada por aplicativo e preservada no backend; não deve estar preenchida na release modelo.

### Execução portátil em Node.js pelo Docker

**Decisão aprovada:** implementar toda a lógica em JavaScript com módulos ES, usando Node 22 da infraestrutura Docker. Não exigir Node, PHP, Composer nem instalação npm prévia no computador Windows ou na VPS Linux. Docker Engine/Docker Desktop funcional e Docker Compose são pré-requisitos. O comando node no terminal do host não fica disponível apenas porque existe uma imagem Node no Docker.

Na infraestrutura de referência recebida, minhas-financas-node e clima-node usam node:22-alpine, mas montam somente as pastas de seus próprios aplicativos. Não usar esses serviços para inicializar outro produto. O PHP-FPM já incorpora Composer; reutilizá-lo. Esses dados descrevem os arquivos analisados, não comprovam contêineres em execução. Não copiar credenciais desses arquivos para a fundação.

Preparar um serviço compartilhado **pwa-foundation-bootstrap**, executado sob demanda por docker compose run --rm, no único Compose da infraestrutura. Ele não é o serviço <slug>-node do frontend e deve funcionar antes de esse serviço existir. Sua primeira inclusão e eventuais ajustes continuam manuais: entregar na Sprint 1 um template completo e suas instruções, sem depender do próprio bootstrap para criar o serviço que o executa. Não criar outro Compose nem manter um daemon Node de bootstrap em produção.

Contrato obrigatório do executor a implementar:

- Imagem baseada em node:22-alpine, com Docker CLI **e plugin Docker Compose** disponíveis e compatíveis; a imagem Node pura não inclui essas ferramentas. Entregar Dockerfile e comandos de build, fixando as versões efetivas após validação.
- Montar a raiz compartilhada de projetos e a pasta infra, tornando scripts, arquivo central e Compose acessíveis. O serviço recebe --project com o caminho interno do projeto e executa o index.mjs daquele projeto, sem depender do código de outro aplicativo. Validar o alvo e restringi-lo à raiz de projetos configurada.
- Acesso ao Docker Engine existente pelo socket configurado e permissões necessárias, sem Docker-in-Docker. Validar o funcionamento no Docker Desktop em Windows e no Linux; não pressupor que o socket conceda acesso sem testar.
- Ao executar Compose de dentro do contêiner, preservar a identidade do projeto Compose compartilhado, perfis e arquivos efetivamente usados. Resolver os caminhos de bind mounts para o host do daemon: /var/www dentro do executor não é automaticamente um caminho válido no Windows/Linux do host. Implementar e documentar um mapeamento explícito entre caminhos internos e caminhos do host, consultando mounts efetivos quando disponíveis. Não repassar cegamente caminhos internos ao daemon nem criar uma segunda pilha por mudança de diretório ou nome Compose. Se faltar esse mapeamento, interromper com instrução específica.
- Resolver caminhos com APIs node:path/node:url e executar processos com node:child_process, argumentos separados e shell desativado sempre que possível. Não depender de CMD, PowerShell, Bash ou de utilitários do host para a lógica. Preservar espaços, aspas e caracteres especiais; não interpolar credenciais em comandos.
- Carregar dotenv como dados usando parser disponível antes da instalação do frontend. Qualquer dependência do executor deve estar fixada e instalada na imagem/lockfile próprio do executor; ele não pode depender do node_modules do aplicativo que ainda está sendo preparado.
- Saídas: 0 para conclusão validada, 1 para erro, 2 para infraestrutura/aplicação manual pendente. Encaminhar corretamente o código ao terminal; registrar estados sem segredos. A disponibilidade de portas no host deve ser conferida por mecanismo apropriado ao host, sem interpretar uma porta livre dentro do executor como prova de disponibilidade no Windows/VPS.

Exemplo de interface a entregar, executada na pasta infra pelo Prompt de Comando (CMD) no Windows ou pelo terminal Linux, supondo a raiz interna /var/www e o serviço já integrado:

```text
docker compose run --rm pwa-foundation-bootstrap --project /var/www/meu-projeto
```

O entrypoint do serviço deve localizar e executar /var/www/meu-projeto/scripts/bootstrap/index.mjs. O argumento --project localiza o arquivo central; a identidade continua vindo dele. Adaptar a raiz ao mount real e documentar os comandos concretos em instalacao-pwa-framework.md. O exemplo é contrato de implementação, não comando já disponível nos arquivos recebidos.

### Localhost, primeira instalação na VPS e atualizações

**A escolha do ambiente vem exclusivamente de APP_ENV no .env.foundation do projeto alvo.** Aceitar somente local ou production; valor ausente/inválido interrompe a execução. Não inferir ambiente pelo sistema operacional, hostname, IP, existência de domínio ou execução em Docker. Não oferecer fallback silencioso para local e não permitir que um argumento contradiga o arquivo central.

| Regra | Localhost | VPS/produção |
|---|---|---|
| APP_ENV | local | production |
| URL efetiva do Laravel | Derivada de LOCAL_DOMAIN | PRODUCTION_URL obrigatória, HTTPS |
| APP_DEBUG derivado | true | false |
| Bancos e credenciais | Configuração local | Configuração própria de produção |
| Sessão/Sanctum/CSRF | Origens locais e portas efetivamente utilizadas | Domínio HTTPS efetivo; cookies seguros |
| Testes destrutivos | Apenas no ambiente testing isolado e banco exclusivo | Bloqueados |
| Migrations | Pelo app:sync | Pelo app:sync, com --force explicitamente informado |

Cada máquina possui seu próprio .env.foundation e .foundation-state.json, ignorados no Git. O arquivo versionado é somente .env.foundation.example. git pull preserva a configuração privada porque ela nunca deve estar rastreada; conferir essa condição antes de distribuir a fundação. Mudanças no schema devem apontar campos faltantes sem sobrescrever valores locais com os do exemplo. Estado e evidências de localhost não comprovam preparação da VPS.

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

1. Preparar Docker/Compose e mapear a infraestrutura efetiva da VPS; não presumir que caminhos, mounts e serviços sejam iguais aos locais. Integrar manualmente o executor pwa-foundation-bootstrap se ainda não existir.
2. Fazer git clone do repositório do aplicativo, ou git pull se já houver checkout, mantendo o slug e a pasta coerentes. Não repetir sprints nem recriar Laravel/Vite.
3. Criar .env.foundation na VPS a partir do exemplo e preencher APP_ENV=production, PRODUCTION_URL HTTPS, caminhos, serviços e credenciais de produção. Nunca levar automaticamente o arquivo local para a VPS.
4. Executar o mesmo bootstrap. Ele valida os dados e prepara os trechos necessários de Compose/Nginx, incluindo as necessidades de HTTPS, sem modificar a infraestrutura. Aplicar manualmente os ajustes, disponibilizar os serviços e certificado e validar as configurações.
5. Reexecutar o bootstrap para instalar dependências pelos lockfiles, sincronizar configurações privadas, gerar APP_KEY somente se ausente, preparar bancos permitidos, buildar e validar a integração. Para migrations em produção, informar --force explicitamente; sua ausência impede a execução de migrations e a declaração de conclusão.
6. Registrar verificações reais, versão publicada e eventuais pendências. Não declarar publicação concluída com HTTPS ou integração ainda pendentes.

Exemplo de reexecução autorizando migrations em produção, com o executor já integrado:

```text
docker compose run --rm pwa-foundation-bootstrap --project /var/www/meu-projeto --force
```

**Atualizações posteriores:** seguir backup e publicação da seção 19, fazer git pull da revisão desejada e reexecutar o mesmo bootstrap, informando --force para migrations de produção. Comparar lockfiles e estado real para instalar/atualizar dependências e reconstruir saídas quando necessário; aplicar somente migrations pendentes. Se houver mudança de infraestrutura, gerar os trechos e parar com código 2 até a aplicação manual, retomando depois. Preservar APP_KEY válida, dados, volumes, configurações privadas e personalizações. Nunca restaurar Hello sobre a página inicial do produto nem copiar dados locais para produção. Transferência de dados exige procedimento separado de exportação/importação; Git e bootstrap não transportam bancos.

Não tratar --force como autorização geral para operações destrutivas ou alterações automáticas na infraestrutura: ele se limita à exigência das migrations em produção. A reexecução não dispensa os procedimentos de backup, compatibilidade e recuperação da seção 19.

### Contrato do bootstrap após o clone

**Preparação, disponível antes do serviço Node do projeto existir:**

- Entregar scripts/bootstrap/index.mjs, módulos, templates e os arquivos do executor Docker versionados em scripts/bootstrap/. Executar pelo serviço compartilhado pwa-foundation-bootstrap conforme o contrato acima, sem depender do serviço Node do aplicativo nem de runtimes instalados no host. Não criar outro Compose. Eventuais atalhos .cmd/.sh não devem conter lógica própria ou ser necessários ao fluxo portátil.
- Validar arquivo central, sintaxe, valores obrigatórios, portas, identificadores, cores, caminhos e Docker/Compose. Ler dotenv como dados, sem executar o conteúdo como script; tratar espaços, aspas e caracteres especiais de senhas corretamente, sem imprimi-las ou passá-las em argumentos visíveis.
- Detectar conflitos de nomes/portas com outros projetos, distinguindo recursos já pertencentes ao clone. Comparar a configuração desejada com o estado efetivo, sem confiar somente em marcadores de execuções anteriores.
- Preparar nos blocos gerenciados de instalacao-pwa-framework.md os trechos mínimos de Compose e Nginx, destinos e instruções de aplicação, sem credenciais. Reutilizar serviços/rede existentes e declarar somente serviço Node, mounts, volumes e site que faltarem. O responsável modifica a infraestrutura compartilhada, valida a sintaxe, recria os serviços necessários e recarrega o Nginx.
- Se faltarem alterações ou serviços, terminar com estado explícito de pendência e código distinto de sucesso/falha, documentado em 04-ambiente.md. Não prosseguir à instalação nem declarar pronto. Se a infraestrutura já estiver correta, avançar na mesma execução.

**Inicialização, após a infraestrutura estar disponível:**

- Conferir config Compose, serviços, runtime PHP/Composer, mounts vendor/node_modules, rede, portas e encaminhamento Nginx. Não iniciar/recriar serviços compartilhados ou alterar seus arquivos automaticamente.
- Instalar dependências PHP e JavaScript pelos lockfiles no PHP-FPM/Node configurados, somente quando ausentes ou desatualizadas; não recriar os esqueletos. Preparar permissões restritas ao projeto.
- Gerar/sincronizar as chaves gerenciadas de backend/.env e backend/.env.testing a partir do central, preservando outras configurações e APP_KEY válida. Gerar chave somente se ausente. Atualizar somente saídas e blocos gerenciados; não sobrescrever código, design system ou personalizações do produto.
- Produzir configurações públicas selecionadas para Vite, frontend e manifest, além dos atalhos e metadados sem segredos. Não expor o arquivo central inteiro ao build, a variáveis VITE_ ou a diretórios públicos. Backend usa as credenciais; frontend recebe somente a lista explícita de campos públicos.
- Conectar ao MySQL usando DB_USERNAME/DB_PASSWORD exatamente como informados, inclusive root quando configurado. Conferir ambos os bancos e criar apenas os bancos ausentes se essa conta tiver permissão. Se não tiver, indicar sua criação manual e interromper; não tentar criar usuários, alterar senhas ou conceder/revogar grants.
- Bloquear banco de testes igual ao principal. Antes de qualquer teste destrutivo, conferir APP_ENV=testing na configuração efetiva do processo, conexão/servidor e DB_DATABASE igual a DB_TEST_DATABASE central, distinto do principal; não aceitar fallback para o banco principal, mesmo com credenciais iguais.
- Limpar caches e aplicar migrations pendentes no banco principal pelo contrato app:sync. Preparar migrations do banco de testes somente pelo fluxo isolado de testes. Não executar migrate:fresh, reset, drop ou seeders como rotina de bootstrap. Em produção, exigir --force explícito repassado às migrations e seguir a seção 19; não preparar/executar testes destrutivos nesse ambiente.
- Gerar o build e validar /up, /status e /api/v1/status, frontend servido pelo Nginx e ausência de respostas HTML nas rotas API. Entregar a página Hello na rota / e informar sua URL ao final, com verificações executadas e pendências. Preparar cookies/CSRF conforme as origens reais; bootstrap concluído não comprova instalação em aparelho real. Após substituir a Hello pela página inicial do produto, reexecutar o bootstrap não pode restaurá-la ou sobrescrever as rotas personalizadas.

**Reexecução e isolamento:** preservar dados, credenciais, chave, volumes e personalizações; não duplicar recursos, repetir instalações sem necessidade ou anunciar sucesso após falha. Guardar estado técnico local sem segredos em .foundation-state.json, ignorado no Git, interromper no primeiro erro com código não zero e retomar conferindo o estado real. Mudança de slug, pasta, bancos ou volumes após inicialização exige plano explícito de migração; não migrar ou renomear dados automaticamente. Logs, metadados e documentação não podem conter senhas; falhas de configuração não devem imprimir o conteúdo bruto do arquivo.

Incluir no pacote modelo somente código, templates, lockfiles, documentação e recursos públicos da fundação. Não clonar .env preenchidos, APP_KEY, dados de banco, sessões, caches, dependências instaladas ou estado de bootstrap de outro projeto. O inicializador atualiza a identificação documental por blocos delimitados sem reescrever especificações ou histórico; os comandos concretos ficam em instalacao-pwa-framework.md, e andamento/decisões em MEMORY.md.

### Construção inicial e mudanças de infraestrutura

Na construção da fundação e ao assumir ou retomar análise/alteração de infraestrutura, solicitar ao responsável os arquivos atuais necessários da tabela abaixo. A infraestrutura pode ter mudado; mapeamentos históricos e templates do projeto não comprovam sua configuração atual. Não manter cópias desses arquivos dentro do projeto, nem mesmo sanitizadas. Reutilizar arquivos atuais já enviados na mesma sessão enquanto não houver indicação de mudança.

| Arquivo solicitado | O que conferir |
|---|---|
| `infra/docker-compose.yml` ou arquivo Compose realmente utilizado | Serviços, perfis, portas, redes, mounts, volumes, imagens e nomes existentes |
| Dockerfile do PHP-FPM, com o nome/caminho real | Versão PHP, extensões, Composer incorporado e processo de build |
| Configuração principal Nginx, por exemplo `infra/nginx/default.conf` montada como `nginx.conf` | Bloco http, includes, limites e relação com os arquivos de sites |
| Arquivo de sites Nginx ativo, por exemplo `infra/nginx/sites_local.conf` | Hosts existentes, roots, encaminhamento ao PHP-FPM e rotas |
| `php.ini` utilizado pela imagem | Timezone, limites, logs e configuração de extensões |

Pedir também o entrypoint e outros arquivos incluídos **somente se forem externos e necessários à análise**. Se o entrypoint estiver embutido no Dockerfile, não solicitar um arquivo separado. Confirmar a localização real das pastas `infra/` e do projeto; não presumir que um nome de arquivo determina seu destino no contêiner.

Solicitação sugerida: **“Envie o Compose, o Dockerfile do PHP-FPM, a configuração principal do Nginx, o arquivo de sites ativo e o php.ini, removendo senhas, tokens e chaves. Informe também onde ficam as pastas infra e do projeto.”** Não solicitar `.env`, chaves privadas ou senhas reais. Preservar os caminhos, nomes e estrutura necessários à revisão nas cópias sem segredos.

A documentação inicial pode avançar enquanto esses arquivos são reunidos, registrando as lacunas. Não inventar infraestrutura, criar uma pilha independente ou declarar a Sprint 0 da construção concluída sem realizar seu mapeamento.

### Análise e validação inicial da infraestrutura

1. Mapear os arquivos em conjunto: origem e destino dos mounts, rede, nomes de serviços/contêineres, portas, volumes declarados e utilizados, includes do Nginx, configuração PHP e dependências já incorporadas à imagem.
2. Verificar o que já existe para o novo projeto. Não duplicar serviço Node, site, volume ou Composer. Se Composer já estiver na imagem, conferir e usar esse executável; o contêiner temporário é alternativa quando necessário.
3. Preparar somente as alterações necessárias e apresentar os trechos exatos e sua localização. **Neste fluxo, o responsável aplica manualmente as mudanças na infraestrutura compartilhada, salvo instrução explícita em contrário.** Não apresentar uma alteração preparada como já aplicada.
4. Solicitar em um único bloco as verificações aplicáveis: validação Compose com perfil dev (`config --quiet`), estado dos serviços (`ps -a`), PHP (`php -v` e `php -m`), Composer (`composer --version`), sintaxe Nginx (`nginx -t`) e disponibilidade da porta selecionada no sistema do responsável. Adaptar os comandos aos nomes, caminhos e shell reais; registrar os comandos concretos em `instalacao-pwa-framework.md`.
5. Se os contêineres não existirem ou estiverem parados, orientar a criação/inicialização somente dos serviços necessários e depois repetir as verificações que falharam. Não iniciar todos os serviços do perfil dev indiscriminadamente; pode haver portas compartilhadas entre outros projetos. Não apagar volumes para resolver inicialização.
6. Separar configuração declarada, alteração aplicada pelo responsável, validação relatada e teste executado pelo agente. `config --quiet` não comprova contêiner recriado, mount efetivo ou banco conectado; conferir o mount vendor antes da instalação e os demais recursos antes de seu primeiro uso.
7. Registrar em MEMORY.md as evidências, versões efetivas, pendências e o próximo passo. Incorporar o mapeamento a `04-ambiente.md` e à arquitetura quando afetada. Registrar o contrato técnico e as evidências com seu contexto, sem guardar cópias dos arquivos da infraestrutura compartilhada. Outra IA deve solicitar os arquivos atuais antes de analisar ou alterar a infraestrutura; os trechos próprios de integração da aplicação ficam em instalacao-pwa-framework.md.

**Outra IA deve solicitar ao responsável os arquivos atuais necessários à análise de infraestrutura.** Não substituir essa solicitação por cópias arquivadas ou pelo histórico. Na mesma sessão, reutilizar os arquivos atuais já enviados enquanto não houver indicação de mudança. Esses passos devem constar de AGENTS.md e RULES.md dos projetos derivados.

## 1. Stack tecnológica

| Camada | Tecnologia e finalidade |
|---|---|
| Interface | Framework7 **9.2.0** com a integração oficial **framework7-vue**, para componentes e navegação com foco mobile |
| Framework frontend | **Vue 3**, usando Single-File Components (.vue), Composition API e script setup em JavaScript |
| Linguagem frontend | JavaScript com módulos ES e templates Vue, sem TypeScript |
| Estilos | CSS do Framework7 + **Tailwind CSS 4** para composição dos layouts, sem Preflight, com tema vinculado ao design system; CSS próprio compartilhado quando necessário |
| Ícones | Framework7 Icons **5.0.5** e Lucide Icons, pelo pacote **lucide** |
| Tipografia | Nunito variável local: copiar a fonte padrão do repositório de referência (ex.: nunito.woff2) para frontend/public/fonts/ na fundação, sem CDN. Definir @font-face e variável global em tokens.css, com fallback system-ui, sans-serif. Trocas exigem fonte aprovada, arquivos locais e atualização de 02-design-system.md. Todos os projetos recebem a mesma fonte inicial. |
| Máscaras de entrada | **IMask 7.6.1**, pacote imask |
| Validação de formulários | **JustValidate 4.3.0**, pacote just-validate |
| Testes de lógica frontend | **Vitest** |
| Testes de navegador e regressão visual | **Playwright** |
| Testes backend | **PHPUnit**, integrado às ferramentas de teste do Laravel |
| Desenvolvimento e build | Vite **8.3.4** com **@vitejs/plugin-vue** para .vue e **@tailwindcss/vite** para utilitários CSS |
| Ambiente Node | Imagem Docker **node:22-alpine** |
| PWA | **vite-plugin-pwa**, com geração do service worker pelo Workbox |
| Backend/API | Laravel **12.70.0** |
| PHP | PHP **8.2.x**, executado com PHP-FPM |
| Dependências PHP | Composer 2, com dependências fixadas pelo composer.lock |
| Banco | MySQL **8.0** |
| Autenticação | Sessão Laravel e Sanctum, com cookies e proteção CSRF |
| Servidor web | Nginx |
| Infraestrutura | Docker Compose, reaproveitando os serviços existentes |
| HTTPS | Let's Encrypt e Certbot |
| Versionamento | Git, com branch principal **master** |

A interface utiliza Framework7 com Vue 3 por meio do pacote oficial framework7-vue. Manter JavaScript, sem React ou TypeScript. As APIs Core do Framework7 continuam disponíveis quando necessárias, integradas ao ciclo de vida Vue; não manter uma segunda aplicação Core independente.

As versões acima são a referência aprovada nesta conversa. Fixar na implementação as versões exatas de vue, framework7-vue, @vitejs/plugin-vue, tailwindcss, @tailwindcss/vite, lucide, vite-plugin-pwa e ferramentas de teste após conferir documentação oficial, peerDependencies, engines e compatibilidade com as versões aprovadas de Framework7, Vite, Node e PHP. framework7 e framework7-vue devem ter versões correspondentes compatíveis; alinhar tailwindcss e @tailwindcss/vite e conferir os navegadores mínimos suportados pelo Tailwind 4 em relação aos dispositivos alvo. Não atualizar a stack silenciosamente caso exista impedimento. Os lockfiles serão a referência para instalações reproduzíveis; este README não representa uma instalação já validada.

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
│   │   ├── components/  # Componentes .vue reutilizáveis, criados conforme o uso
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
| frontend/src/ | Inicialização, navegação, telas, componentes compartilhados, estilos e cliente da API |
| frontend/src/css/tokens.css | Fonte dos valores visuais compartilhados, mapeados às variáveis Framework7 e ao tema Tailwind |
| frontend/src/css/tailwind.css | Entrada dos utilitários Tailwind, sem Preflight, com prefixo e mapeamento dos tokens aprovados |
| frontend/public/ | Manifest, ícones de instalação, fontes locais e arquivos estáticos |
| frontend/vite.config.js | Plugins Vue/Tailwind/PWA, proxy e entrada do aplicativo, com valores públicos derivados do central |
| frontend/dist/ | Arquivos compilados servidos pelo Nginx em produção |
| frontend/src/components/ | Componentes .vue de composição/personalização do Framework7 Vue, criados progressivamente conforme o design system |
| frontend/src/pages/hello.vue | Página Hello na rota /, com demonstrações oficiais, status real da API/banco e experiência PWA |
| backend/ | Laravel, API, autenticação, regras de negócio, modelos e migrations |
| docs/sdd/ | Especificações detalhadas e atualizadas do projeto |
| docs/telas/ | Imagens locais de propostas e referências aprovadas, organizadas por tela |

O design system é documentado em docs/sdd/02-design-system.md e implementado nos tokens, estilos e componentes compartilhados do frontend.

## 3. Composer e desempenho no Windows

Manter o código no mount Windows e **backend/vendor em volume Docker exclusivo por projeto**, para reduzir a lentidão de leitura das dependências. Conferir o mount efetivo antes de instalar; declarar o volume no Compose não comprova sua aplicação no contêiner ativo.

Executar Composer no PHP-FPM, com o PHP e as extensões da aplicação. Reutilizar o executável incorporado à imagem; se ausente, criar um contêiner temporário composer:2, copiar seu executável para o PHP-FPM e remover o temporário. As dependências permanecem no volume vendor.

Garantir escrita de www-data em backend/storage/ e backend/bootstrap/cache. Ajustar ownership somente nos caminhos necessários do projeto; o entrypoint não dispensa essa conferência. Se o mount exigir recriação do PHP-FPM, informar a breve interrupção dos sites compartilhados e recriar somente o serviço necessário. Nomes e caminhos seguem a infraestrutura mapeada na seção 0.

## 4. Desenvolvimento, build e produção

**REGRA PERMANENTE — NÃO INSTALAR NODE/NPM NO WINDOWS.** Executar dependências, desenvolvimento, build e testes JavaScript pelo Docker ou atalhos do projeto. Toda instrução operacional deve informar pasta e comando Docker completo com o serviço real; nomes de scripts npm podem constar na especificação, mas não devem ser apresentados como comandos diretos para o host.

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

1. Somente na construção inicial, se backend/ estiver vazio, criar o esqueleto oficial em diretório temporário sem conflito com vendor montado. Fixar laravel/framework e registrar a origem de laravel/laravel, cujo versionamento é distinto. Clones recebem o backend pronto: usar composer install pelo lockfile, nunca create-project.
2. Preparar .env.example sem segredos. O bootstrap deriva APP_URL, DB_CONNECTION=mysql e conexão de backend/.env e backend/.env.testing do arquivo central (seção 0). Não editar valores compartilhados nos arquivos derivados; conferir os bancos reais sem presumir execução de scripts init do MySQL.
3. Preservar APP_KEY válida, dados e configurações não gerenciadas dos .env. Sincronizar credenciais somente pelos campos centrais; não gerar senhas, concatenar/regenerar chaves ou solicitar segredos no chat.
4. Preparar os bancos principal e de testes distintos com a conta existente definida no central. root é aceito quando informado. Não criar usuários, gerar senhas nem alterar grants; se faltar permissão para criar banco, orientar criação manual.
5. Conferir conexão e isolamento dos testes conforme a seção 0, sem credenciais administrativas adicionais, valores hardcoded ou exposição de segredos.
6. Garantir limpeza de cache antes das migrations; se depender de tabela ainda ausente, usar configuração inicial apropriada, como cache em arquivo. Aplicar php artisan migrate. Após mudanças no .env, executar php artisan config:clear, php artisan route:clear e php artisan view:clear.
7. Integrar a instalação ao bootstrap Node scripts/bootstrap/index.mjs, executado pelo Docker conforme a seção 0, com caminhos independentes do diretório do terminal e interrupção no primeiro erro. Não criar um segundo instalador com contrato divergente; publicar o procedimento em 04-ambiente.md.

Entregar código, composer.json, composer.lock, migrations, testes e exemplos de ambiente. Identificar precisamente o que não pôde ser instalado ou validado.

### Comando operacional `app:sync`

Criar este comando Artisan próprio na Sprint 1. Executar optimize:clear e, somente após sucesso, migrations pendentes. Interromper e propagar qualquer falha com código diferente de zero, sem anunciar sucesso parcial. Não instalar dependências, buildar, executar seeders, apagar dados ou regenerar APP_KEY.

Em produção, exigir --force explícito antes de alterar o ambiente e repassá-lo às migrations; documentar publicação, backup e recuperação em 04-ambiente.md. Validar também o caso sem migrations pendentes.

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
import 'framework7/css/bundle.css';
import 'framework7-icons/css/framework7-icons.css';
```

O caminho `framework7/framework7-bundle.css` **não resolve** (não está no `exports`) — o exemplo adotado é `framework7/css/bundle.css`, sujeito à conferência dos exports da versão instalada antes da implementação. Assim o CSS é embutido no bundle pelo build e segue o versionamento do `package-lock.json`, sem cópias manuais em `public/`.

Trecho mínimo ilustrativo de frontend/vite.config.js (complementado pelo plugin PWA e entradas do build nas sprints). O bootstrap deve fornecer target, Host e portas pelos valores públicos derivados da configuração central, sem editar estes literais a cada clone:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const backendProxy = () => ({
  target: 'http://nginx',
  changeOrigin: true,
  headers: { Host: 'novo-projeto.localhost' },
});

export default defineConfig({
  plugins: [vue(), tailwindcss()],
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

O exemplo usa novo-projeto.localhost como server_name do site no Nginx e 5173 como porta interna do Vite. No Compose, publicar por exemplo 127.0.0.1:5176:5173, se 5176 estiver disponível: o acesso no Windows será http://localhost:5176. Ajustar a porta externa ao ambiente e manter a interna coerente com server.port. O DNS nginx é resolvido pela rede Docker infra_network. O trecho acima não é a configuração final completa da PWA.

### Tailwind CSS como apoio aos layouts

**Framework7 Vue fornece os controles e sua navegação; Tailwind organiza os layouts. Ambos seguem o mesmo design system.** Usar utilitários para flex/grid, espaçamentos, alinhamentos, dimensões e responsividade, sem recriar botões, inputs ou modais já disponíveis no Framework7.

- Instalar tailwindcss e @tailwindcss/vite como dependências de desenvolvimento, em versões exatas compatíveis pelo Docker. Integrar o plugin ao Vite e importar frontend/src/css/tailwind.css uma única vez pela entrada global; compilar no build, sem CDN ou servidor adicional.
- **Desativar Preflight:** importar somente as partes necessárias de tema/utilitários, omitindo tailwindcss/preflight.css. Não usar a importação completa que reintroduz o reset. Preservar os estilos base do Framework7.
- Adotar prefixo tw para utilitários e variáveis do Tailwind, usando a sintaxe da versão fixada, para reduzir colisões de nomes. Validar a ordem de imports e as camadas CSS com o Framework7; prefixo não resolve precedência. Não aplicar important global ou overrides genéricos para forçar utilitários sobre os controles.
- Mapear o tema aos valores de tokens.css e às variáveis Framework7 correspondentes. Não duplicar valores de cores, tipografia, espaçamentos, raios e sombras; restringir as opções visuais ao design system aprovado. Usar @theme inline quando o mapeamento referenciar outras variáveis, conforme a versão adotada. Tema Tailwind não é um novo grupo de configurações em .env.foundation.
- Manter classes completas identificáveis nos arquivos .vue/JS para detecção pelo build; usar mapas de classes para variações dinâmicas. Não montar nomes por concatenação que impeça sua geração. Verificar detecção a partir dos mounts reais.
- Personalizar controles Framework7 prioritariamente por suas variáveis CSS; reservar utilitários aos layouts e às composições aprovadas. CSS próprio continua permitido quando necessário, compartilhado nos locais responsáveis. Classes arbitrárias não autorizam novos valores visuais fora do design system.

Documentar integração, prefixo, camadas e mapeamento de tokens em 02-design-system.md. Validar no desenvolvimento e no build os layouts, fontes, ícones e estados dos controles após a inclusão, sem regressão visual causada pelo reset ou pela cascata.

### Inicialização Vue e navegação

Em frontend/src/main.js, instalar a integração Framework7Vue no Framework7, criar a aplicação Vue a partir de App.vue, registrar os componentes oficiais utilizados e montar em #app. App.vue contém f7-app e a view principal; recebe as configurações públicas derivadas do arquivo central. Usar o mecanismo de registro da versão fixada, conferindo imports/exports oficiais.

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

Preservar os serviços, volumes e projetos já existentes. Fazer somente as adições necessárias ao novo projeto. Não copiar nomes, caminhos de Minhas Finanças ou valores de credenciais do Compose apresentado para a nova aplicação ou para a documentação. Os nomes finais devem coincidir entre Compose, vite.cmd, configuração Vite, Nginx e documentação.

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
- Não instalar dependências automaticamente: executar npm ci pelo Docker antes do primeiro uso ou quando o lockfile exigir. Serviço, mounts, volume e porta seguem a tabela de integração; registrar comandos e pré-requisitos em 04-ambiente.md.

## 5. Recursos da PWA

A fundação deve incluir:

- Manifest com nome, cores, ícones e exibição standalone.
- **vite-plugin-pwa** integrado ao build do Vite, utilizando Workbox com a estratégia **generateSW** para gerar o service worker.
- Cache dos arquivos estáticos e página de indisponibilidade offline.
- Identificação da versão do build.
- Atualização automática com tratamento para preservar formulários em preenchimento.
- Instalação em dispositivos compatíveis.
- Publicação com HTTPS.

Configurar vite-plugin-pwa e o manifest para o nome e os recursos do novo projeto. Não desenvolver nem copiar um plugin próprio de PWA. A geração do service worker é responsabilidade do plugin/Workbox. A experiência offline inicial cobre a estrutura estática e a página de indisponibilidade; não pressupõe edição offline ou sincronização de registros. Respostas privadas da API não devem entrar no cache público de arquivos estáticos.

### Registro, atualização e cache

- Registrar o service worker por meio de virtual:pwa-register, disponibilizado pelo vite-plugin-pwa.
- Utilizar registerType: 'prompt' para controlar quando uma nova versão será aplicada. Detectar atualizações automaticamente e aplicá-las em um momento seguro; se houver formulário alterado, aguardar salvamento, descarte explícito ou confirmação antes de recarregar. Não usar recarga automática incondicional.
- Incluir no precache somente recursos públicos necessários ao aplicativo.
- Não armazenar respostas de API, sessão, CSRF ou diagnóstico no cache do service worker. Excluir /api, /sanctum, /up e /status do fallback de navegação.
- Manter o service worker desativado no servidor Vite de desenvolvimento. Validar cache, offline e atualizações usando o build, servido pelo Nginx em localhost ou HTTPS.
- Não aplicar cache HTTP imutável ao HTML, manifest ou service worker; assets versionados podem ter cache de longa duração.

## 6. Design system obrigatório

**REGRA OBRIGATÓRIA — TODA TELA E TODO COMPONENTE DEVEM SEGUIR O DESIGN SYSTEM DO PROJETO.** Consultar os padrões existentes antes de implementar ou alterar a interface. Não criar cores, medidas, estilos ou variações isoladas por página. Esta regra deve constar explicitamente em AGENTS.md e RULES.md desde a fundação.

### Fonte oficial e implementação

- docs/sdd/02-design-system.md é a fonte documental dos padrões aprovados: cores e usos semânticos, tipografia, espaçamentos, dimensões, bordas, raios, sombras, ícones, estados e variações dos componentes.
- frontend/src/css/tokens.css centraliza os valores compartilhados. Mapear as personalizações às variáveis nativas do Framework7 e ao tema Tailwind de forma consistente, sem criar escalas ou paletas independentes.
- frontend/src/components/ reúne componentes .vue reutilizáveis baseados nos componentes oficiais do Framework7 Vue. Criá-los conforme surgirem necessidades reais de composição, personalização ou comportamento compartilhado durante a evolução do projeto; não gerar antecipadamente uma biblioteca inteira. Centralizar estilos e comportamentos comuns, sem duplicá-los entre telas.
- As páginas devem consumir os mesmos tokens, estilos e componentes. As referências visuais aprovadas complementam essas definições e ficam em docs/telas/.

### Consistência e evolução

Usar o mesmo padrão para botões, inputs, seletores, formulários, listas, cards, navegação, diálogos e feedback em todas as telas. Definir os estados normal, foco, desabilitado, carregamento, erro e sucesso quando aplicáveis, incluindo mensagens de validação e acessibilidade. Criar apenas componentes e variações com uso real no projeto.

**A aprovação de uma nova tela não autoriza mudar o design system global.** Apresentar alterações globais explicitamente para aprovação. Após uma mudança aprovada, atualizar a especificação e a implementação compartilhada e conferir as telas afetadas. Uma exceção necessária deve ter seu contexto, finalidade e limite documentados; não pode se tornar uma personalização local sem justificativa.

O design system começa na fundação com os padrões nativos adotados e os tokens iniciais, sem inventar uma identidade visual definitiva. Evolui conforme as decisões forem aprovadas. Antes de concluir cada entrega de interface, conferir sua aderência aos padrões documentados e corrigir divergências.

## 7. Componentes oficiais do Framework7 Vue

**Usar obrigatoriamente os componentes oficiais do Framework7 Vue disponíveis**, incluindo inputs, botões, formulários, modais e popovers, sem recriar controles equivalentes. Para recursos sem componente Vue, integrar a API Core documentada ao ciclo de vida apropriado. Partir da aparência padrão; personalizações seguem o design system da seção 6 e aprovação do usuário. Quando os recursos existentes não atenderem à necessidade, apresentar a lacuna antes de adotar outra solução. Lucide e Framework7 Icons fornecem somente ícones.

### Criação progressiva em frontend/src/components/

- Criar componentes próprios somente quando houver necessidade real de reutilização, composição ou personalização aprovada. Usar diretamente os componentes oficiais quando suficientes; não criar um wrapper para cada controle por obrigação.
- Nomear componentes reutilizáveis .vue em PascalCase e definir props, eventos e slots conforme o uso real. Telas ficam em pages/ e importam components/; a página inicial tem o nome explicitamente definido hello.vue, em minúsculas.
- Consumir tokens, variáveis Framework7 e utilitários Tailwind do tema aprovado; estilos locais, inclusive scoped, e classes arbitrárias não autorizam cores, dimensões ou estados divergentes do design system.
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

As telas devem utilizar as transições nativas do Framework7 na navegação. Priorizar **parallax**, **dive** e **cover-v** nos fluxos do produto, escolhendo conforme o contexto. Na demonstração Hello, implementar explicitamente **cover-v, dive, fade e parallax**, com avanço e retorno reais; não é necessário usar todas em cada fluxo de negócio.

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
| AGENTS.md | Entrada para IA/desenvolvedor: contexto, stack, estrutura, convenções, mudanças mínimas, criação de arquivos somente quando necessária e leituras obrigatórias. Apontar para RULES.md, MEMORY.md, SDD pertinente e comandos em 04-ambiente.md. |
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

Criar todos os arquivos desde a fundação e **preencher imediatamente tudo que já estiver definido**, incluindo arquitetura, ambiente e padrões aprovados neste README. Registrar como pendente somente o que ainda não tiver sido decidido, sem inventar escopo. Quando não houver conteúdo definido, iniciar o arquivo com título e orientação de preenchimento. Os documentos evoluem conforme telas, padrões e implementações forem definidos; não adiar definições conhecidas nem produzir especificações extensas de funcionalidades ainda não aprovadas.

| Arquivo | Conteúdo |
|---|---|
| 00-visao.md | O que é o produto, para quem se destina, escopo incluído e excluído e requisitos |
| 01-telas.md | Um bloco por tela com objetivo, componentes usados, transição de navegação, estados vazio/erro/carregando, critérios de aceitação e status proposta/aprovada/implementada |
| 02-design-system.md | Tokens aprovados de cores, espaçamentos, raios e demais padrões; componentes Framework7 Vue adotados, componentes próprios de components/ e suas variações; links para imagens de referência aprovadas |
| 03-arquitetura.md | Estrutura do projeto, modelo de dados, regras de negócio e autenticação com Sanctum, sessão e CSRF |
| 04-ambiente.md | Arquivo central e campos, derivações, bootstrap com estados/códigos, alterações manuais da infra, instalação, build, testes e publicação; comandos concretos de Docker, vite, npm ci e Composer |
| 05-api.md | Contratos dos endpoints sob /api/v1: método, rota, payload, resposta e erros; documentar também as rotas técnicas /up e /status em seção própria |
| pedidos-componentes.md | Registro do componente que faltou e do contexto de uso antes de interromper o trabalho por essa ausência |

02-design-system.md é a fonte documental obrigatória dos padrões visuais e de consistência entre telas; tokens.css, os estilos e os componentes compartilhados implementam esses padrões. Documentar cada padrão uma única vez e referenciá-lo nas especificações das telas.

AGENTS.md aponta para 04-ambiente.md para os comandos operacionais, sem manter cópia desses comandos. O mesmo vale para especificações detalhadas: apontar para o arquivo responsável em vez de duplicar seu conteúdo.

**Separação obrigatória:** SDD diz o que o sistema é; MEMORY.md diz em que ponto estamos. Decisões, tarefas, resultados de validação, andamento, pendências e histórico de mudanças ficam em MEMORY.md. Não criar arquivos de decisões, tarefas, changelog, índice ou sprints dentro do SDD. O plano inicial de sprints fica neste README; seu acompanhamento e as evidências de execução ficam em MEMORY.md. Os critérios de aceitação específicos das telas permanecem em 01-telas.md.

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

**DOCUMENTAÇÃO FAZ PARTE DA ENTREGA. O projeto deve poder ser continuado por outra pessoa ou IA sem histórico da conversa. Uma tarefa com documentação desatualizada não está concluída.** Incorporar este procedimento a RULES.md e exigir sua leitura no início de AGENTS.md.

1. **Iniciar ou retomar:** ler AGENTS.md, RULES.md, o resumo de MEMORY.md e o SDD pertinente. Conferir código, configurações e evidências; distinguir implementado, validado e pendente. Não presumir fatos ou decisões ausentes: registrar a lacuna e pedir somente o indispensável.
2. **Especificar antes de mudar comportamento:** registrar a decisão aprovada e os critérios de aceitação no documento responsável. Não tratar propostas como aprovadas; correções seguem o comportamento especificado e divergências devem ser esclarecidas.
3. **Atualizar após cada etapa relevante:** ajustar os documentos afetados e registrar progresso em MEMORY.md após decisões, mudanças de contrato/arquitetura/configuração/componente/fluxo, validações, bloqueios, conclusão, interrupção ou troca de tarefa. Não esperar o fim da sprint ou conversa.
4. **Encerrar:** revisar o diff e a coerência entre código, contratos, configurações, referências e documentos. Alterar AGENTS.md e RULES.md somente quando suas orientações mudarem. Se não puder atualizar a documentação, registrar e informar a pendência na entrega.
5. **Manter a retomada:** iniciar MEMORY.md com objetivo, estado real, última etapa concluída, decisões recentes, verificações/resultados, pendências, bloqueios e próximo passo concreto. Separar histórico do resumo vigente, consolidar repetições e identificar propostas e suposições.
6. **Preservar o pacote:** manter código, manifests, lockfiles, configurações sem segredos e referências aprovadas junto da documentação. Não incluir cópias do Compose, Dockerfile, Nginx ou php.ini da infraestrutura compartilhada. Manter somente o contrato técnico no SDD e os blocos próprios de integração da aplicação em instalacao-pwa-framework.md; solicitar os arquivos atuais ao responsável quando uma análise de infraestrutura for necessária. Antes de transferir ZIP/repositório, conferir sua completude e registrar o próximo passo; credenciais são configuradas separadamente. Não criar documento de passagem adicional.

Respeitar as responsabilidades da seção 10: SDD descreve a especificação; MEMORY.md registra andamento; RULES.md contém regras; AGENTS.md orienta o trabalho. Cada informação tem um único local responsável.

Na Sprint 5, verificar de forma reproduzível a existência dos documentos e os links locais Markdown, excluindo dependências e diretórios gerados. Essa checagem não substitui a revisão semântica; registrar exceções justificadas sem criar atualizações fictícias.

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
- Inicializar e destruir máscaras/validadores conforme a montagem/desmontagem Vue e os eventos de página do Framework7 quando necessários. Considerar páginas mantidas pelo roteador: sair da tela pode não desmontar o componente. Sincronizar valores com o estado Vue e limpar listeners para evitar duplicação, ciclos de atualização e referências a elementos removidos.
- Tratar explicitamente a conversão entre valores exibidos com máscara e o formato esperado pela API, conforme o contrato de cada campo.
- Manter a validação obrigatória no Laravel. A validação no navegador melhora a experiência e não substitui a validação do backend.
- Padronizar no design system a apresentação dos estados válidos, inválidos e das mensagens de erro das máscaras e validações adotadas; reutilizar as configurações comuns dos formulários.

## 13. Testes e validação

| Camada | Ferramenta | Escopo |
|---|---|---|
| Lógica frontend | Vitest | Funções JavaScript, validações próprias, formatação, transformações e comportamentos próprios extraídos dos componentes Vue |
| Fluxos no navegador | Playwright | Login, navegação, formulários, modais, integração com a API e comportamento em dimensões mobile |
| Regressão visual | Playwright, com comparação de screenshots | Páginas e componentes utilizados no aplicativo, usando referências visuais aprovadas e os padrões do design system |
| Backend | PHPUnit e ferramentas de teste do Laravel | API, regras de negócio, validação, autenticação, permissões e persistência |

### Organização e execução

- Manter testes unitários do frontend em frontend/tests/unit/ e testes de navegador em frontend/tests/e2e/.
- Manter testes backend em backend/tests/Unit/ e backend/tests/Feature/.
- Executar Vitest e Playwright no ambiente de desenvolvimento/testes com Node e as dependências de navegador necessárias.
- Executar os testes PHPUnit no ambiente PHP compatível com a aplicação e suas extensões.
- Fixar versões compatíveis das ferramentas nos respectivos manifests e lockfiles durante a implementação.
- Executar Playwright em serviço temporário de testes no mesmo Compose compartilhado, com imagem oficial compatível e versão alinhada ao pacote instalado. Não presumir suporte completo dos navegadores Playwright em node:22-alpine; o Alpine não é suportado para Firefox e WebKit. Preservar node:22-alpine para desenvolvimento/build do frontend. Referência: https://playwright.dev/docs/docker.
- Definir formatação e lint do JavaScript/CSS e PHP, escolhendo ferramentas compatíveis antes da instalação, fixando versões e documentando scripts e comandos. Executar as verificações aplicáveis na entrega e na integração contínua quando configurada.
- Documentar os comandos concretos de execução em docs/sdd/04-ambiente.md, após configurar os scripts do projeto. AGENTS.md deve apontar para esse documento.
- Utilizar ambiente de testes isolado, com banco MySQL exclusivo e dados controlados. Os testes nunca devem acessar ou limpar o banco real.
- Manter as ferramentas de teste como dependências de desenvolvimento; elas não devem integrar o pacote frontend servido ao usuário.

### Critérios de cobertura

- Priorizar regras de negócio, permissões, contratos da API e jornadas críticas do usuário.
- Testar a integração das máscaras e validações com os formulários e o formato enviado à API, incluindo entradas inválidas e casos relevantes de limite.
- Não repetir testes internos das bibliotecas ou dos componentes oficiais do Framework7 Vue. Testar contratos próprios de componentes (props, eventos, estado e integração) proporcionalmente ao risco; as jornadas renderizadas são cobertas pelo Playwright. Bibliotecas adicionais de teste Vue dependem de necessidade e aprovação, sem inclusão automática.
- Adicionar testes proporcionais ao risco da mudança, sem criar testes que apenas reproduzam a implementação.
- Usar referências visuais aprovadas e dados determinísticos nas comparações de screenshots. Não substituir referências automaticamente para esconder regressões.
- Validar o comportamento de indisponibilidade offline, cache estático e atualização da PWA no build de produção, com cenários apropriados ao suporte dos navegadores.
- Complementar a automação com validação em aparelhos reais Android e iPhone, especialmente para instalação, teclado, navegação e comportamento da PWA.
- A emulação mobile no navegador não substitui a validação em dispositivos reais.

## 14. Construção da fundação por sprints

As sprints constroem e validam a fundação reutilizável uma vez. Clones executam somente o bootstrap da seção 0, sem repetir estas sprints. Não há duração fixa: cada sprint termina após demonstrar seus critérios de aceite.

A página inicial de demonstração chama-se **Hello**, em **frontend/src/pages/hello.vue**, na rota **/**. Usa a aparência padrão do Framework7, autorizada pela construção da fundação, sem inventar identidade visual. Layouts personalizados e telas de negócio seguem aprovação visual. A Hello nasce na Sprint 2, recebe conferência do design system na Sprint 3, completa instalação/offline/atualização na Sprint 4 e passa pela validação final na Sprint 5.

| Sprint | Resultado verificável | Dependência |
|---|---|---|
| 0 — Preparação | Estrutura, orientação, SDD, configuração central e contrato de inicialização | Infraestrutura de referência disponível |
| 1 — Backend e infraestrutura | Laravel acessível, banco conectado e tela de status OK | Sprint 0 |
| 2 — Frontend integrado | Hello com demonstrações oficiais Framework7 Vue, Lucide, quatro transições e status real Laravel/MySQL | Sprint 1 |
| 3 — Design system | Padrões documentados e implementados em tokens, estilos e componentes compartilhados | Sprint 2 |
| 4 — PWA e build | Build pelo vite.cmd, frontend servido pelo Nginx e PWA instalável | Sprint 3 |
| 5 — Testes e entrega | Verificações automatizadas, roteiro reproduzível e evidências | Sprints 1 a 4 |

### Sprint 0 — Preparação e especificações

**Entregas:**

- Mapear a infraestrutura de referência conforme a seção 0. Definir o schema e os padrões de .env.foundation.example e os templates de derivação, sem depender de um nome de produto informado no chat. Separar construção da fundação e inicialização dos clones. Especificar o executor Node/Docker portátil, seu primeiro provisionamento manual, os caminhos host/contêiner e a seleção explícita de local/production pelo arquivo central.

- Criar a estrutura da seção 2, os sete documentos SDD e os arquivos de orientação da fundação. Incluir em AGENTS.md e RULES.md o fluxo de clonagem/arquivo central, a aplicação manual da infraestrutura, a proibição de criar usuários MySQL e a continuidade sem histórico.
- Criar exatamente os sete arquivos SDD definidos na seção 10 e preencher em cada um as definições já conhecidas, inclusive arquitetura, padrões e ambiente. Identificar como pendente o que ainda não foi decidido, sem inventar funcionalidades.
- Usar o plano de sprints deste README e registrar tarefas, andamento, decisões, pendências e evidências em MEMORY.md. Não criar SPRINTS.md nem outro arquivo de acompanhamento dentro do SDD.
- Conferir a disponibilidade e compatibilidade das versões aprovadas antes da instalação. Caso uma versão não exista ou seja incompatível, registrar o bloqueio e apresentar a alteração necessária antes de substituí-la.

**Aceite:** schema central e derivações definidos; documentos criados; infraestrutura de referência mapeada; contratos das duas etapas de bootstrap especificados, sem declarar implementação pronta.

### Sprint 1 — Laravel, banco e status do backend

**Entregas:**

- Instalar Laravel em backend/ pelo Composer executado no PHP-FPM. Usar o executável já incorporado à imagem quando disponível; caso contrário, obtê-lo do contêiner temporário composer:2.
- Preparar a criação sem conflito com vendor montado ou instalar o código já entregue pelo lockfile, sem recriá-lo. Conferir mount efetivo, permissões e o roteiro de instalação local conforme as orientações abaixo.
- Integrar o volume vendor da aplicação ao PHP-FPM compartilhado e adicionar ao Compose compartilhado somente o serviço Node, volumes e perfil dev que ainda faltarem, sem duplicar configurações existentes. Criar frontend/vite.cmd já nesta etapa, apontando para o serviço e Compose reais; seu uso será validado após criar o frontend na Sprint 2.
- Implementar scripts/bootstrap/index.mjs em Node.js e entregar Dockerfile/entrypoint/templates do serviço temporário pwa-foundation-bootstrap no Compose compartilhado, conforme a seção 0. Validar Docker CLI, plugin Compose, socket, identidade Compose e mapeamento de caminhos do host; funcionar antes do serviço Node do produto existir, sem runtimes no host. Validar o central, distinguir local/production explicitamente e gerar trechos da infra sem editá-la. Implementar instalação PHP, configuração derivada, preservação de APP_KEY e preparação dos bancos com a conta existente, sem criar usuários/senhas/grants. Em produção, bloquear testes destrutivos e exigir --force explícito para migrations. Entregar exemplos sem segredos e códigos de saída 0/1/2.
- Configurar APP_KEY da nova aplicação, permissões de storage/bootstrap/cache, sessão/Sanctum/CSRF e migrations iniciais, com configuração própria por ambiente.
- Criar e validar app:sync conforme o contrato da seção 4, incluindo propagação de falhas e execução sem migrations pendentes.
- Configurar o site no Nginx e o encaminhamento real ao Laravel. Reservar /status para a tela HTML do backend, além de /up e /api/v1/status.
- Implementar os contratos de status abaixo e documentá-los.

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

As rotas de diagnóstico não devem retornar credenciais, exceções, caminhos, versões detalhadas ou informações de usuários. Retornar Cache-Control: no-store nas respostas de status e registrar detalhes de falha somente nos logs do servidor. Não exigir autenticação para esse status agregado da fundação; eventuais diagnósticos detalhados deverão ser protegidos.

**Aceite:** tela /status acessível pelo domínio local com backend e banco OK; API retorna JSON real e responde 503 em teste controlado de falha; /up acessível; mounts e volumes corretos; demais sites da infra preservados.

### Verificações obrigatórias da Sprint 1

Seguir os procedimentos das seções 0, 3 e 4, entregando código reproduzível e registrando a conclusão conforme a seção 11.

- Usar o mesmo serviço de diagnóstico para JSON e HTML, com consulta real simples ao banco. Manter as rotas públicas independentes de middlewares de sessão/autenticação que possam consultar o banco antes do diagnóstico. Testar também com Origin do frontend: Sanctum stateful não pode transformar a falha esperada em 500.
- Configurar cookies pelo host visto no navegador: com proxy Vite em localhost:porta, não restringi-los exclusivamente ao host Nginx. Definir nome de sessão exclusivo, conferir host-only, flags e inicialização CSRF. Preparar CSRF não equivale a implementar login completo; observar também a seção 18.
- Nesta fase, o Nginx pode servir backend/public e redirecionar a raiz para /status. Fornecer apenas o bloco adicional para aplicação manual; a troca para frontend/dist pertence à Sprint 4. /status não depende do Vite.
- Testar nesta sprint JSON/HTML saudável e indisponível, no-store, ausência de detalhes privados, CSRF e app:sync. Separar cenários determinísticos com simulação dos testes MySQL reais; conferir ambiente testing, conexão e banco exclusivo antes de migrations conforme a seção 0, usando a conta configurada e sem fallback para o banco principal.
- Na integração real, executar app:sync duas vezes, cobrindo ausência de migrations pendentes. Simular falha somente na conexão do processo de teste, sem desligar o MySQL compartilhado. Testar interrupção após falha de limpeza e propagação de falha de migration.
- Registrar versões efetivas, resultados, evidências recebidas e limites do ambiente em MEMORY.md. Runtime temporário diferente do PHP-FPM real não comprova execução no Docker do responsável. Não fixar números de testes ou versões auxiliares observadas em outro aplicativo; registrar valores reais nos lockfiles e em 04-ambiente.md.
- Distinguir entregue, instalado e validado: /status saudável comprova a consulta, mas não substitui a suíte integrada. Após evidências suficientes, registrar conclusão e próximo passo sem repetir pedidos já atendidos.

### Sprint 2 — Frontend Framework7 Vue integrado

**Entregas:**

- Criar o projeto Vite em frontend/ com Vue 3, @vitejs/plugin-vue, tailwindcss e @tailwindcss/vite; instalar framework7 e framework7-vue em versões correspondentes compatíveis, ícones, fonte local, IMask e JustValidate. Fixar versões verificadas e package-lock.json.
- Configurar Tailwind sem Preflight, com prefixo tw, detecção de classes .vue e mapeamento do tema aos tokens conforme a seção 4; usar utilitários na composição das telas técnicas sem alterar controles oficiais inadvertidamente.
- Criar main.js, App.vue, routes.js, pages/ e components/ conforme as seções 4 e 18; usar Composition API/script setup em JavaScript e roteador Framework7 Vue.
- Criar npm run dev e npm run build e integrar instalação pelo lockfile no bootstrap, no volume node_modules do serviço Node. Gerar configuração pública, título, nome de sessão e atalhos a partir do central, sem expor credenciais.
- Criar frontend/src/css/tokens.css com tokens iniciais mapeados aos padrões do Framework7, sem personalizações visuais arbitrárias.
- Configurar server.host: true (equivalente a 0.0.0.0), porta fixa e strictPort: true. Configurar polling quando necessário e proxy para /api, /sanctum e /up, com target http://nginx e Host correspondente ao site local do novo projeto.
- Implementar frontend/src/pages/hello.vue na rota / com a especificação abaixo, navbar, identificação central do projeto, status da API/banco e demonstrações interativas. Extrair para components/ somente composições/personalizações realmente necessárias, seguindo o design system.
- Manter formulário demonstrativo com e-mail e telefone em controles oficiais, JustValidate e IMask; nenhuma interação de demonstração deve gravar dados pessoais ou alterar registros reais.
- Exibir carregamento, sucesso e falha conforme a chamada real a /api/v1/status. Uma resposta de erro não pode aparecer como status OK.
- O formulário é demonstrativo: valida campos e abre um diálogo de confirmação, sem persistir dados pessoais. O endpoint de status é a integração real com o backend.
- Criar uma página auxiliar simples de destino para os exemplos de cover-v, dive, fade e parallax. Cada ação na Hello deve realizar navegação real com a transição selecionada e permitir voltar, sem substituir efeitos por animações próprias.
- Garantir integração reativa, inicialização/limpeza de máscaras e validadores e ausência de listeners duplicados ao navegar, inclusive com páginas mantidas pelo roteador.
- Preparar o cliente API para cookies e CSRF nas futuras operações autenticadas; não criar módulos de negócio ou login completo sem especificação.

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

Usar os componentes oficiais Framework7 Vue quando disponíveis e APIs Core documentadas quando o recurso assim exigir; integrar refs, estado e limpeza ao ciclo de vida adequado. Conferir suporte/opções na versão fixada antes de implementar; se algum requisito não for suportado, registrar o impedimento para decisão, sem simular uma implementação oficial.

O status da API/banco deve vir de /api/v1/status e mostrar carregamento, sucesso, erro, indisponibilidade ou não verificado. Offline ou falha de requisição não podem manter um OK antigo como se fosse uma checagem atual. Não consultar MySQL diretamente pelo navegador nem expor credenciais. As demonstrações usam dados locais de exemplo; sua interação não comprova persistência.

Reservar na mesma página os estados de instalação, preparo offline e atualização da PWA, cuja integração funcional pertence à Sprint 4; na Sprint 2 não declarar esses recursos concluídos. Documentar Hello e página auxiliar em 01-telas.md, padrões/componentes em 02-design-system.md e comandos/URL em 04-ambiente.md.

**Aceite da Sprint 2:** Hello acessível pelo Vite no Windows; HMR .vue/JS/CSS operacional; status real pelo proxy; todas as demonstrações da tabela funcionam, incluindo seleção de sugestões, calendário subindo como sheet, os quatro exemplos de transição com retorno, formulário, máscara e validação. Nenhum controle equivalente é recriado fora das APIs oficiais; não há persistência nas demonstrações. Instalação/offline/atualização permanecem explicitamente pendentes para a Sprint 4.

### Sprint 3 — Design system e consistência

**Entregas:**

- Consolidar em docs/sdd/02-design-system.md os tokens, padrões, estados e variações utilizados nas telas técnicas da Sprint 2, distinguindo padrões nativos de personalizações aprovadas.
- Centralizar cores, tipografia, espaçamentos, dimensões, bordas, raios e sombras em tokens e estilos compartilhados. Conferir que Framework7 e Tailwind referenciam os mesmos valores aprovados e documentar camadas/prefixo; não manter temas independentes.
- Organizar em frontend/src/components/ os componentes .vue reutilizáveis efetivamente necessários, com base no Framework7 Vue. Registrar seus contratos e estados no design system; continuar ampliando essa pasta conforme o produto evoluir.
- Revisar a Hello e sua página auxiliar para eliminar divergências injustificadas e duplicações de estilos/comportamentos. Conferir todos os componentes demonstrados, estados de formulário, feedback, foco e acessibilidade; centralizar personalizações reutilizáveis quando necessário, sem substituir controles oficiais.
- Incorporar as imagens de referência aprovadas em docs/telas/ e apontar para elas nos documentos SDD responsáveis.
- Incorporar a obrigatoriedade de consultar, seguir e manter o design system em AGENTS.md e RULES.md.

**Aceite:** telas técnicas seguem os mesmos padrões documentados; componentes equivalentes reutilizam estilos e comportamentos; alterações de tokens compartilhados se refletem nos usos correspondentes; exceções e variações estão justificadas e documentadas; alterações globais têm aprovação explícita; utilitários Tailwind seguem os tokens e preservam estados/aparência dos controles Framework7, sem Preflight.

### Sprint 4 — PWA, publicação e atualização

**Execução:** seguir a regra Docker da seção 4 e o roteiro de build/prévia abaixo. Atualizar dependências pelo lockfile quando necessário, sem --service-ports para instalação; não recriar o projeto ao retomar. Se infra/ não estiver no caminho esperado, fornecer o Compose real com -f.

**Entregas:**

- Instalar e configurar vite-plugin-pwa com versão compatível fixada, Workbox generateSW e registro virtual:pwa-register.
- Criar manifest, nome provisório baseado no projeto, ícones adequados incluindo 192 e 512 pixels e recursos offline necessários. Identidade gráfica definitiva segue aprovação posterior.
- Configurar cache de recursos estáticos, exclusões de rotas backend, fallback de navegação e tratamento de indisponibilidade da API.
- Integrar na Hello os estados reais de conexão, preparo offline, atualização disponível e ativação controlada, preservando formulários alterados. A experiência refere-se à mesma aplicação PWA, cuja página inicial é hello.vue; não criar PWA separada para a demonstração.
- Oferecer ação de instalação quando o navegador disponibilizar o fluxo programático; onde não houver suporte, apresentar instrução adequada ao navegador, incluindo instalação manual no iPhone. Não prometer prompt universal nem confundir requisitos de instalação atendidos com instalação efetiva.
- Integrar build e verificações de saúde/frontend ao bootstrap, validar também frontend/vite.cmd build e servir frontend/dist/ pelo Nginx compartilhado. Gerar o manifest com a identidade pública central.
- Validar headers de cache, rota /status, API, CSRF e /up no site que serve o build, com Vite parado.
- Documentar publicação com domínio e HTTPS. Configurar DNS/certificado quando os dados e o ambiente de destino estiverem disponíveis.

**Aceite:** build reproduzível; app e status acessíveis pelo Nginx sem servidor Vite; manifest e service worker válidos; instalação no navegador compatível; Hello e página auxiliar acessíveis offline após preparo dos recursos públicos, com status do banco não verificado/indisponível e sem cache da API; instalação acionável ou orientada conforme o navegador; nova versão aplicada sem perda silenciosa de formulário. Validações locais podem usar localhost; publicação externa exige HTTPS.

#### Portabilidade obrigatória do build no Docker

Identificar a entrada pelo caminho absoluto resolvido a partir de vite.config.js, sem depender do nome frontend/ ou da pasta do projeto. Com mount em /app e working_dir /app, ela é /app/index.html.

```js
import { fileURLToPath } from 'node:url';
const appEntry = fileURLToPath(new URL('index.html', import.meta.url));
```

Se houver helper de precache, fornecer appEntry e comparar o facadeModuleId normalizado completo, incluindo separadores Windows. Preservar validações e falhar explicitamente se a entrada faltar. Testar o mount real e uma pasta sem o nome frontend; declarar quando a reprodução ocorrer em ambiente distinto do Docker do responsável.

#### Fluxo único para testar a PWA no Android por USB

**Ordem obrigatória: aplicar arquivos → dependências quando necessário → build com sucesso → conferir dist → uma prévia → acesso no Windows → ADB → acesso no Android.** Usar Node pelo Docker, conforme a seção 4.

Os exemplos usam pwa-teste-node, mount /app, infra em C:\var\www\infra e adb.exe em C:\tools\platform-tools. Adaptar uma vez aos nomes, caminhos e portas disponíveis da seção 0; documentar os comandos concretos em instalacao-pwa-framework.md.

1. Aplicar a entrega na raiz correta, preservando .env e volumes. Fornecer arquivos prontos com destinos claros, sem exigir montagem manual de patches. Se dist não acompanhar o ZIP, informar a necessidade do build. Em erro persistente, conferir os bytes lidos pelo contêiner antes de reinstalar ou alterar infraestrutura.
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
- Após carregar online e preparar o offline, instalar pela opção oferecida pelo navegador. localhost por USB permite o teste nos navegadores compatíveis; HTTP por IP de rede não equivale ao contexto confiável. Publicação remota exige HTTPS. Registrar separadamente acesso, instalação, offline e atualização.
- Testar offline com DevTools remoto na aba Android: desligar Wi-Fi/dados pode manter localhost acessível por USB. Conferir shell, fontes, ícones, aviso offline e serviços sem confirmação. Não desligar MySQL compartilhado.
- Testar atualização entre dois builds com formulário alterado, cancelamento/confirmação de descarte e outra aba ativa. Rebuild não limpa cache; usar o fluxo normal de atualização. Para zerar testes, remover somente worker/caches da origem de teste.
- Registrar resultados, limitações e próximo passo em MEMORY.md. A prévia não substitui validar aplicativo, backend e headers no Nginx compartilhado. Não declarar aceites sem evidência.

Referências: [Vite preview](https://vite.dev/config/preview-options), [USB](https://developer.chrome.com/docs/devtools/remote-debugging/local-server), [contextos seguros](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

### Sprint 5 — Testes, evidências e fechamento

**Entregas:**

- Configurar Vitest e testes significativos das conversões/validações próprias criadas para os campos demonstrativos, quando houver lógica própria.
- Configurar PHPUnit e testes do contrato de status, sucesso e falha controlada do banco, sem desligar o MySQL compartilhado. Usar ambiente testing e banco exclusivo de testes.
- Configurar Playwright para a jornada Hello: consultar status real e falha, validar formulário/máscara, interagir com cada demonstração da tabela da Sprint 2, conferir os ícones Lucide e avançar/retornar nas quatro transições. Conferir aderência ao design system e ausência de listeners/overlays duplicados após navegar. Não repetir testes internos das bibliotecas.
- Criar teste integrado com Laravel real para o caminho saudável e testes determinísticos para estados de falha, identificando quais cenários usam simulação.
- Adicionar comparação visual após aprovação das referências das telas técnicas, com fontes carregadas, dados fixos e animações estabilizadas na captura. Conferir utilitários no CSS de produção e ausência do reset Preflight; cobrir layouts responsivos e estados dos controles para detectar conflitos de cascata.
- Validar a Hello como entrada da PWA no build servido pelo Nginx: instalação conforme o navegador, offline sem falso status saudável do banco, atualização com formulário alterado e funcionamento após clone. Registrar instalação efetivamente realizada, testes manuais/automatizados e aparelhos ainda pendentes, sem presumir suporte idêntico entre navegadores.
- Registrar a checagem de sessão/CSRF da fundação com as ferramentas Laravel; testes completos de login e permissões acompanharão a implementação desses fluxos.
- Documentar clonagem, preenchimento do central, executor Node/Docker em Windows e Linux, duas etapas do bootstrap, aplicação manual da infra e retomada após falhas; incluir primeira instalação na VPS, atualizações após git pull, configuração privada por ambiente, --force para migrations de produção, dependências, desenvolvimento, build, testes, URLs e parada/reinício sem apagar dados.
- Validar dois clones em pastas, portas, volumes e bancos distintos: executar bootstrap, aplicar a infra manual e reexecutar; comprovar funcionamento simultâneo e isolamento. Repetir inicialização sem duplicar recursos, mudar chaves, apagar dados ou reinstalar dependências inalteradas. Cobrir falha parcial, caracteres especiais no dotenv e bloqueio de testes contra banco principal. Conferir que nenhum segredo aparece no bundle, saídas públicas ou logs.
- Validar o executor em Docker Desktop/Windows e Docker/Linux, incluindo caminhos com espaços, resolução host/contêiner e preservação da identidade Compose compartilhada. Cobrir APP_ENV ausente/inválido, produção sem HTTPS, ausência/presença de --force para migrations e preservação da configuração privada após atualização Git. Registrar a primeira instalação e atualização em produção em ambiente apropriado; se a VPS real não estiver disponível, distinguir simulação de validação real e manter a pendência explícita.
- Executar a verificação estrutural da documentação e revisar sua coerência com o diff, conforme o procedimento da seção 11.
- Atualizar os documentos SDD responsáveis pelas definições implementadas e revisar AGENTS.md e RULES.md quando suas orientações mudarem. Registrar resultados reais, evidências, decisões e pendências somente em MEMORY.md, sem duplicar acompanhamento dentro do SDD.

**Aceite:** verificações aplicáveis passam; outra pessoa ou IA sem histórico de conversa consegue localizar as regras, reproduzir a base pelos documentos e identificar a próxima tarefa; imagens aprovadas acompanham o projeto; evidências anexadas às tarefas; testes em aparelhos reais e eventual publicação externa são registrados como pendentes quando ainda não executados.

### Definição de construção da fundação concluída

A fundação só será considerada concluída quando houver Hello interativa com os componentes oficiais, Lucide e quatro transições da Sprint 2, backend e banco verificados por /status, integração frontend/API real, design system documentado e aplicado nas telas, PWA validada no build, atalhos Windows operacionais, testes aplicáveis passando e documentação atualizada. A release também deve incluir bootstrap funcional conforme a seção 0, com validação real de dois clones e reexecução. Criar arquivos ou apenas exibir um texto fixo de OK não satisfaz esses critérios.

## 15. Definições pendentes da nova aplicação

- Identidade no arquivo central, objetivo e funcionalidades do produto.
- Repositório, domínio e porta local.
- Valores do arquivo central e disponibilidade dos recursos derivados, incluindo bancos principal e de testes.
- Identidade visual e primeiras telas a aprovar.
- Versões exatas compatíveis de Vue 3, framework7-vue, @vitejs/plugin-vue, tailwindcss, @tailwindcss/vite, Lucide, vite-plugin-pwa, Vitest, Playwright e PHPUnit, conforme a seção 1.
- Configuração final de Compose, Nginx, sessão e publicação, baseada na infraestrutura real.

Essas definições serão incorporadas à documentação conforme forem aprovadas.

## 16. Referências técnicas

- [Tailwind — Vite](https://tailwindcss.com/docs/installation/using-vite): integração ao build.
- [Tailwind — Preflight](https://tailwindcss.com/docs/preflight): omissão do reset e prefixo.
- [Tailwind — tema](https://tailwindcss.com/docs/theme): mapeamento aos tokens compartilhados.
- [Framework7 Vue — inicialização](https://framework7.io/vue/init-app): integração e aplicação raiz.
- [Framework7 Vue — navegação](https://framework7.io/vue/navigation-router): rotas associadas a componentes Vue.
- [Vue — Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html): estrutura dos arquivos .vue.
- [Vite — opções do servidor](https://vite.dev/config/server-options): host, porta e configuração de desenvolvimento.
- [vite-plugin-pwa — guia](https://vite-pwa-org.netlify.app/guide/): integração Vite, registro e geração de service worker.
- [vite-plugin-pwa — atualização controlada](https://vite-pwa-org.netlify.app/guide/prompt-for-update): aplicação de novas versões em momento seguro.

## 17. Reutilização, versões e evolução da fundação

### Fundação e aplicativos derivados

A primeira entrega constrói e valida a fundação executável pelas sprints deste README. Cada aplicativo derivado recebe uma cópia independente dessa fundação, com repositório e histórico próprios. Entregar como repositório modelo Git ou cópia versionada, com código pronto, lockfiles e bootstrap obrigatório da seção 0; cada clone funciona sem dependência de runtime de outro repositório. O inicializador faz parte da construção desta fundação, e não de uma evolução opcional futura.

- Identificar cada release da fundação por versão e tag Git, usando versionamento semântico: correções, adições compatíveis e mudanças incompatíveis devem ser distinguíveis.
- Registrar no README de cada aplicativo a versão e o commit de origem da fundação e o ponto de referência das atualizações posteriormente incorporadas.
- Não aplicar atualizações sobrescrevendo o aplicativo. Comparar a release de origem com a release desejada, selecionar alterações pertinentes, adaptar conflitos e validar as personalizações do produto.
- Toda release da fundação deve descrever mudanças, requisitos, incompatibilidades e passos de atualização em suas notas de release. A documentação SDD do aplicativo descreve o resultado incorporado; MEMORY.md registra o andamento da incorporação.
- A versão da fundação é distinta da versão do aplicativo e do identificador do build da PWA.

### Criação de um aplicativo

Seguir exclusivamente o fluxo da seção 0: clone, .env.foundation, bootstrap, integração manual da infraestrutura e retomada. Não pedir nome no chat nem repetir as sprints de construção. A tabela de identificação no README do aplicativo é uma saída documental sem credenciais, gerada dos valores centrais e derivados: nomes, pasta, domínios, portas, serviço Node, volumes, bancos e versão/commit de origem. Comandos concretos ficam em 04-ambiente.md.

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
| frontend/src/services/api.js | Cliente HTTP centralizado, sessão, CSRF e tratamento comum de erros |
| frontend/src/forms/ | Configurações compartilhadas de máscaras, conversões e validadores |
| frontend/src/css/ | Tokens, entrada Tailwind sem Preflight e estilos compartilhados |

Criar módulos e componentes conforme houver uso real. As páginas .vue reutilizam components/, tokens e estilos compartilhados conforme o design system; não copiar o mesmo componente para várias telas. Evitar regras de negócio em manipuladores visuais quando puderem ser funções independentes verificáveis.

### API e sessão

Antes do primeiro endpoint de negócio, registrar em docs/sdd/05-api.md o padrão de sucesso, erros, validação de campos, paginação e datas. Preservar o contrato técnico de status já definido neste README.

- Usar códigos HTTP coerentes; distinguir falta de autenticação (401), falta de permissão (403), validação (422), falha de CSRF/sessão (419) e indisponibilidade. Não transformar erro em resposta aparente de sucesso.
- Padronizar mensagem geral e erros por campo, aproveitando o formato de validação Laravel, e definir a resposta de paginação antes do primeiro endpoint paginado.
- Representar instantes em ISO 8601 com fuso explícito, preferencialmente UTC; representar datas civis sem horário como YYYY-MM-DD. Definir o fuso de exibição do produto e não converter datas civis como se fossem instantes.
- Documentar cookies, domínios stateful incluindo portas locais, middleware, headers de requisição, inicialização CSRF e envio do token pelo cliente HTTP. Verificar a configuração oficial do Sanctum: https://laravel.com/docs/12.x/sanctum.
- Validar sessão/CSRF tanto pela origem local do Vite com proxy quanto pela origem servida pelo Nginx. O proxy, sozinho, não comprova autenticação funcional.
- Definir o comportamento de sessão expirada e preservação de formulários. Não reenviar automaticamente operações de gravação após recuperar a sessão sem garantir que isso não duplicará a operação.

### Acessibilidade

Incluir nos critérios das telas: campos com rótulos acessíveis, mensagens de erro associadas, nomes de botões de ícone, foco visível, navegação por teclado, foco ao abrir/fechar diálogos, contraste adequado, ampliação de texto e redução de movimento. Adotar WCAG 2.2 nível AA como referência de avaliação. Validar fluxos críticos com leitor de tela e teclado e registrar limitações reais; usar componentes nativos não substitui essa conferência.

## 19. Publicação, backup e recuperação

Registrar procedimentos concretos em docs/sdd/04-ambiente.md antes da primeira publicação externa:

- Como preparar e validar uma release, instalar dependências, buildar, aplicar migrations e conferir saúde e jornadas críticas.
- Como realizar backup do banco e dos arquivos persistentes e restaurá-los em ambiente isolado. Definir retenção e acesso conforme o produto; não considerar backup validado sem teste de restauração.
- Como recuperar a release anterior, incluindo assets necessários aos clientes que ainda estejam usando a versão anterior da PWA. Evitar publicar HTML que aponte para assets ainda indisponíveis.
- Como manter compatibilidade entre clientes antigos, nova API e alterações de banco durante a atualização. Preferir mudanças aditivas e prever a retirada de estruturas em etapa posterior quando necessário.
- Distinguir rollback de código de recuperação de dados. Não presumir que uma migration reversa seja segura ou suficiente; registrar operações irreversíveis e o plano de recuperação antes de executá-las.
- Validar configurações de produção e logs sem segredos.

As sprints da seção 14 constroem a fundação e seu inicializador; a seção 0 rege cada clone. Implementar as convenções à medida que os módulos forem criados e validar qualidade, documentação e recuperação nas etapas aplicáveis. Recursos dependentes de publicação externa permanecem explicitamente pendentes até haver ambiente e evidência de execução.
