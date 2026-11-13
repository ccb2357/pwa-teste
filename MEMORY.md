# Retomada

## Objetivo e estado vigente — 2026-11-13

Construir PWA Framework conforme README. Checkout de referência pwa-teste; manual usa meu-projeto como exemplo. **Sprint 5 encerrada com aceite local.** O responsável confirmou recebimento real no Chrome Android e na PWA instalada em segundo plano, clique abrindo a PWA, cancelamento por preferência desligada e revogação antes do worker. A suíte completa no PHP-FPM/MySQL passou: **33 testes, 254 assertions, 7.27s**. Sprint 4 mantém seu aceite local anterior.

Próxima etapa: Sprint 6 — validação final de reexecução, isolamento entre clones, portabilidade e fluxos local/produção previstos no README. Não repetir instalação, geração de VAPID ou testes já aceitos sem mudança que justifique. O aceite registrado é do ambiente local testado; iPhone, outros navegadores, HTTPS público e VPS não foram homologados nesta conversa. Fundação completa ainda não declarada concluída.

## Entregue

- Esqueleto oficial laravel/laravel v12.12.2, ref 945f4e5a9fd3695dc0ee512f497c650fb82cfbb8, com origem exata em foundation.json (esse arquivo é a autoridade da referência).
- Laravel 12.70.0, Sanctum 4.4.0, PHPUnit 11.5.57, Pint 1.30.4 e demais dependências em composer.json/lock. Esqueleto e framework têm versões diferentes. Sem vendor no pacote.
- app:sync, diagnóstico HTML/JSON com consulta real, no-store, 503 e rotas independentes de sessão; Sanctum/CSRF preparado, sem login.
- Bootstrap ES modules executável: validação central, identificação/mapeamento Compose, geração manual de infra, verificação de portas, env/APP_KEY, permissões, bancos com conta existente, Composer idempotente e app:sync. Migrations de produção exigem --force; sem env testing gerado em produção.
- Dockerfile/entrypoint/dependências isoladas do executor; imagem pwa-foundation-bootstrap:0.1.0 por docker build/docker run --rm, sem serviço próprio no Compose. Docker CLI 28.5.1 e Compose 2.40.3 copiados da imagem docker:28.5.1-cli. Host do usuário usa Compose 5.1.3, que não foi substituído.
- Frontend Framework7 Vue/Hello, manifests e lockfile npm, configuração pública e frontend/vite.cmd para dev/build entregues na Sprint 2; base utilizada nos testes locais aceitos da Sprint 4.
- Blocos Compose/Nginx em instalacao-pwa-framework.md, regenerados após preencher o central. Não usar como novo Compose/override nem substituir os mounts existentes.
- SDD, regras, metadados e testes cumulativos. Segredos recebidos não foram reutilizados ou incluídos.

## Evidências recebidas do responsável

- MySQL, Nginx e PHP-FPM ativos; PHP CLI 8.2.35 com extensões necessárias, Composer 2.11.2 e nginx -t bem-sucedido.
- Bind real C:\var\www → /var/www confirmado tanto em PHP quanto em Nginx.
- Projeto Compose infra; working_dir C:\var\www\infra; arquivo C:\var\www\infra\docker-compose.yml; versão de label 5.1.3.
- vendor existente é somente minhas_financas_vendor; ainda não comprova vendor pwa_teste aplicado.
- Não houve saída de portas anexada; se o comando foi executado sem linhas, 5176/5177 estavam livres naquele momento. O bootstrap fará a reserva temporária pelo Engine.
- Certbot Exited (1) não bloqueia localhost; HTTPS de produção continua sem evidência.

## Verificações executadas pelo agente

- Runtime PHP 8.2.35 extraído da imagem oficial php:8.2.35-fpm e usado temporariamente para Composer/PHPUnit; não é o contêiner PHP-FPM do responsável. Não foram instalados runtimes no Windows.
- Composer 2.11.2: resolução com platform PHP 8.2.35, lockfile, instalação temporária, autoload/package discovery e validação estrutural. Clones só fazem composer install, nunca create-project.
- PHPUnit determinístico: 12 testes, 46 assertions, todos passando. Cobrem contrato saudável com consulta simulada, falha simulada de banco inclusive Origin stateful/sessão database, no-store, /up, API desconhecida em JSON, cookies/CSRF, bloqueio/propagação de app:sync e guard de testes.
- Node 22.23.4 Linux: 21 testes passando. Incluem paths Windows/Linux e symlinks, dotenv/caracteres especiais, identidade, APP_KEY preservada, env idempotente e simulação determinística da orquestração (infra pendente código 2, reexecução sem reinstalar, produção sem/com --force). Simulação não comprova Docker real.
- Roundtrip real de senha fictícia com espaços, $, aspas, barras e caracteres especiais entre writer Node e parser vlucas/phpdotenv passou, sem imprimir o valor.
- Docker CLI/Compose da imagem de executor tiveram versões conferidas com os binários reais. Compose 2.40.3 validou o merge de referência sanitizada + fragmentos + executor com config --quiet; não houve criação de contêiner.
- Formatação PHP/Pint, sintaxe PHP/JS, lockfiles e pacote/links/segredos verificados conforme registro final de empacotamento. Não foram inventadas evidências de instalação.

## Pendências das próximas etapas

1. Implementar push na Sprint 5 quando autorizado; fechar os aceites restantes na Sprint 6. Sprint 4 aceita localmente pelo responsável.
2. Docker/Linux e VPS reais, TLS/certificado, backups/restore, dois clones simultâneos, aparelhos e falhas parciais reais. Simulações dos testes Node não substituem essas evidências.
3. Definir ferramentas de formatação/lint JS/CSS antes de novas dependências; nesta etapa JS usa check sintático e testes nativos Node, PHP usa Pint. Não adicionar bibliotecas silenciosamente.

