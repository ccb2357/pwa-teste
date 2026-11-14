# Instalação — PWA Framework

## 1. Preparar a pasta e a configuração

Os exemplos usam `meu-projeto` em `C:\var\www`, com a pasta `infra` ao lado. Substitua nomes, caminhos, portas e rede pelos valores do seu `.env.foundation` e da infraestrutura.

Extraia o pacote na pasta escolhida, sem criar outra pasta de projeto dentro dela. Preserve arquivos privados e volumes existentes. O pacote não contém vendor, node_modules, .env preenchidos ou APP_KEY.

Prepare o arquivo de configuração central **manualmente**:

   - Abra a pasta `C:\var\www\meu-projeto` no Explorador de Arquivos.
   - Se `.env.foundation` ainda não existir, copie o arquivo `.env.foundation.example` nessa mesma pasta e renomeie a cópia para `.env.foundation`, sem acrescentar `.txt` ao nome.
   - Se `.env.foundation` já existir, mantenha o arquivo atual; não o substitua pelo exemplo.
   - Abra `.env.foundation` no VSCode ou em outro editor de texto, confira os campos e salve as alterações.

Você configura somente esse arquivo. O bootstrap gera os arquivos internos do Laravel/testing e a configuração pública do frontend, preservando as chaves existentes; não é necessário criar ou preencher esses arquivos manualmente.

## 2. Construir a imagem do executor

No **Prompt de Comando (CMD)**:

```cmd
cd /d C:\var\www\infra
docker build -t pwa-foundation-bootstrap:0.1.0 ../meu-projeto/scripts/bootstrap
```

O executor roda temporariamente, fora do Compose. Se já houver um serviço `pwa-foundation-bootstrap` no Compose, remova somente esse bloco e salve; preserve os demais serviços, volumes e rede. Não crie atalhos de bootstrap.

Para testar a migração sem reutilizar cache, acrescente `--no-cache` ao build acima. Não é necessário apagar a imagem antiga. Nas próximas execuções, reconstrua apenas se o Dockerfile, entrypoint ou dependências do executor mudarem.

<!-- BEGIN FOUNDATION INSTALL INFRA -->

## 3. Preparar serviço Node, mount, volumes e site

O executor usa docker run --rm (etapas 2 e 5); não cadastrar serviço de bootstrap no Compose.

Antes de executar o bootstrap, aplique **todos os quatro itens** abaixo para o ambiente **local** e o projeto **meu-projeto**. Não duplique entradas que já estejam corretas. Os trechos abaixo refletem a configuração central e o mapeamento deste ambiente; confira-os antes de aplicar. O restante do guia usa exemplos, que devem ser adaptados ao projeto.

### 3.1 Serviço Node no Compose existente

Arquivo de destino: `C:\var\www\infra\docker-compose.yml`. Acrescentar o serviço ao `services` existente, sem duplicar essa chave. Inicie o Vite somente após executar o bootstrap e instalar as dependências, conforme a etapa 7.

```yaml
services:
    meu-projeto-node:
        image: node:22-alpine
        working_dir: /app
        volumes:
            - type: bind
              source: "C:\\var\\www\\meu-projeto\\frontend"
              target: /app
            - meu_projeto_node_modules:/app/node_modules
        ports:
            - "127.0.0.1:5176:5173"
        networks:
            - infra_network
        profiles:
            - dev
```

### 3.2 Mount vendor no PHP-FPM existente

No mesmo Compose, localizar `services.php-fpm.volumes` e acrescentar somente a linha abaixo. Preservar os mounts atuais; não criar outro serviço PHP nem substituir sua lista de volumes.

```yaml
- meu_projeto_vendor:/var/www/meu-projeto/backend/vendor
```

### 3.3 Declaração dos volumes ao final do Compose

No mesmo arquivo, mesclar estas declarações no bloco `volumes` de nível raiz, no mesmo nível de `services` e `networks`. Se o bloco ainda não existir, criá-lo. O mount do passo anterior e esta declaração são necessários.

