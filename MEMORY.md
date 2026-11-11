# Retomada

## Objetivo e estado vigente — 2026-11-11

Construir PWA Framework conforme README. Projeto local C:\var\www\pwa-teste, slug pwa-teste. Sprint 1: código entregue e verificações abaixo executadas em ambiente temporário do agente. **Instalação e aceite na infraestrutura Windows do responsável ainda pendentes.** Não declarar fundação completa ou avançar ao aceite da Sprint 2 sem integração real.

Próximo passo concreto: aplicar pacote cumulativo, preencher .env.foundation privado, incluir pwa-foundation-bootstrap no Compose existente, buildar executor e executar preparação; aplicar fragmentos gerados manualmente, recriar só PHP-FPM para vendor, validar/recarregar Nginx e repetir bootstrap. Roteiro completo em instalacao.md. Depois enviar resultado final e executar suíte PHP com grupo MySQL real.

## Entregue

- Esqueleto oficial laravel/laravel v12.12.2, ref 945f4e5a9fd3695dc0ee512f497c650fb82cfbb8, com origem exata em foundation.json (esse arquivo é a autoridade da referência).
- Laravel 12.70.0, Sanctum 4.4.0, PHPUnit 11.5.57, Pint 1.30.4 e demais dependências em composer.json/lock. Esqueleto e framework têm versões diferentes. Sem vendor no pacote.
- app:sync, diagnóstico HTML/JSON com consulta real, no-store, 503 e rotas independentes de sessão; Sanctum/CSRF preparado, sem login.
- Bootstrap ES modules executável: validação central, identificação/mapeamento Compose, geração manual de infra, verificação de portas, env/APP_KEY, permissões, bancos com conta existente, Composer idempotente e app:sync. Migrations de produção exigem --force; sem env testing gerado em produção.
- Dockerfile/entrypoint/dependências isoladas do executor; serviço pwa-foundation-bootstrap para inclusão manual. Docker CLI 28.5.1 e Compose 2.40.3 copiados da imagem docker:28.5.1-cli. Host do usuário usa Compose 5.1.3, que não foi substituído.
- frontend/vite.cmd entregue e derivado; manifests/dev/build serão da Sprint 2. Não executar o atalho antes dessa etapa.
- Blocos Compose/Nginx em instalacao.md, regenerados após preencher o central. Não usar como novo Compose/override nem substituir os mounts existentes.
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

## Pendências de aceite

1. Build e execução real do executor via Docker Desktop/socket no Windows. Validar mounts pwa_teste reais, Composer dentro do volume e conexão aos bancos existentes/criados com a conta configurada.
2. /status e /api/v1/status saudáveis pelo Nginx real, .env efetivo/CSRF e suíte completa com grupo mysql. Testes MySQL reais foram entregues, ainda não executados pelo agente. Executar app:sync duas vezes na integração e registrar ausência de migrations pendentes.
3. Docker/Linux e VPS reais, TLS/certificado, backups/restore, dois clones simultâneos e falhas parciais reais. Código e testes determinísticos não substituem esses aceites.
4. Sprint 2: Vue/Framework7/Hello, fonte Nunito local, versões auxiliares frontend exatas, configuração pública e integração npm no bootstrap. Sprint 4: build e verificações PWA. Não confundir backend-ready com conclusão integral.
5. Definir ferramentas de formatação/lint JS/CSS antes de novas dependências; nesta etapa JS usa check sintático e testes nativos Node, PHP usa Pint. Não adicionar bibliotecas silenciosamente.

## Histórico resumido

Sprint 0 criou os sete SDD e orientações, exemplo central, gitignore e referências sanitizadas; as cópias da infraestrutura foram posteriormente removidas por decisão do responsável. O mapeamento estático foi complementado pelas evidências Docker recebidas acima. Esses registros são históricos; uma nova análise deve partir dos arquivos atuais solicitados ao responsável.

## Empacotamento da Sprint 1

Pacote cumulativo verificado: sete documentos SDD, links locais válidos e arquivos obrigatórios presentes. Excluídos vendor/node_modules, configurações privadas, chaves, logs/caches/sessões e estado. A busca pelos valores sensíveis recebidos não encontrou ocorrências nos arquivos distribuídos. Composer validate --strict --no-check-all confirma schema/lockfile; sem no-check-all o Composer avisa sobre versões exatas, que são intencionais conforme a especificação.