## Histórico resumido

Sprint 0 criou os sete SDD e orientações, exemplo central, gitignore e referências sanitizadas; as cópias da infraestrutura foram posteriormente removidas por decisão do responsável. O mapeamento estático foi complementado pelas evidências Docker recebidas acima. Esses registros são históricos; uma nova análise deve partir dos arquivos atuais solicitados ao responsável.

## Empacotamento da Sprint 1

Pacote cumulativo verificado: sete documentos SDD, links locais válidos e arquivos obrigatórios presentes. Excluídos vendor/node_modules, configurações privadas, chaves, logs/caches/sessões e estado. A busca pelos valores sensíveis recebidos não encontrou ocorrências nos arquivos distribuídos. Composer validate --strict --no-check-all confirma schema/lockfile; sem no-check-all o Composer avisa sobre versões exatas, que são intencionais conforme a especificação.


## Correção do roteiro de instalação — 2026-11-11

O passo 4 de 04-ambiente.md agora separa serviço Node, mount vendor no PHP-FPM existente e declarações de volumes no nível raiz do Compose. README aponta diretamente para esse passo e o fragmento. Alteração somente documental; não altera infraestrutura nem comprova instalação no Windows.


## Nome do serviço de bootstrap — 2026-11-11

Por solicitação do responsável, o serviço Compose passa a se chamar pwa-foundation-bootstrap. Template e comandos do README/SDD atualizados; imagem pwa-foundation-bootstrap:0.1.0 e lock interno permanecem iguais. Aplicação no Compose compartilhado ainda manual.


## Instalação centralizada — 2026-11-11

Por solicitação do responsável, instalacao-pwa-framework.md na raiz é o roteiro único com executor, serviço Node, mount PHP, volumes, Nginx, retomada, testes, app:sync e VPS. 04-ambiente.md conserva somente contratos técnicos e aponta para o guia. Removidos os três arquivos avulsos de integração; bootstrap atualiza somente o bloco gerenciado do guia e informa esse destino ao parar com código 2. Reexecuções preservam o texto externo ao bloco. Na aplicação sobre uma cópia anterior, apagar somente scripts/bootstrap/executor/compose-service.yml e a pasta infra-generated antiga; não alterar configurações privadas. Infraestrutura Windows continua com integração pendente conforme saída recebida do responsável.

Verificação desta alteração: 21 testes Node passaram, incluindo geração do guia para outro slug e preservação do texto externo ao bloco na reexecução. Quatro blocos YAML do guia passaram no parser; links locais e os sete SDD foram conferidos. Nenhuma nova execução no Docker Windows foi realizada pelo agente.


## Infraestrutura externa sem cópias arquivadas — 2026-11-11

Removida integralmente docs/referencias/infra e seus cinco arquivos (Compose, Dockerfile, configuração principal/sites Nginx e php.ini), por solicitação do responsável. Não recriar essa pasta nem arquivar cópias equivalentes em outro caminho. Outra IA deve pedir ao responsável os arquivos atuais necessários quando analisar/alterar a infraestrutura, pois o conteúdo pode mudar. Atualizados AGENTS, RULES, README, contrato de ambiente e guia de instalação; mapeamentos e evidências históricas foram identificados como tais. Os blocos próprios de integração da aplicação continuam em instalacao-pwa-framework.md. Ao atualizar uma cópia anterior por extração de ZIP, excluir manualmente a antiga pasta docs/referencias/infra, pois extração não remove arquivos antigos. Alteração documental; nenhum código executável ou infraestrutura foi alterado.


## Pasta de imagens das telas — 2026-11-11

Caminho vigente: docs/telas/, diretamente sob docs. Pasta movida, README e caminhos relativos nos SDD de telas e design system atualizados. Usar esse caminho nas próximas entregas. Em cópias anteriores, mover as imagens existentes para docs/telas e remover a pasta intermediária vazia. Verificados os caminhos documentais e o ZIP; sem alteração de código executável.


## Preparação manual do arquivo central — 2026-11-11

O passo 1 de instalacao-pwa-framework.md orienta copiar .env.foundation.example, renomear a cópia para .env.foundation somente se ausente e editar/salvar manualmente. Removido o bloco PowerShell desse passo por solicitação do responsável. Demais comandos de instalação preservados. Alteração somente documental.


Ajuste documental: removida de instalacao-pwa-framework.md a orientação de renomear o serviço antigo; o guia usa diretamente pwa-foundation-bootstrap.


## Terminal de instalação local — 2026-11-11

Por solicitação do responsável, os comandos locais de instalacao-pwa-framework.md usam Prompt de Comando (CMD): cd /d para navegação e echo %ERRORLEVEL% para consultar a saída. Validação Nginx seguida de reload usa && para impedir reload após falha. Removida a sintaxe PowerShell do guia. Alteração documental; comandos não executados no Windows pelo agente.


Revisão geral de terminais: instruções operacionais restantes do README ajustadas para CMD no Windows. Menções a PowerShell mantidas somente no histórico e na restrição técnica de independência de shell do bootstrap.


Guia de instalação renomeado para instalacao-pwa-framework.md por solicitação do responsável; links, geração do bootstrap e testes usam o novo nome. Na atualização de cópias anteriores, remover o guia com o nome anterior após aplicar o novo pacote.


Clareza do guia: reescrito o resultado da retomada do bootstrap, com significado do código 0 e links identificados para os três diagnósticos. Escopo do aceite permanece limitado ao backend da Sprint 1.


## Ordem operacional da instalação local — 2026-11-11

