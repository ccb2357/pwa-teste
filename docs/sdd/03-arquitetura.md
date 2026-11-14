# Arquitetura

Frontend independente em frontend/, Laravel em backend/, infraestrutura única externa em ../infra/. Stack e versões aprovadas na seção 1 do [README](../../README.md). Versões frontend verificadas e fixadas em package.json/package-lock.json; metadados em foundation.json.

Frontend: main.js registra Framework7Vue, componentes usados e CSS global; App.vue contém f7-app/view principal; routes.js associa rotas a pages/*.vue. Composition API/script setup JavaScript. Sem Vue Router nem aplicação Core paralela. APIs Core somente quando necessárias e integradas ao ciclo de vida Vue/Framework7.

components/ reúne composições reutilizáveis reais; services/api.js centraliza HTTP, cookies, CSRF e erros; forms/ reúne máscaras/conversões/validadores; css/ centraliza estilos e tokens. Inicializar/destruir máscaras, Autocomplete, Calendar, ícones e listeners sem duplicação, incluindo páginas retidas pelo roteador. Formulário Hello demonstra sem persistir.

Backend: serviço de diagnóstico único para HTML/JSON com consulta simples real MySQL e falha 503 controlada. Diagnósticos públicos independentes de sessão que possa consultar banco antes do diagnóstico. app:sync limpa caches e executa migrations; nunca instala, builda, semeia ou regenera chave.

Sessão Laravel/Sanctum com cookies e CSRF, host-only por padrão compatível com localhost:porta e domínio Nginx. Nome de cookie exclusivo por slug; origens stateful incluem portas efetivas. Produção HTTPS com cookies seguros. Validar CSRF através de Vite/proxy e Nginx. Login completo/permissões de negócio são escopo futuro; o acesso de teste push é restrito ao ambiente local e a contas marcadas.

Dados: migrations iniciais oficiais Laravel; banco principal e banco testing separados, mesma conta existente. Nenhuma entidade de negócio adicional. Banco testing deve ser validado contra a configuração efetiva antes de operações destrutivas; produção bloqueia essas operações.

PWA implementada via vite-plugin-pwa/Workbox injectManifest e fonte sw.js única, virtual:pwa-register, registerType prompt, desativado em dev. Cache público só para shell/recursos estáticos, nunca API/sessão/CSRF/status. Atualização detectada automaticamente, aplicada em momento seguro com tratamento de formulário alterado e múltiplas abas.

Bootstrap é Node ES modules, Docker CLI/Compose no executor temporário (docker run --rm, sem serviço no Compose) e socket do Engine existente. Sem Docker-in-Docker, shell de host ou dependência do node_modules do aplicativo. Contrato, derivações e mapeamento em [04-ambiente.md](04-ambiente.md).

## Módulos backend e inicialização

HealthCheck executa SELECT 1 e transforma falha em resultado agregado; StatusController produz JsonResponse/Response diretamente, evitando resolver Redirector/sessão por response() no diagnóstico. As rotas /status e /api/v1/status são registradas fora dos grupos web/api; statefulApi permanece para futuros endpoints de negócio.

AppSync é o comando próprio; TestingDatabaseGuard protege a conexão de testes antes das traits. Cache e sessão iniciais usam arquivos, evitando depender de tabelas antes das migrations.

Bootstrap: executor/ contém entrypoint e dependências isoladas; lib/config.mjs valida o central e deriva nomes; docker.mjs descobre recursos/mapeia paths e verifica infraestrutura; files.mjs gerencia env/chaves/estado; templates.mjs gera saídas; process.mjs executa sem shell e sem expor saída privada. php/ contém preparação de bancos, permissões e verificações de configuração/HTTP dentro do runtime PHP-FPM.

Metadados da fundação/skeleton ficam em foundation.json. composer.lock é a referência de dependências efetivas; executor/package-lock.json fixa o parser separado. O frontend mantém seu próprio package-lock.json.

## Frontend e instalação de dependências

Vite lê somente .foundation.public.json gerado pelo bootstrap; define uma whitelist de nome/slug/locale/fuso/URL/apiBase/cor do manifest no bundle. Configuração do proxy é consumida apenas pelo Vite. Tokens não vêm do central. api.js concentra credenciais/CSRF e erros, não repete mutações após 419. O formulário Hello não usa a API de gravação.

frontend.mjs usa contêiner Node temporário no Engine, bind host mapeado e volume exclusivo node_modules, sem Compose mutável dentro do executor. npm ci --include=dev usa lockfile; marcador real no volume combina hashes de manifest/lock e modo Node 22. Reexecução com dependências presentes/inalteradas não reinstala. Erro de npm interrompe com estado failed; não marca conclusão parcial. O bootstrap prepara frontend e publica o build verificado em dist, sem iniciar Vite. scripts/check-pwa.mjs confere os artefatos; publish-build.mjs valida staging, publica assets antes dos pontos de entrada e mantém assets antigos.

Web Push usa laravel-notification-channels/webpush 13.0.1/Minishlink 11.0.0, sem atualizar Laravel/PHP. PushNotificationService seleciona usuários autorizados, percorre usuários/dispositivos em blocos de 100 e cria PushDelivery + SendPushDelivery na fila database/push. Produtos definem destinatários/gatilhos no backend, nunca em broadcast público.


PwaStatus.vue usa pwa/manager.js para registro por virtual:pwa-register, instalação explícita, conectividade e atualização prompt. onNeedReload controla recarga por aba: formulário alterado não recarrega por ativação externa; confirmação salva dados conhecidos da Hello no sessionStorage antes de ativar/recarregar, com nova captura ao controlar a página. Falha no armazenamento mantém a aba. Rascunho por slug/aba, consumido uma vez e expira em 24h; sem persistência ou fila de dados da API. Novos formulários de produto precisam integrar explicitamente draftGuard.

O único sw.js usa Workbox precaching/routing/NetworkOnly. Fallback do shell somente / e rotas auxiliares conhecidas; demais navegações públicas sem rede recebem offline.html. technicalPath exclui API/sanctum/up/status/backend/storage/vendor, dotfiles e PHP inclusive variantes codificadas. Nenhum runtime cache de API, sessão ou CSRF; mutações seguem a rede. CacheStorage é isolado por origem/escopo; limpeza automática somente do precache Workbox deste escopo.

## Persistência e transporte push

users guarda push_enabled/is_push_test. PushSubscription deriva do modelo oficial, com endpoint_hash SHA-256 único para busca/ownership; endpoint e chaves são criptografados por APP_KEY. PushDelivery guarda UUID/lote/dono/dispositivo, payload criptografado e resultado controlado. Tokens de acesso de teste são hashes SHA-256 com validade; código não é persistido em texto. Não usar updatePushSubscription do trait oficial: o controller da fundação evita transferência e usa hash para pesquisar campos criptografados.

Jobs carregam somente o UUID, revalidam ambiente/preferência/ownership e cancelam inscrições revogadas ou envios com mais de 24h. Lock por envio, até três tentativas e backoff; SafeWebPushChannel usa Notifications/canal oficial com cliente PSR-18 síncrono. TLS, redirects desabilitados, allowlist de provedores, validação de todos os IPs DNS e CURLOPT_RESOLVE impedem destino privado/rebinding durante o envio. Provedores: FCM, Mozilla, Apple e subdomínios notify.windows.com. Novos provedores exigem revisão explícita dessa política.

Somente 404/410 removem inscrição. Rede/DNS indisponível/429/5xx retomam; 401/403 ou configuração inválida falham sem apagar inscrições válidas. DeliveryReports registra enfileirada/aceita/falha/cancelada, sem URLs/chaves/payload nos logs. Entrega é pelo menos uma tentativa: interrupção entre aceite e gravação pode duplicar; tag UUID reduz duplicação visual, sem promessa de exactly-once. Revogação não recolhe mensagem já enviada. Limpeza/retenção dos registros deve ser definida pelo produto.

O mesmo sw.js trata push, notificationclick e pushsubscriptionchange com waitUntil, payload mínimo e destino seguro na mesma origem. Não renova permissão automaticamente. PushSettings reconcilia inscrição local/lista da conta ao entrar, retornar à aba ou trocar controller. Logout Laravel revoga o ID associado à sessão; produtos devem também cancelar a inscrição local pelo cliente e preservar a verificação de ownership ao integrar seu login/logout.



O construtor WebPush recebe PSR NullLogger para não converter avisos opcionais de desempenho (GMP/BCMath) em exceções do Laravel nem registrar diagnósticos SDK privados. A verificação das extensões obrigatórias continua no bootstrap; validações, exceções e relatórios HTTP continuam determinando o resultado. Não desabilitar globalmente o tratamento de erros PHP.


Diagnóstico CLI opcional em scripts/bootstrap/php/diagnose-push.php confere configuração/inscrição/DNS e executa criptografia/canal com HTTP mock em memória. Não persiste resultado do mock nem consome fila; saída somente de etapas/metadados controlados, sem mensagens arbitrárias de exceção. O mock não comprova transporte externo ou recebimento.

## Contrato dos testes

Vitest usa configuração independente para lógica pura. Playwright testa o build em prévia interna; APIs e PushManager são simulados, sem enviar push ou acessar usuários reais. Status/falha, formulário/máscara, controles, FAB/teclado e retornos executam em Chromium desktop/mobile, Firefox e WebKit. Worker/cache offline e atualização em duas abas usam worker real somente no Chromium; o teste altera temporariamente o worker gerado e o restaura. A validação de dois builds completos, Nginx/aparelhos e produção permanece separada.

Referências visuais são candidatas até aprovação humana; comparação exige os quatro PNGs aprovados na mesma imagem/versão, sem atualização automática. Não versionar relatórios, screenshots de falha ou referências privadas. Leituras de banco para preservação pertencem ao comando local FoundationVerify; testes destrutivos continuam restritos ao banco testing pelo TestingDatabaseGuard. Evidências e limitações somente no MEMORY; roteiro no guia de instalação.