## Correção do roteiro de instalação — 2026-11-11

O passo 4 de 04-ambiente.md agora separa serviço Node, mount vendor no PHP-FPM existente e declarações de volumes no nível raiz do Compose. README aponta diretamente para esse passo e o fragmento. Alteração somente documental; não altera infraestrutura nem comprova instalação no Windows.


## Nome do serviço de bootstrap — 2026-11-11

Por solicitação do responsável, o serviço Compose passa a se chamar pwa-foundation-bootstrap. Template e comandos do README/SDD atualizados; imagem pwa-foundation-bootstrap:0.1.0 e lock interno permanecem iguais. Aplicação no Compose compartilhado ainda manual.


## Instalação centralizada — 2026-11-11

Por solicitação do responsável, instalacao.md na raiz é o roteiro único com executor, serviço Node, mount PHP, volumes, Nginx, retomada, testes, app:sync e VPS. 04-ambiente.md conserva somente contratos técnicos e aponta para o guia. Removidos os três arquivos avulsos de integração; bootstrap atualiza somente o bloco gerenciado do guia e informa esse destino ao parar com código 2. Reexecuções preservam o texto externo ao bloco. Na aplicação sobre uma cópia anterior, apagar somente scripts/bootstrap/executor/compose-service.yml e a pasta infra-generated antiga; não alterar configurações privadas. Infraestrutura Windows continua com integração pendente conforme saída recebida do responsável.

Verificação desta alteração: 21 testes Node passaram, incluindo geração do guia para outro slug e preservação do texto externo ao bloco na reexecução. Quatro blocos YAML do guia passaram no parser; links locais e os sete SDD foram conferidos. Nenhuma nova execução no Docker Windows foi realizada pelo agente.


## Infraestrutura externa sem cópias arquivadas — 2026-11-11

Removida integralmente docs/referencias/infra e seus cinco arquivos (Compose, Dockerfile, configuração principal/sites Nginx e php.ini), por solicitação do responsável. Não recriar essa pasta nem arquivar cópias equivalentes em outro caminho. Outra IA deve pedir ao responsável os arquivos atuais necessários quando analisar/alterar a infraestrutura, pois o conteúdo pode mudar. Atualizados AGENTS, RULES, README, contrato de ambiente e guia de instalação; mapeamentos e evidências históricas foram identificados como tais. Os blocos próprios de integração da aplicação continuam em instalacao.md. Ao atualizar uma cópia anterior por extração de ZIP, excluir manualmente a antiga pasta docs/referencias/infra, pois extração não remove arquivos antigos. Alteração documental; nenhum código executável ou infraestrutura foi alterado.


## Pasta de imagens das telas — 2026-11-11

Caminho vigente: docs/telas/, diretamente sob docs. Pasta movida, README e caminhos relativos nos SDD de telas e design system atualizados. Usar esse caminho nas próximas entregas. Em cópias anteriores, mover as imagens existentes para docs/telas e remover a pasta intermediária vazia. Verificados os caminhos documentais e o ZIP; sem alteração de código executável.


## Preparação manual do arquivo central — 2026-11-11

O passo 1 de instalacao.md orienta copiar .env.foundation.example, renomear a cópia para .env.foundation somente se ausente e editar/salvar manualmente. Removido o bloco PowerShell desse passo por solicitação do responsável. Demais comandos de instalação preservados. Alteração somente documental.


Ajuste documental: removida de instalacao.md a orientação de renomear o serviço antigo; o guia usa diretamente pwa-foundation-bootstrap.


## Terminal de instalação local — 2026-11-11

Por solicitação do responsável, os comandos locais de instalacao.md usam Prompt de Comando (CMD): cd /d para navegação e echo %ERRORLEVEL% para consultar a saída. Validação Nginx seguida de reload usa && para impedir reload após falha. Removida a sintaxe PowerShell do guia. Alteração documental; comandos não executados no Windows pelo agente.


Revisão geral de terminais: instruções operacionais restantes do README ajustadas para CMD no Windows. Menções a PowerShell mantidas somente no histórico e na restrição técnica de independência de shell do bootstrap.