Guia revisado após relato do responsável: a primeira execução do bootstrap estava antes das alterações obrigatórias, gerando uma lista de pendências que o roteiro deveria antecipar. Nova ordem: configurar central; incluir executor; aplicar Node/mount/volumes/Nginx; validar e aplicar infraestrutura; executar bootstrap; conferir diagnóstico. O gerador mantém a mesma numeração e ordem ao atualizar o guia. README alinhado. Código 2 é fluxo de correção de pendências, não etapa obrigatória inicial do roteiro local.

Verificação desta revisão: 23 testes do bootstrap passaram; o teste de preparação também confere que os blocos de infraestrutura e sua aplicação antecedem a primeira execução no guia regenerado. Pendências reais recebidas do responsável não foram apresentadas como já aplicadas.


Removido do início do guia o texto introdutório indicado pelo responsável; o conteúdo começa diretamente na etapa 1 após o título. Etapas e comandos preservados.


Removido do guia o parágrafo sobre preenchimento de DB_PASSWORD e conta root, conforme solicitado pelo responsável. Demais instruções preservadas.


## Diagnóstico HTTP/CSRF — 2026-11-11

O responsável relatou falha na validação HTTP após Composer e app:sync. Testes enviados: /up, /status e API retornam 200; CSRF retorna 204; acesso interno ao CSRF com Origin localhost:5176 retorna token presente, sem Domain e curl 0; HTML/JSON públicos têm no-store e JSON esperado. Causa da falha original ainda não identificada. Verificador passou a retornar somente códigos controlados, endpoint, HTTP, errno e índice de origem, sem corpos, cookies ou detalhes arbitrários. Orquestrador apresenta esse diagnóstico sem repassar stdout/stderr privados. 25 testes Node passaram; PHP syntax check e cinco cenários HTTP reais em servidor temporário local (sucesso, ausência no-store, contrato HTML, JSON inválido e token ausente) passaram. Falta a nova execução no Windows para identificar a condição original. Guia de instalação preservado.


## Guia operacional direto — 2026-11-11

Enxugadas as seções de testes, app:sync e VPS por solicitação do responsável: somente finalidade breve, comandos separados e resultado esperado. Detalhes de implementação continuam no SDD/código; não removidas validações do sistema. Atualizado o estado de retomada com o sucesso real do bootstrap e dos três diagnósticos enviados pelo responsável. Suíte MySQL ainda aguarda execução. Alteração documental, sem nova execução de testes.


## Validação recebida e correção do runtime dos testes — 2026-11-11

Anexo do responsável: 14 testes PHP passaram com 57 assertions, incluindo MySqlIntegrationTest; Pint aprovou 36 arquivos. Node: 20 testes passaram e os cinco de orquestração falharam com MODULE_NOT_FOUND dotenv. Causa confirmada: a fixture sobrescrevia FOUNDATION_RUNTIME_PACKAGE com o package.json do projeto, ignorando /opt/foundation/package.json definido na imagem. Corrigida para preservar a variável do executor e usar fallback local somente quando ausente. Reprodução isolada pelo agente com node_modules do projeto ausente e runtime externo: antes 20/25, depois 25/25. Não foi necessário instalar dependências no projeto nem alterar a imagem. Falta repetir a suíte Node no Docker do responsável para confirmar a correção nesse ambiente.


## Aceite local da Sprint 1 — 2026-11-11

Após receber a correção de orchestration.test.mjs, o responsável confirmou que a suíte Node passou. Somado aos resultados anexados de PHP/MySQL e Pint e à execução real do bootstrap/diagnósticos, fica encerrado o aceite local da Sprint 1. A confirmação final Node foi textual; não foi inventada nova execução pelo agente ou transcrição não fornecida. Próxima etapa: Sprint 2; não iniciada nesta entrega.


## Planejamento aprovado de push — 2026-11-12

Atualizado o contrato principal README com as decisões aprovadas: Sprint 2 frontend/Hello, 3 design system, 4 PWA injectManifest desde o início, 5 Push Notifications, 6 testes/fechamento. Incluídos contrato push/VAPID, usuários de teste sem conta fixa em produção e operação sem contêiner adicional; comandos centralizados no guia e estrutura docs/telas preservados. Recurso apenas planejado; não há pacote/migration/worker/API push implementado. SDD e regras específicos de push serão reconciliados na etapa de especificação/implementação correspondente; antes da Sprint 4 não reutilizar a antiga decisão generateSW. Sprint 1 mantém aceite local concluído.


README revisado para concisão e integração completa de push: stack/fila/SW, central/ambientes, bootstrap, estrutura, APIs, testes e publicação. Ordem de sprints em lista. Parágrafos técnicos e entregas repetidas compactados, mantendo exemplos/comandos e critérios de implementação. Alteração documental; push continua planejado na Sprint 5.


Decisão aprovada: README passa a especificar somente Framework7 (CSS/grid), tokens e CSS compartilhado para estilos. Removidas a dependência de utilitários anterior e todas as suas menções, plugin Vite, arquivo CSS, prefixo/reset e referências. Sem alteração de código ou instalação de dependências nesta entrega. SDD/regras de implementação devem seguir a nova decisão antes de construir a Sprint 2.


## Sprint 2 — implementação e evidências — 2026-11-12

