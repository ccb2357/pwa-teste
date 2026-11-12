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

services/api.js envia credentials include e cache no-store, exige JSON e não converte erro/503 em sucesso. Mutações futuras obtêm /sanctum/csrf-cookie e enviam X-XSRF-TOKEN decodificado do cookie; sem token, bloqueiam envio. Não repetir POST automaticamente após 419. Status atual usa apenas GET /api/v1/status. Hello não grava informações; APIs push são escopo futuro da Sprint 5.


PWA: o service worker não armazena respostas destas APIs, sessão, CSRF, /up ou /status. Nenhuma rota de dados pode receber HTML do shell como resposta offline. Vite dev/prévia usam proxy técnico; no build Nginx encaminha as rotas ao mesmo Laravel. Instalação e atualização não criam endpoints ou usuários; Web Push continua pendente.