```yaml
volumes:
    meu_projeto_vendor:
        name: meu_projeto_vendor
    meu_projeto_node_modules:
        name: meu_projeto_node_modules
```

### 3.4 Site Nginx

No arquivo de sites ativo do Nginx, acrescentar o bloco abaixo preservando os outros sites. Nesta infraestrutura local, o destino é `C:\var\www\infra\nginx\sites_local.conf`. Em produção, usar o arquivo realmente montado e conferir os certificados. O root é `frontend/dist`; somente as rotas técnicas são encaminhadas ao Laravel. Substitua o bloco anterior deste projeto, sem duplicar o server_name.

```nginx
# PWA FOUNDATION: meu-projeto — PWA Sprint 4
server {
    listen 80;
    server_name meu-projeto.localhost;
    root "/var/www/meu-projeto/frontend/dist";
    index index.html;
    charset utf-8;
    add_header Cache-Control "no-cache" always;

    location = /sw.js { try_files $uri =404; add_header Cache-Control "no-cache" always; add_header Service-Worker-Allowed "/"; }
    location = /manifest.webmanifest { types { application/manifest+json webmanifest; } try_files $uri =404; add_header Cache-Control "no-cache" always; }
    location = /index.html { try_files $uri =404; add_header Cache-Control "no-cache" always; }
    location /assets/ { try_files $uri =404; add_header Cache-Control "public, max-age=31536000, immutable"; }
    location ~ /\. { deny all; }
    location ~ ^/(api|sanctum|up|status)(/|$) { rewrite ^ /index.php last; }
    location = /index.php {
        internal;
        include fastcgi_params;
        fastcgi_pass php-fpm:9000;
        fastcgi_param SCRIPT_FILENAME "/var/www/meu-projeto/backend/public/index.php";
        fastcgi_param DOCUMENT_ROOT "/var/www/meu-projeto/backend/public";
        
        add_header Cache-Control "no-store" always;
    }
    location ~* \.php(/|$) { return 404; }
    location / { try_files $uri $uri/ /index.html; }
}
```

<!-- END FOUNDATION INSTALL INFRA -->

## 4. Validar e aplicar a infraestrutura

Somente depois de construir a imagem e salvar **todas** as alterações da etapa 3, abra o **Prompt de Comando (CMD)**. Execute uma linha por vez; se um comando falhar, corrija antes de continuar.

Entre na pasta da infraestrutura e valide o Compose:

```cmd
cd /d C:\var\www\infra
docker compose --profile dev config --quiet
```

A validação `config --quiet` não mostra nada quando está correta. Se os mounts já estiverem aplicados, não recrie PHP-FPM. Se o site já corresponder à etapa 3.4, preserve-o; valide/recarregue somente após mudanças.

Recrie somente o PHP-FPM para aplicar o mount vendor. Isso interrompe brevemente os sites PHP compartilhados; não é necessário reconstruir a imagem PHP.

```cmd
docker compose up -d --no-deps --force-recreate php-fpm
```

Valide o Nginx e recarregue somente se a validação passar:

```cmd
docker compose exec -T nginx nginx -t && docker compose exec -T nginx nginx -s reload
```

Não execute `down -v` nem inicie todo o perfil dev. O bootstrap instala dependências e publica o build. Vite é opcional para desenvolvimento.

## 5. Executar o bootstrap

Agora o serviço Node, os volumes, o mount PHP-FPM e o site Nginx devem estar configurados e aplicados. Execute:

```cmd
docker run --rm --workdir /var/www/infra --env FOUNDATION_PROJECTS_ROOT=/var/www --mount "type=bind,source=C:\var\www,target=/var/www" --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --network infra_network pwa-foundation-bootstrap:0.1.0 --project /var/www/meu-projeto
```

Quando o comando terminar e o prompt voltar, execute separadamente:

```cmd
echo %ERRORLEVEL%
```

Ao terminar, o contêiner é removido; a imagem e os dados do projeto permanecem.