- Dependências publicadas conferidas por metadata npm: F7/F7 Vue 9.2.0, Vue 3.5.45, Vite 8.3.4/plugin-vue 6.0.11, Icons 5.0.5, lucide 1.72.0, IMask 7.6.1 e JustValidate 4.3.0. Engines/peers compatíveis com Node 22. Nunito original fornecida pelo responsável, com licença OFL oficial incluída.
- Frontend: Hello nativa com diagnóstico, grid responsivo, accordion, autocomplete, buttons/dialog, calendar sheet forçado, checkbox, formulário sem envio, smart select, notification/sheet/toast/FAB, 20 Lucide e quatro destinos com ida/volta oficial. Nomes de transição internos têm prefixo f7-. Máscara sincroniza Vue pelo accept; props de transição são passadas em route.options.props; Autocomplete change recebe diretamente a lista de valores do Core 9.2.0.
- Bootstrap: public config por whitelist em frontend/.foundation.public.json, ignorado no Git; Vite não lê o central privado. Dependências npm no volume real, instalação por lockfile e marcador; reexecução preservada e falha interrompe sem falso sucesso. Não inicia Vite nem altera infra compartilhada. Backend PHP não foi alterado.
- Node 22.23.4: npm ci limpo pelo lockfile e build Vite passaram. 31 testes Node passaram (27 bootstrap/orquestração e 4 cliente API), incluindo npm idempotente/falha, privacidade e CSRF sem repetição de mutação. Build avisa sobre chunk acima de 500 kB: usa bundle oficial F7 para as demonstrações; aviso não bloqueia compilação e não foi ocultado.
- DOM simulado com o JavaScript real do build: montagem, 20 SVG Lucide, botões/dialog/FAB, seleção autocomplete e smart select, calendar como sheet, checkbox, sheet/notification/toast, IMask/JustValidate, rotas/retorno com classes nativas das quatro transições, preservação dos campos e descarte do OK ao ficar offline passaram, sem erros JavaScript. Respostas de API nessa verificação são simuladas; não comprovam MySQL ou layout/animação visual em navegador real.
- Limites: Chromium não iniciou no ambiente de execução por restrição de socket; navegador remoto não acessou o servidor local. Vite foi verificado com host loopback para contornar restrição local de networkInterfaces; arquivo entregue mantém host true/strictPort/polling para Docker. Visual mobile/desktop, HMR no Docker Windows, npm na imagem Alpine e proxy para o Nginx/MySQL do responsável aguardam execução aí. Nenhuma captura de navegador foi salva como entrega.
- SDD, AGENTS/RULES e guia alinhados à retirada da biblioteca de estilos e ao planejamento injectManifest/push. README permanece especificação independente, sem marcar sprints concluídas. Não implementar ou solicitar permissão push nesta etapa.


## Ajuste do FAB — 2026-11-12

O responsável aprovou a Hello e solicitou FAB Speed Dial em vez de dialog. Usados f7-fab-buttons/f7-fab-button oficiais, expansão superior com três ações numeradas e rótulos, ícones +/× nativos; cada ação fecha o menu e mostra toast. Sem CSS ou animação próprios. Build aprovado. DOM simulado com bundle real confirmou abertura/fechamento nativos, três ações com fechamento/toast e ausência de dialog; demais interações continuaram passando, sem erros JavaScript. Conferência visual da expansão no Windows pendente.


## Executor fora do Compose — 2026-11-12

Decisão aprovada: manter Dockerfile, entrypoint e lógica Node existentes; substituir somente a forma de iniciar o executor por docker build e docker run --rm, sem foundation.cmd/foundation.sh. Guia inclui remoção manual exclusiva do serviço antigo, build sem cache opcional para validar a migração, execução CMD/Linux e testes bootstrap temporários sem socket (Engine simulado). Gerador de infraestrutura explicita que não se cadastra executor no Compose. README, AGENTS e contrato de ambiente alinhados. Backend, frontend, central, volumes e serviços do aplicativo preservados. Execução real por docker run no Windows/VPS ainda pendente.

Verificação desta mudança: 31 testes Node passaram (27 bootstrap/orquestração com Engine/Compose simulados e 4 cliente API). Guia regenerado conserva execução direta, ausência de serviço do executor e ordem infraestrutura → execução. Pacote conserva Dockerfile, entrypoint, manifests/lockfiles, backend e frontend idênticos à entrega anterior. Não foi realizado build novo nem docker run real no ambiente do responsável.


## Comandos do executor em linha única — 2026-11-12

Após o responsável colar as continuações e echo juntos, o bootstrap rejeitou os argumentos extras. Guia corrigido: docker run em uma linha inteira no CMD, testes e VPS; echo %ERRORLEVEL% em bloco separado, somente após o retorno do prompt. Sem mudança de runtime. Conferidos os argumentos e a integridade do pacote. Nova execução real ainda pendente.


## Manual independente da pasta do projeto — 2026-11-12

O responsável confirmou docker run real no Windows com saída 0, backend verificado e dependências preservadas. Migração do executor fora do Compose validada nesse ambiente. Por solicitação posterior, o manual usa meu-projeto/meu_projeto como exemplos em pastas, comandos, domínios, serviços e volumes; nomes/caminhos/portas/rede devem seguir o central e a infraestrutura real. Gerador não contém mais a suposição pwa-teste local: seu bloco gerenciado continua refletindo o alvo real descoberto, preservando os exemplos externos. Projeto, central e infraestrutura existentes não foram renomeados.


## Sprint 3 — design system e consistência — 2026-11-12

