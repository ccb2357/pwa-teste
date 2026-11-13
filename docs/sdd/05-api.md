# API e sessão

Base de negócio reservada /api/v1. Não há endpoints de negócio definidos.

| Método/rota | Sucesso | Falha |
| --- | --- | --- |
| GET /up | Saúde padrão Laravel | Falha da aplicação; não comprova banco |
| GET /api/v1/status | HTTP 200, application e database ok | HTTP 503, status error, application ok, database error |
| GET /status | HTML HTTP 200 com diagnóstico real | HTML HTTP 503 com indisponibilidade |

JSON saudável: `{"status":"ok","checks":{"application":"ok","database":"ok"}}`. Na falha do banco: `{"status":"error","checks":{"application":"ok","database":"error"}}`.

Status público agregado, consulta real simples ao MySQL, Cache-Control: no-store, sem credenciais/exceções/caminhos/versões detalhadas/usuários. Logs privados guardam detalhes. Um único serviço alimenta HTML e JSON. Testar falha também com Origin do frontend, sem 500 causado por sessão stateful.

Nginx deve encaminhar /api/*, /sanctum/csrf-cookie, /up e /status ao Laravel, nunca responder HTML da SPA para API. Worker/fallback não interceptam essas rotas.

Cliente HTTP centralizado envia cookies e Accept: application/json; futuras operações autenticadas inicializam GET /sanctum/csrf-cookie e enviam X-XSRF-TOKEN conforme mecanismo oficial Sanctum. Conferir middleware e origens com portas. Cookie exclusivo por produto, flags conforme ambiente. 401 sem autenticação, 403 sem permissão, 419 sessão/CSRF, 422 validação com mensagem geral e erros por campo, 503 indisponibilidade. Não reenviar gravações automaticamente após recuperar sessão.

Instantes ISO 8601 com fuso explícito, preferencialmente UTC; datas civis YYYY-MM-DD, sem convertê-las como instantes. Fuso de exibição vem do central. Formato de paginação será definido antes do primeiro endpoint paginado; payloads de negócio ainda não aprovados.

Referência oficial: https://laravel.com/docs/12.x/sanctum

Os diagnósticos usam respostas diretas sem resolver o factory de resposta/Redirector, que pode instanciar sessão em banco indiretamente. Cache-Control efetivo inclui no-store e pode incluir private do Symfony. /sanctum/csrf-cookie retorna 204 e cookies host-only; não constitui implementação de login.

## Cliente frontend

services/api.js envia credentials include e cache no-store, exige JSON e não converte erro/503 em sucesso. Mutações futuras obtêm /sanctum/csrf-cookie e enviam X-XSRF-TOKEN decodificado do cookie; sem token, bloqueiam envio. Não repetir POST automaticamente após 419. Status atual usa apenas GET /api/v1/status. O formulário de demonstração não grava informações; PushSettings usa as APIs autenticadas abaixo.


PWA: o service worker não armazena respostas destas APIs, sessão, CSRF, /up ou /status. Nenhuma rota de dados pode receber HTML do shell como resposta offline. Vite dev/prévia usam proxy técnico; no build Nginx encaminha as rotas ao mesmo Laravel. Instalação e atualização não autenticam usuários nem concedem permissão push.

## Web Push

Prefixo /api/v1/push. Rotas no grupo web com auth:sanctum + sessão web, CSRF obrigatório para mutações mesmo sem Origin, Cache-Control no-store/private. Bearer token isolado não substitui sessão. Limite autenticado 60/min; inscrição 20/min; teste 3/min. Falhas retornam mensagem controlada, sem trace, chaves, endpoint ou payload.

| Método e sufixo | Contrato |
| --- | --- |
| GET config | enabled/public_key/user(id,name)/test_auth. Somente chave pública; 401 sem sessão. |
| GET subscriptions | devices com id/fingerprint SHA-256/label/last_result/last_success_at. Somente próprios. |
| POST subscriptions | endpoint, keys.p256dh/auth, label opcional, contentEncoding=aes128gcm; dono da sessão. 201 novo/200 repetido; 409 pertence a outro dono, 422 dados, 503 desabilitado. |
| DELETE subscriptions/{id} | 204 próprio; 404 ausente/outra conta. Permitido com push desabilitado. |
| GET/PUT preferences | {enabled:boolean}; falso sempre permitido, verdadeiro exige ambiente habilitado. Jobs pendentes revalidam. |
| GET deliveries | Últimos 20 próprios: UUID/status/result/provider_status/attempts/created_at; sem payload/destino. |
| POST test | subscription_id próprio; só local + test_auth + conta marcada. 202 batch_id/queued/status; não comprova envio. |

Somente local e PUSH_TEST_AUTH_ENABLED=true: GET test-session informa disponibilidade; POST test-session recebe code (64 caracteres, hash/validade 10min/uso único), cria sessão web e regenera sessão/CSRF; POST test-logout revoga vínculo atual e encerra sessão. CLI push:test-user gera o código explicitamente para conta marcada; sem senha fixa. Rotas ocultas com 404 fora do local ou flag desligada. Limites login 5/min/logout 10/min. Código inválido/expirado: 401; já autenticado: 409. CSRF ainda obrigatório. Nenhum endpoint recebe ID de usuário destinatário ou oferece envio em massa público.

PushNotificationService aceita title<=100/body<=240/url<=512 e image opcional. URL/imagem são caminhos seguros da mesma origem, excluindo API/CSRF/status/dotfiles/PHP; imagem PNG/JPEG/WebP pública, sem conteúdo privado. Autorização dos destinos de negócio permanece responsabilidade do produto. Imagens variam por navegador/SO. Sucesso do provedor não confirma recebimento ou leitura.