O código esperado ao concluir esta etapa é **0**. Se retornar **2**, ainda existe alguma pendência: leia a lista exibida, confira as alterações da etapa 3, aplique-as conforme a etapa 4 e repita este comando. Não é necessário refazer as etapas que já estiverem corretas. Código **1** indica erro; envie a mensagem para análise.

## 6. Conferir o resultado

O bootstrap verifica as dependências, a configuração, os bancos, as migrations e a comunicação com o backend. Código **0** confirma backend, build PWA e arquivos/cabeçalhos HTTP no Nginx. Confira:

- [Hello/PWA](http://meu-projeto.localhost/)
- [Status do backend e banco](http://meu-projeto.localhost/status)
- [Mesmo diagnóstico em JSON](http://meu-projeto.localhost/api/v1/status)
- [Verificação básica do Laravel](http://meu-projeto.localhost/up)

Com o Vite parado, abra a Hello pelo domínio do projeto. Teste instalação pelo botão/menu, offline após o primeiro carregamento e retorno da conexão. API/banco não podem manter OK offline. Código 0 não comprova instalação, funcionamento em aparelho ou recebimento push.


## 7. Desenvolvimento com Vite (opcional)

No CMD:

```cmd
cd /d C:\var\www\meu-projeto\frontend
vite.cmd dev
```

Abra [http://localhost:5176](http://localhost:5176). Mantenha esse terminal aberto; encerre com Ctrl+C. Alterações em .vue/JS/CSS devem aparecer pelo HMR.

Esse endereço usa HMR e não registra o service worker. Teste a PWA pelo domínio Nginx ou pela prévia abaixo. Push funciona somente no build.

Para refazer o build e publicar em dist:

```cmd
cd /d C:\var\www\meu-projeto\frontend
vite.cmd build
```

## Testar a PWA no Windows/Android por USB

Após aplicar os arquivos, atualize dependências pelo bootstrap da etapa 5; alternativamente, com configuração pública já regenerada, execute na pasta infra:

```cmd
docker compose --profile dev run --rm --no-deps meu-projeto-node npm ci
```

Faça o build com `vite.cmd build` e confira os arquivos antes de abrir uma única prévia:

```cmd
docker compose --profile dev run --rm --no-deps meu-projeto-node npm run check:pwa
```

```cmd
docker compose --profile dev run --rm --no-deps meu-projeto-node ls -l /app/dist/index.html /app/dist/manifest.webmanifest /app/dist/sw.js
```

```cmd
docker compose --profile dev run --rm --no-deps -p 127.0.0.1:5177:4173 meu-projeto-node npm run preview
```

Abra primeiro http://localhost:5177 no Windows. Mantenha a prévia aberta. Para Android, conecte o cabo, autorize a depuração USB e, em outro CMD, use o caminho real do ADB:

```cmd
C:\tools\platform-tools\adb.exe reverse tcp:5177 tcp:5177
```

```cmd
C:\tools\platform-tools\adb.exe reverse --list
```

Abra http://localhost:5177 no Chrome Android. A porta interna 4173 do log não é o endereço do aparelho. Se houver vários aparelhos, selecione com `-s`. Ctrl+C encerra a prévia.

## Conferir atualização

Preencha campos na Hello do build A. Altere um texto de demonstração no código e execute `vite.cmd build` para gerar B. Na aba A, clique em Verificar atualização; confirme Atualizar aplicativo e confira os campos preservados. Repita com outra aba preenchida: ela deve aguardar sua confirmação. Recusar a atualização mantém a aba atual. Sem armazenamento de sessão disponível, a atualização com campos alterados é bloqueada.

O rascunho da Hello é temporário, por aba/projeto, e só é salvo ao confirmar a atualização; não salva registros no banco. Os assets anteriores são mantidos em dist/assets para abas antigas. A limpeza deles depende do plano de publicação; não apague durante este teste.

## Conferir o design system

Após atualizar o pacote, mantenha o Vite aberto e recarregue a Hello. Sem mudanças de dependências, não é necessário reconstruir o executor nem reinstalar npm.

Confira no celular/desktop: grid e página auxiliar, fonte/ícones, formulário vazio/inválido/válido e retorno das transições. Com Tab/Enter/Espaço/Escape, confira foco, botões, campos e FAB. O status deve mostrar carregamento e nunca manter OK ao ficar offline.

## Push Notifications (opcional)

1. No `.env.foundation`, acrescente/confira os campos abaixo. O `VAPID_SUBJECT` é obrigatório com push habilitado por exigência da configuração VAPID. O e-mail serve apenas como contato técnico: não envia nem recebe alertas automáticos e não aparece nas notificações. Informe um e-mail válido ou substitua por uma URL HTTPS sua. Deixe as duas chaves vazias **somente na primeira configuração**; preserve as já existentes.

```dotenv
PUSH_ENABLED=true
VAPID_SUBJECT=mailto:seu-email@seu-dominio.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
PUSH_TEST_AUTH_ENABLED=true
```

`PUSH_TEST_AUTH_ENABLED=true` é exclusivo de testes locais. Em produção, mantenha `false` e use a autenticação do produto. Para não usar push, mantenha `PUSH_ENABLED=false`.

2. Execute novamente o bootstrap da etapa 5. Ele instala as dependências PHP, prepara as tabelas, gera/preserva VAPID e publica o build. Não exige novo serviço Compose nem reconstrução do executor. Mantenha `.env.foundation` privado e não apague VAPID/APP_KEY nas atualizações.

**Nome exibido nas notificações:** configure `PROJECT_NAME="Nome do aplicativo"` e `PWA_SHORT_NAME="Nome curto"` no `.env.foundation` e repita o bootstrap da etapa 5 para atualizar o manifest e o build. O Android pode demorar para atualizar o nome da PWA já instalada. O sininho é o ícone pequeno da notificação, separado do nome.

3. No CMD, crie o acesso de teste local:

```cmd
cd /d C:\var\www\infra
```

```cmd
docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php artisan push:test-user teste-push@example.test
```

`teste-push@example.test` identifica apenas o usuário de teste no banco; pode manter esse exemplo. Não precisa ser igual ao e-mail do `VAPID_SUBJECT` e não recebe e-mails.

4. Abra a Hello pelo build (Nginx ou prévia 5177/ADB). Se aparecer Atualizar aplicativo, aplique a atualização. Na seção Push Notifications, cole o código exibido no terminal e entre; ele vale 10 minutos e só pode ser usado uma vez. Clique **Ativar neste dispositivo** e permita notificações.

5. Clique **Enviar teste para este dispositivo**. Depois, no CMD:

```cmd
docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php artisan push:work
```

Confira a notificação e o clique de retorno ao app. Repita com o app fechado, mantendo navegador/SO autorizados. **Enfileirada** aguarda o worker; **aceita pelo provedor** ainda não comprova exibição. Se houver retentativa, aguarde e execute o worker novamente.

6. Confira preferência global desligada, desativação/revogação do dispositivo e saída da conta. Imagens dependem do navegador. iPhone/iPad exige PWA instalada e aberta pela Tela de Início; fora de localhost, use HTTPS. O código de acesso não é salvo: conclua o login ou limpe o campo antes de atualizar a PWA.

Em VPS, agende o worker no Cron a cada minuto, adaptando os caminhos/serviço existentes:

```cron
* * * * * cd /var/www/infra && docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php artisan push:work >/dev/null 2>&1
```

O usuário do Cron precisa acessar Docker. O comando tem lock e tempo limitado; não substitui a autenticação do produto. Desligue `PUSH_TEST_AUTH_ENABLED` e repita o bootstrap ao terminar os testes locais.

### Usar push nas funcionalidades do aplicativo

Crie a regra de notificação no backend do produto, em um Service, Job ou Listener. Quando a novidade estiver confirmada, selecione o usuário autorizado e chame o serviço central:

```php
$resultado = app(\App\Services\PushNotificationService::class)->sendToUser($usuario, [
    'title' => 'Nova publicação',
    'body' => 'Há uma novidade para você.',
    'url' => '/novidades/123/',
]);
```

`$usuario` é um modelo `App\Models\User` autorizado a acessar a novidade. Personalize `title`, `body` e `url`; o link deve ser uma rota real dentro do aplicativo. Não altere o teste da Hello para implementar notificações do produto. Avisos agendados usam uma rotina periódica que identifica quando notificar.

O serviço enfileira para os dispositivos inscritos com preferência ativa; `$resultado['queued']` informa a quantidade enfileirada. O worker descrito acima processa os envios; enfileirar não confirma recebimento.

Referências:

- [docs/sdd/03-arquitetura.md](docs/sdd/03-arquitetura.md) — serviço central, fila e gatilhos.
- [docs/sdd/05-api.md](docs/sdd/05-api.md) — campos, limites e contratos.
- [instalacao-pwa-framework.md](instalacao-pwa-framework.md#push-notifications-opcional) — configuração, teste e operação.

## Verificações e testes

No CMD, execute um comando por vez. Os testes usam o banco exclusivo de testes.

```cmd
cd /d C:\var\www\infra
```

Testes do backend:

```cmd
docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php artisan test --env=testing
```

Formatação PHP:

```cmd
docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php vendor/bin/pint --test
```

Testes do bootstrap:

```cmd
docker run --rm --workdir /var/www/infra --mount "type=bind,source=C:\var\www,target=/var/www" --entrypoint node pwa-foundation-bootstrap:0.1.0 --test /var/www/meu-projeto/scripts/bootstrap/tests/contracts.test.mjs /var/www/meu-projeto/scripts/bootstrap/tests/orchestration.test.mjs
```

Testes do frontend, na pasta infra:

```cmd
docker compose --profile dev run --rm --no-deps meu-projeto-node npm test
```

Esperado: todos os testes passando e nenhuma falha de formatação.

## app:sync

Limpa os caches e aplica migrations pendentes. No CMD:

```cmd
cd /d C:\var\www\infra
docker compose exec -T -w /var/www/meu-projeto/backend php-fpm php artisan app:sync
```

## Validação final da fundação

Faça esta validação seguindo o guia, sem reutilizar os arquivos privados da instalação anterior. Anote em MEMORY.md o comando, resultado e qualquer dúvida que tenha exigido ajuda. Só encerre o aceite depois de corrigir o guia e repetir a etapa afetada.

### 1. Instalar dois clones limpos

Use o pacote desta entrega ou um repositório atualizado com ele. Prepare duas pastas novas ao lado de `infra`, sem pasta extra aninhada e sem copiar `.env`, `.env.testing`, `.env.foundation`, `.foundation-state.json`, vendor, node_modules ou dist da instalação anterior.

Os nomes abaixo são exemplos para o teste; adapte todos os comandos e trechos do guia a eles:

| Campo no `.env.foundation` | Clone A | Clone B |
| --- | --- | --- |
| Pasta e PROJECT_SLUG | validacao-a | validacao-b |
| PROJECT_NAME / PWA_SHORT_NAME | Validação A | Validação B |
| LOCAL_DOMAIN | validacao-a.localhost | validacao-b.localhost |
| DEV_PORT | 5180 | 5182 |
| PREVIEW_PORT | 5181 | 5183 |
| DB_DATABASE | validacao_a | validacao_b |
| DB_TEST_DATABASE | validacao_a_test | validacao_b_test |

Use a conta MySQL e a rede existentes. Para conferir também chaves push isoladas, configure `PUSH_ENABLED=true`, `PUSH_TEST_AUTH_ENABLED=true` e seu contato VAPID nos dois; deixe as duas chaves vazias somente na primeira instalação de cada clone.

Execute as etapas 1–6 deste manual para cada clone, preservando os demais sites/serviços. **Você preenche somente `.env.foundation`:** o bootstrap cria os `.env` do Laravel/testing e a configuração pública do frontend. Não crie `.env` no frontend nem edite os derivados. Ao final, os dois domínios devem abrir a Hello e o bootstrap deve retornar 0.

### 2. Conferir reexecução e preservação

Antes de testar preservação, conclua as instalações dos dois clones. Na pasta infra, crie um usuário de teste em cada banco principal para não comparar apenas bancos vazios. O código de acesso exibido não precisa ser usado nesta etapa:

```cmd
docker compose exec -T -w /var/www/validacao-a/backend php-fpm php artisan push:test-user aceite@example.test
```

```cmd
docker compose exec -T -w /var/www/validacao-b/backend php-fpm php artisan push:test-user aceite@example.test
```

Salve uma referência privada de cada instalação:

```cmd
docker compose exec -T -w /var/www/validacao-a/backend php-fpm php artisan foundation:verify --save
```

```cmd
docker compose exec -T -w /var/www/validacao-b/backend php-fpm php artisan foundation:verify --save
```

Repita o bootstrap da etapa 5 para cada clone, sem alterar o central, interagir com o app ou processar filas entre a referência e a comparação. Dependências inalteradas devem ser preservadas. Depois:

```cmd
docker compose exec -T -w /var/www/validacao-a/backend php-fpm php artisan foundation:verify
```

```cmd
docker compose exec -T -w /var/www/validacao-b/backend php-fpm php artisan foundation:verify
```

```cmd
docker compose exec -T -w /var/www/validacao-a/backend php-fpm php artisan foundation:verify --compare=/var/www/validacao-b
```

Esperado: **PRESERVAÇÃO: OK** nos dois e **ISOLAMENTO DE IDENTIFICADORES: OK**. São comparados arquivos/chaves por hash e conteúdo das tabelas por hash/contagem; nenhum dado é exibido. `.foundation-acceptance.json` é privado e não vai ao Git. Comparar clones verifica nomes/portas/bancos/volumes declarados e chaves; o bootstrap confere os mounts no Engine. Execute também as verificações individuais: a comparação entre referências não substitui testar os dois apps.

Se falhar, mantenha a referência para investigar. `--save --replace-baseline` só cria outra referência quando a mudança é intencional e já foi revisada. O comando é exclusivo do ambiente local, exige bootstrap concluído e lê o banco principal; não executa migrations nem altera registros. Não rode durante atividade que modifique os dados.

### 3. Executar as verificações

Execute a seção **Verificações e testes** para cada clone, substituindo `meu-projeto`. Além do backend/Pint/bootstrap/Vitest, na pasta infra:

```cmd
docker compose --profile dev run --rm --no-deps meu-projeto-node npm run check
```

Esperado: lint JavaScript/Vue/CSS, Vitest e build/check:pwa passando. As ferramentas exigem Node 22.13+ na linha 22. Se o bootstrap informar imagem antiga, execute o comando abaixo e repita a etapa:

```cmd
docker pull node:22-alpine
``` Não precisa instalar Node/npm no Windows.

### 4. Testes automatizados no navegador

Mescle este serviço opcional ao Compose existente, adaptando pasta, nome e rede. Não altere PHP/MySQL/Nginx para executar estes testes:

```yaml
services:
    meu-projeto-browser-tests:
        build:
            context: ../meu-projeto/frontend
            dockerfile: tests/e2e/Dockerfile
        image: pwa-foundation-browser-tests:1.65.1-node22
        working_dir: /app
        init: true
        ipc: host
        volumes:
            - ../meu-projeto/frontend:/app
        tmpfs:
            - /app/node_modules
        networks:
            - infra_network
        profiles:
            - tools
```

O contêiner é temporário, com Node 22.13+ e navegadores da imagem oficial Playwright 1.65.1; não compartilha node_modules com o Alpine. Na pasta infra:

```cmd
docker compose --profile tools config --quiet
```

```cmd
docker compose --profile tools build meu-projeto-browser-tests
```

```cmd
docker compose --profile tools run --rm --no-deps meu-projeto-browser-tests
```

Esperado: verificações e testes passando; cenários de push/worker restritos a Chromium aparecem como ignorados nos outros motores. A primeira execução baixa imagem/dependências. Relatório em `frontend/playwright-report/index.html`.

Os testes usam o build numa prévia interna, com APIs e PushManager simulados; não acessam seus usuários nem enviam push real. Exercitam UI Chromium/Firefox/WebKit, formulário, FAB, transições, histórico e estados push. Chromium também testa worker/cache offline e atualização em duas abas, alterando temporariamente o worker gerado e restaurando-o ao final. Se uma execução for interrompida, refaça o build antes de continuar. Essa automação não substitui a validação pelo Nginx/aparelho.

### 5. Aprovar referências visuais

Gere candidatos com o mesmo serviço, a partir da pasta infra:

```cmd
docker compose --profile tools run --rm --no-deps meu-projeto-browser-tests sh -c "npm ci --include=dev && npm run test:visual:prepare"
```

Abra as imagens em `frontend/test-results/visual-candidates/`. Confira grid/formulário nas pastas `visual-desktop` e `visual-mobile`. Somente se aprovar, copie essas duas pastas pelo Explorador para `frontend/tests/e2e/visual-baselines/` e versione as referências aprovadas.

Depois compare sem atualizar as referências:

```cmd
docker compose --profile tools run --rm --no-deps meu-projeto-browser-tests sh -c "npm ci --include=dev && npm run test:visual"
```

Esperado: comparação passando. Referência ausente ou diferença precisa de análise; não gere outra automaticamente para esconder regressão. Use a mesma imagem/versão para comparar.

### 6. Conferir Nginx, aparelho e produção

Nos dois domínios Nginx, confira Hello, status HTML/JSON e saúde conforme etapa 6. Teste instalação/offline/retorno da rede e atualização em duas abas pelo roteiro deste guia. Para push real, siga a seção própria: recebimento e clique, preferência desligada e remoção antes do worker. Registre navegador/SO/origem e o que foi confirmado; emulação não comprova Android/iPhone.

Para VPS, execute o roteiro **VPS e atualizações** com configuração própria, HTTPS, backup/restauração isolada e worker agendado. Nunca rode a suíte destrutiva no banco de produção nem habilite acesso de teste local nela. Se não houver VPS/iPhone disponível, registre a pendência; não declare homologação desses ambientes. Antes de analisar ou alterar a infra compartilhada com outra IA, envie os arquivos atuais necessários, sem segredos.

Portabilidade: repita instalação/reexecução em uma raiz com espaços, ajustando os caminhos e `INFRA_COMPOSE_PATH`; registre Windows e Linux separadamente. Os testes simulados de mapeamento, dotenv e falha parcial não comprovam execução nesses hosts. Registre como pendente qualquer cenário não executado.

Feche a validação em MEMORY.md com resultados reais, simulações e pendências. Depois faça a limpeza final de README/SDD, preservando contratos e decisões necessárias para outra IA trabalhar sem esta conversa.

## VPS e atualizações

Na pasta infra da VPS, com `.env.foundation` de produção, Compose, Nginx e HTTPS preparados:

```bash
docker build -t pwa-foundation-bootstrap:0.1.0 ../meu-projeto/scripts/bootstrap
docker run --rm --workdir /var/www/infra --env FOUNDATION_PROJECTS_ROOT=/var/www --mount type=bind,source=/var/www,target=/var/www --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --network infra_network pwa-foundation-bootstrap:0.1.0 --project /var/www/meu-projeto --force
```

Para atualizar: faça backup, execute `git pull` na pasta do projeto e repita o comando acima na pasta infra. Ajuste o source do mount, a raiz interna, a rede e os caminhos ao ambiente real da VPS. A imagem só precisa ser reconstruída quando seu conteúdo mudar.