- Consolidado tokens.css com fonte/espaçamento existentes, dimensões de ícones/conteúdo/título, semântica vinculada ao Framework7 e foco visível. app.css fornece app-content/app-heading/app-note/app-actions/app-choice/app-grid-cell para Hello, auxiliar e composições; largura máxima compartilhada, quebra do status/textos e reserva do FAB baseada em métricas nativas/safe-area. Bordas/sombras/temas permanecem do framework; sem outra biblioteca ou nova identidade visual.
- Ações usam f7-button type=button, mantendo submit e retorno back oficiais. Código instalado do Framework7 Vue 9.2.0 mostra disabled como classe CSS: complementado aria-disabled/tabindex e guarda de reentrada no status, com preloader oficial/aria-busy/região de resultado.
- Labels visuais de f7-list-input são divs nessa versão: usado slot label oficial com label/for real nos quatro campos. JustValidate onValidate associa erro visível por aria-describedby e aria-invalid, limpa vínculos obsoletos e restaura atributos no destroy; máscara/v-model preservados.
- FAB continua Speed Dial oficial de três ações. Slot root documentado permite nome/estado no acionador real, estrutura Core preservada, Espaço/Escape, foco devolvido ao fechar e ações fechadas inert/fora do Tab. Ícones Lucide seguem tamanho do token, sem medidas duplicadas no JS. Movimento reduzido inclui a expansão do FAB.
- Documentação: 02-design-system descreve tokens/classes/estados/limites; telas, AGENTS/RULES e guia alinhados. Manual mantém exemplos genéricos e comandos em linha única. README continua especificação sem conclusão de sprints; contrato FAB reconciliado. foundation.json e estado gerado identificam 0.3.0-sprint.3, com aceite visual pendente explícito.
- Verificação: build Vite com Node 22.23.4 passou; mantém aviso de chunk acima de 500 kB do bundle oficial F7. 31 testes Node passaram (27 bootstrap/orquestração, 4 API). DOM simulado executou o bundle real: botões/disabled/loading, labels/required, erros/foco/correção ARIA, máscara, 20 SVG, FAB Espaço/Escape/foco/inert, quatro rotas/retorno e descarte do OK em indisponibilidade/offline passaram, sem erros JavaScript observados. API nessa checagem é simulada. jsdom foi instalado só em diretório temporário, sem nova dependência do projeto.
- Chromium não iniciou no ambiente do agente; não há validação visual, screenshot, contraste medido, leitor de tela, Tab/Enter nativos ou HMR/Docker Windows novos. Larguras/temas/redução de movimento e apresentação de foco/recortes precisam do aceite real. Sem novas telas, PWA, worker, push ou alteração da infraestrutura.


## Campos sem contorno retangular — 2026-11-12

Responsável rejeitou o outline retangular visível no campo E-mail após validação. Removidos campos do seletor de anel compartilhado e adicionada regra global input/select/textarea :focus/:focus-visible com outline none. Estilo próprio do Framework7 e foco funcional da validação preservados. Design system, AGENTS e RULES proíbem reintroduzir o contorno nos campos. Correção CSS; sem mudança de dependências.


## Sprint 4 — PWA/build/publicação — 2026-11-12

- Fixados vite-plugin-pwa 2.0.0 (peer declara Vite 8) e Workbox 7.4.1; sem trocar Vite/Vue/F7. Plugin 1.2.0 foi descartado na conferência por não declarar suporte ao Vite 8. npm ci pelo lockfile em Node 22.23.4 passou; sem instalação de runtime no Windows do responsável.
- Worker único src/sw.js via injectManifest/self.__WB_MANIFEST, virtual:pwa-register/prompt e onNeedReload explícito. Sem registro em dev. Precache contém apenas HTML/shell/offline, bundles/fontes, ícones e manifest públicos; NetworkOnly para o restante. Rotas técnicas, variantes codificadas/dotfiles/PHP fora dos fallbacks. Sem cache de API/CSRF/sessão/diagnóstico, push, nova fila ou usuário.
- PwaStatus na Hello: conexão, offline preparado, instalação explícita ou orientação de menu/iPhone, versão, verificação/atualização com confirmação. Rascunho dos campos conhecidos por aba/slug em sessionStorage, consumido uma vez/24h; falha de storage ou preservação integral bloqueia recarga. Ativação em outra aba mantém a aba alterada; ativação aprovada captura novamente antes de recarregar. Não é persistência de registros nem integração automática de formulários futuros.
- Manifest deriva da whitelist central; ícones PNG provisórios 192/512 e Apple 180, sem identidade visual final. Entrada index.html absoluta baseada em import.meta.url. Build id por hash público/fontes/lock/scripts. check:pwa valida arquivos/entrada/ícones/precache; scripts de publicação verificam staging e copiam assets antes de HTML/worker, mantendo assets antigos. Não prometer transação integral ou limpar assets antigos sem política.
- Bootstrap 0.4.0-sprint.4: mantém executor temporário fora do Compose, instala npm pelo lock, builda e verifica artefatos/HTTP. Código 2 aguarda alteração manual do site, sem criar segunda pilha. pwa-ready exige backend e HTTP PWA; não atesta comportamento do navegador. Novo verify-pwa.php tem somente diagnósticos controlados. Nginx gerado usa dist, separa rotas Laravel internas, controla cache e 404 de assets. Infraestrutura real não foi alterada pelo agente.
- Evidências: npm ci e build reais no runtime Linux do agente; 40 testes Node passaram (contratos/orquestração do bootstrap, cliente API e lógica PWA). Build/check em pasta chamada application, fora de frontend e com cwd externo, passou com o mesmo identificador da cópia de referência. Sintaxe PHP aprovada. Verificador PHP/cURL executado contra servidor temporário com arquivos reais do build: sucesso correto e rejeições de cache incorreto, worker HTML e rota API HTML. Esse servidor não é Nginx/PHP-FPM/MySQL do responsável.
- Build mantém aviso >500 kB do bundle oficial F7; SW compilado ~17 kB. Sem captura ou execução real de SW/instalação em Chromium/aparelho: ambiente de navegador do agente já apresentou restrição de inicialização. Testes do manager usam callbacks/ambiente simulados; não comprovam evento real entre abas, menu de instalação, offline nem TLS. Alpine/Docker Desktop, Nginx real, ADB/iPhone/Android, duas versões reais e produção permanecem no aceite. Vitest/Playwright completos continuam para a consolidação final prevista, sem dependências silenciosas adicionadas nesta sprint.
- Guia da raiz conserva exemplos genéricos e comandos em uma linha, com Nginx/build, prévia única 5177→4173, USB ADB e roteiro de atualização. SDD, regras e metadados reconciliados; arquivos privados, vendor/node_modules, dist e staging fora do pacote. Backend de negócio e dependências PHP preservados.


## Infraestrutura atual recebida para Sprint 4 — 2026-11-12

Recebidos Compose e sites_local.conf atuais. Confirmados bind compartilhado no PHP/Nginx, vendor/modules nomeados, serviço Node 22/perfil dev/porta 5176 e rede infra_network; não há necessidade de alterar Compose ou recriar PHP. Site pwa-teste ainda apontava para backend/public com redirecionamento /status. Preparado sites_local.conf completo fora do projeto, substituindo exclusivamente esse bloco pelo template PWA vigente; bytes dos demais sites preservados. Aplicação e nginx -t/reload reais ficam com o responsável, seguidos do bootstrap/build/HTTP. Nenhum arquivo de infraestrutura ou credencial foi arquivado no projeto.


## Aceite local da Sprint 4 — 2026-11-12

- Responsável enviou saída real do bootstrap no Windows/Docker: dependências PHP preservadas, npm instalado pelo lock, build PWA e HTTP via Nginx concluídos; build 0.4.0-def6b174a174. Não foi necessária reconstrução do executor nem mudança do Compose.
- Chrome Android via USB/ADB, origem localhost:5177: inicialmente aparecia a antiga tela Demonstração. Captura no PC mostrou a Hello atual; o responsável clicou Atualizar aplicativo no celular e confirmou a troca para a versão atual. Registro de versão antiga no navegador não foi tratado como ausência da seção no código entregue.
- Teste real entre builds: após preencher campos na Hello e publicar outra versão, confirmou atualização pelo botão com todos os campos preservados.
- Teste real com duas abas: informou sucesso do roteiro completo, com campos diferentes por aba; a segunda manteve os campos sem recarga automática e os preservou ao confirmar sua própria atualização.
- Após os testes, o responsável confirmou encerramento da Sprint 4. As confirmações de atualização/campos/abas foram textuais; não foram inventados logs adicionais, valores preenchidos ou testes independentes do agente. Não há nesta conversa comprovação específica de instalação na tela inicial da Hello atual nem homologação de iPhone/produção/HTTPS público; não generalizar o aceite local para esses ambientes.
- Não acrescentar esse histórico ao instalacao-pwa-framework.md: o roteiro do zero e os testes operacionais necessários já estão lá. Esta atualização altera somente MEMORY.md; nenhum comando ou reinstalação é necessário. Próxima sprint: Push Notifications (Sprint 5).


## Sprint 5 — Web Push — 2026-11-13

- Conferidas fontes oficiais do canal WebPush, Laravel 12 Notifications/Queues e código das versões instaladas. Fixado laravel-notification-channels/webpush 13.0.1, Minishlink Web Push 11.0.0; Composer instalou oito pacotes novos, sem atualizar/remover dependências existentes. Laravel 12.70.0/Sanctum 4.4.0/PHP 8.2 preservados. Auditoria Composer dessa resolução sem advisories. Frontend sem nova dependência de runtime.
- Central privado deriva PUSH_ENABLED/PUSH_TEST_AUTH_ENABLED/VAPID ao backend. Push desligado por padrão. PHP valida subject/par P-256, gera inicialmente quando habilitado e vazio e persiste no central sem exibir chaves; par válido preservado, parcial/inválido interrompe. Configuração efetiva inclui fila/push/VAPID. .env.testing recebe push/test-auth desligados e chaves vazias; produção recusa acesso de teste. Nenhuma conta/envio é criado no bootstrap.
- Migration própria: preferência e marcação de usuário, inscrições com endpoint_hash único e endpoint/chaves criptografados, envios com payload criptografado e tokens locais somente hash/validade. APIs web + Sanctum/sessão/CSRF, ownership, throttling/no-store; inscrição idempotente sem transferência entre contas, múltiplos dispositivos, consulta/revogação própria, preferência global e estado de envios. Acesso de teste usa CLI/code de uso único/10min, exclusivamente local; sem senha fixa/login de produção.
- PushNotificationService percorre usuários/dispositivos em blocos de 100. SendPushDelivery usa database/push, UUID, revalidação de ambiente/preferência/ownership, lock, três tentativas/backoff e validade de 24h. Transporte síncrono pelo canal oficial com DNS público validado/pinado, allowlist de provedores, TLS e sem redirects/proxy. Somente 404/410 removem inscrição; rede/429/5xx retomam; configuração/VAPID/401/403 não apagam inscrições válidas. Sem endpoint/chaves/cookies/conteúdo privado no resultado/log.
- push:work no PHP-FPM existente: lock e execução limitada, processo filho com limite externo de 75s, sem exigir pcntl; exige retry_after >75s e proc_open. Manual inclui operação local/Cron, sem novo serviço Compose. Enfileirada, aceita pelo provedor, falhou/cancelada são distintos; não existe confirmação de leitura/entrega garantida. Interrupção após aceite pode duplicar (tag UUID); revogação não recolhe envio já em trânsito.
- PushSettings.vue na Hello com controles oficiais, sessão local opcional, permissão somente por clique, estado de suporte/HTTPS/iOS/ambiente, preferência e dispositivos próprios. services/push.js reutiliza a registration. sw.js único ganhou push/notificationclick/pushsubscriptionchange com waitUntil e destino defensivo da mesma origem. Clique foca destino exato ou abre outra aba, sem navegar uma aba diferente com formulário alterado. Código de acesso/operação em andamento bloqueiam atualização; código não vai ao rascunho. Foco dos inputs, FAB e guardas PWA anteriores preservados.
- Evidências do agente: instalação Composer real em PHP 8.2.35; 22 testes PHP determinísticos/152 assertions passaram, incluindo crypto/par incompatível, geração VAPID em central temporário/reexecução/erro privado, DNS/rotas seguras, sessão/bearer sem sessão, CSRF sem Origin, flag local/produção e respostas de provedores simuladas (sem transporte). 46 testes Node passaram: bootstrap/Engine simulado, configurações privadas, API/PWA e handlers push/clique em VM. Pint aprovado; sintaxe PHP aprovada. Build Vite/Workbox/check:pwa passou, 13 arquivos públicos; build 0.5.0-48923ce271f2. Avisos existentes de chunk F7 >500 kB e opção interna inlineDynamicImports do plugin não foram ocultados.
- DOM simulado executou o bundle real (somente import.meta adaptado pelo harness): nenhuma permissão na montagem/login; sessão mock, clique de permissão, inscrição/preferência, feedback enfileirado e cancelamento passaram. Regressão da Hello passou: labels/erros/máscara, disabled/loading, 20 ícones, FAB/teclado/foco e quatro retornos/status offline. API, PushManager e provedor nessa checagem são simulados; jsdom só no diretório temporário, sem dependência entregue. Não há nova captura nem prova de layout/SW real em navegador.
- Pendências: cinco testes PushMySqlTest entregues no grupo mysql/RefreshDatabase com guarda existente intacta, sem execução aqui (MySQL do responsável indisponível); suíte MySqlIntegrationTest anterior também deve rodar aí. Nenhum provider push real foi contatado e nenhum envio real executado pelo agente. Faltam Docker Windows/PHP-FPM/MySQL reais, sessão via proxy/Nginx, consumo efetivo do worker, recebimento/clique app aberto/fechado, desativação/revogação/preferências, iPhone/HTTPS e regressão real de instalação/offline/atualização. SDD (exatamente sete arquivos), AGENTS/RULES, README, metadados e guia atualizados. Sem alteração da infraestrutura compartilhada, credenciais, volumes ou arquivos privados do responsável.


## Correção do aviso opcional WebPush — 2026-11-13

Responsável criou/inscreveu o dispositivo no Chrome Android pela prévia localhost:5177, preferência ativa, executou push:work e não recebeu notificação. Captura mostra Falhou · confira configuração e provedor, sem status HTTP. Isso comprova falha registrada, não a causa exata no PHP-FPM dele.

Reproduzido no PHP 8.2 do agente sem GMP/BCMath: construtor Minishlink sem logger emite E_USER_NOTICE de desempenho; Laravel converte em ErrorException e o canal registrava configuration-or-endpoint antes de enviar. GMP/BCMath são sugestões opcionais do pacote. SafeWebPushChannel agora injeta PSR NullLogger pela API oficial, preservando os checks de extensões obrigatórias, TLS/pin/ownership, exceções de configuração e relatórios HTTP. Sem alteração de Composer, chaves, imagem PHP ou infraestrutura; não desabilitado o tratamento global de erros.

Adicionado PushTransportTest exercitando os métodos reais de construção do canal, geração de chaves, criptografia Web Push e transporte PSR-18 com HTTP 201 simulado sob o handler real do Laravel. Ambiente sem GMP/BCMath passou: 23 testes PHP/156 assertions; Pint dos arquivos alterados passou. Nenhum provedor real foi contatado. Frontend não alterado; sem necessidade de novo build para esta correção. O pacote cumulativo inclui as duas observações recentes do manual (contato VAPID e e-mail independente do usuário de teste).

Próximo passo: aplicar a correção, gerar novo envio pelo botão do celular e executar push:work. A confirmação da causa/recebimento no ambiente do responsável continua pendente; não reutilizar o envio anterior já marcado como falho nem afirmar Sprint 5 homologada.


## Diagnóstico por etapas após correção — 2026-11-13

O responsável repetiu o envio com a correção e informou a mesma falha; confirmou GMP=NAO/BCMath=NAO. A ausência dessas extensões opcionais não explica, por si só, a persistência após o logger corrigido. Causa no ambiente real ainda não identificada. Entregue diagnose-push.php para CLI: confirma código corrigido carregado, flags/fila, valida VAPID e correspondência ao central, consulta último envio/inscrição, lê chaves criptografadas, verifica DNS/política, monta payload/destinatário e usa o canal oficial com PSR-18 HTTP 201 estritamente simulado. Não consome fila, altera registros nem envia a um provedor. Saída limitada a etapa/códigos conhecidos/tipo/nome de arquivo/linha, sem exceção completa, endpoints, chaves ou payload. Sintaxe/Pint do script aprovados; execução local parou corretamente em VAPID não configurado no fixture do agente, com saída controlada. A execução completa depende da saída do responsável; não foi anunciada como testada no MySQL ou dispositivo dele.


## Histórico push em pilha e confirmações locais — 2026-11-13

Responsável confirmou chegada real da notificação (captura Chrome · localhost:5177, Teste da PWA e HTTP 201), instalação da PWA e recebimento em segundo plano. Depois confirmou o teste de clicar na notificação abrindo a PWA. No teste guiado da preferência, enfileirou com a caixinha ativa, desmarcou antes do worker e confirmou Cancelada; captura mostra preferência desligada e histórico com cancelamentos. Não inventar testes de revogação ou resultados MySQL ainda não enviados.

A pedido do responsável, PushSettings passou a mostrar somente os quatro envios mais recentes em lista ordenada vertical, com chips oficiais Framework7: azul enfileirada, verde aceita, vermelho falhou, cinza cancelada. Texto/HTTP/detalhe preservados. Chips são informativos, sem ação/foco de botão. Novo teste atualiza a lista e retira automaticamente o mais antigo da exibição; o histórico no banco e a API de últimos 20 registros permanecem. CSS compartilhado ajusta largura/quebra/altura/espaçamento com tokens e contraste do texto iOS; não reintroduz outline nos inputs. Sem dependências novas, polling ou mudanças na fila.

Verificações: build/check:pwa aprovados, 13 arquivos públicos, build 0.5.0-73656f214361; 16 testes unitários frontend passaram. DOM simulado com bundle real confirmou quatro registros de cinco, cores por status, HTTP/erro visíveis, sem controles falsos, inclusão de novo envio no topo e saída do quarto sem apagar os seis registros da fixture; ativação/permissão/teste/cancelamento continuaram funcionando. API/PushManager/HTTP são mocks, import.meta adaptado pelo harness; sem aceite visual novo em navegador real. jsdom só em diretório temporário. Atualizados SDD de telas/design system; manual conserva todas as revisões recentes e as referências em lista. Pacote cumulativo inclui o diagnóstico e a correção do SDK, sem arquivos privados ou dependências instaladas.


## Clareza da lista de dispositivos push — 2026-11-13

Responsável confirmou a atualização visual dos quatro últimos envios com cores (captura), mas rejeitou a linha comprimida Naveg.../Este dispositivo/Revogar. Substituída por seção Dispositivos cadastrados com descrição curta da finalidade, cards Framework7 por inscrição, identificação e nome completos em linhas próprias e botão vermelho Remover dispositivo abaixo, em largura total. Confirmação explica que novos envios serão impedidos. A ação superior de desativação permanece somente para inscrição local sem vínculo com a conta; removida a duplicação do dispositivo atual. Mensagem principal simplificada para cadastrado/não cadastrado. APIs, preferências, fila e ownership preservados.

Build/check:pwa passou (0.5.0-67516da444d4, 13 arquivos públicos); 16 testes frontend passaram. DOM simulado executou bundle real: dois cards, identificação do atual e nome longo, botão red/full-width, ausência de ação superior duplicada, confirmação e DELETE do alvo correto; remover remoto preservou assinatura local, remover atual cancelou assinatura e exibiu Ativar. Histórico de quatro chips continuou correto. APIs/PushManager simulados; isso não encerra a validação real de revogação/MySQL e não é nova homologação visual em navegador. Atualizados SDD de telas/design system e pacote cumulativo; nenhuma dependência nova. Aplicação exige build no ambiente do responsável e confirmação da atualização da PWA.


## Revogação real e isolamento dos rate limiters — 2026-11-13

Responsável confirmou Cancelada após enfileirar e remover o dispositivo antes do worker. Suíte real no PHP-FPM/MySQL retornou 29 passed/1 failed, 203 assertions, 7.98s. Passaram integração MySQL/app:sync, ownership/criptografia/idempotência, múltiplos dispositivos/preferência, ambiente desligado/revogação, expiração, guards/CSRF, relatórios e transporte simulado. A falha foi a última chamada de replay do código de teste: esperado 401, recebido 429, PushMySqlTest:99. Esses resultados não foram tratados como aceite integral.

Causa confirmada por leitura do middleware Laravel 12.70.0 e reprodução determinística: throttle numérico sem prefixo usava a mesma assinatura de usuário/IP em login/logout/API/cadastro/envio; o grupo global e limites menores compartilhavam contador. Corrigido com RateLimiter::for e nomes independentes, mantendo todos os valores (global 60, login 5, logout 10, cadastro 20, teste 3 por minuto). Login por IP; demais por sessão web com fallback IP. Não removido middleware, aumentada cota ou modificado o assert 401 para ocultar o erro.

Três novos testes sem MySQL falharam antes da correção com 429 indevido: leituras gastavam cota de teste; logout gastava login; consultas gastavam cadastro. Depois passaram, inclusive verificando que a próxima tentativa acima de cada limite ainda recebe 429. Total determinístico: 26 testes/207 assertions passaram; Pint dos arquivos alterados passou. Teste MySQL original preservado. Conferida documentação oficial Laravel 12 Routing/Rate Limiting e código vendor da versão fixada. Alteração só backend/SDD/MEMORY; sem novas dependências, build frontend, migrations ou mudanças de infraestrutura. Falta nova execução da suíte completa no MySQL do responsável; não afirmar 33 testes passando sem receber a saída.


## Aceite local da Sprint 5 — 2026-11-13

- Evidências funcionais anteriores do responsável: recebimento real no Chrome Android via localhost:5177/USB e na PWA instalada em segundo plano; clique na notificação abriu a PWA. Preferência desmarcada após enfileirar resultou em Cancelada; remover o dispositivo antes do worker também resultou em Cancelada. Aprovou os ajustes de histórico em quatro blocos coloridos e a lista legível de dispositivos.
- Nova saída real recebida após a correção dos rate limiters: 33 passed (254 assertions), duração 7.27s, sem falhas. Passaram todos os testes Unit/Feature, incluindo MySqlIntegrationTest, os cinco PushMySqlTest, os três PushRateLimitTest e a rejeição 401 ao reutilizar o código de acesso após logout. A falha anterior 429 indevida ficou resolvida nessa execução.
- A suíte distingue testes reais de banco/persistência dos testes com relatórios/transporte simulados; o recebimento real foi comprovado separadamente pelo responsável no celular. Não houve nova execução desses testes pelo agente nem prova adicional de entrega em outros aparelhos. Caracteres de marcação exibidos com codificação incorreta no CMD não alteram o resultado informado de 33 passed.
- Satisfeitos os três grupos finais combinados: clique, preferência/revogação e suíte no MySQL testing. Encerrado o aceite local da Sprint 5. Próximo trabalho é Sprint 6, ainda não implementada por esta atualização. Alterado somente MEMORY.md e sua cópia no pacote cumulativo; manual, código, configurações e dados preservados. Nenhum novo comando de instalação é necessário por esta atualização documental.
