# Instalação — PWA Framework

## 1. Preparar a pasta e a configuração

Os exemplos usam `meu-projeto` em `C:\var\www`, com a pasta `infra` ao lado. Substitua nomes, caminhos, portas e rede pelos valores do seu `.env.foundation` e da infraestrutura.

Extraia o pacote na pasta escolhida, sem criar outra pasta de projeto dentro dela. Preserve arquivos privados e volumes existentes. O pacote não contém vendor, node_modules, .env preenchidos ou APP_KEY.

Prepare o arquivo de configuração central **manualmente**:

   - Abra a pasta `C:\var\www\meu-projeto` no Explorador de Arquivos.
   - Se `.env.foundation` ainda não existir, copie o arquivo `.env.foundation.example` nessa mesma pasta e renomeie a cópia para `.env.foundation`, sem acrescentar `.txt` ao nome.
   - Se `.env.foundation` já existir, mantenha o arquivo atual; não o substitua pelo exemplo.
   - Abra `.env.foundation` no VSCode ou em outro editor de texto, confira os campos e salve as alterações.

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

Antes de executar o bootstrap, aplique **todos os quatro itens** abaixo para o ambiente **local** e o projeto **pwa-teste**. Não duplique entradas que já estejam corretas. Os trechos abaixo refletem a configuração central e o mapeamento deste ambiente; confira-os antes de aplicar. O restante do guia usa exemplos, que devem ser adaptados ao projeto.

### 3.1 Serviço Node no Compose existente

Arquivo de destino: `C:\var\www\infra\docker-compose.yml`. Acrescentar o serviço ao `services` existente, sem duplicar essa chave. Inicie o Vite somente após executar o bootstrap e instalar as dependências, conforme a etapa 7.

```yaml
services:
    pwa-teste-node:
        image: node:22-alpine
        working_dir: /app
        volumes:
            - type: bind
              source: "C:\\var\\www\\pwa-teste\\frontend"
              target: /app
            - pwa_teste_node_modules:/app/node_modules
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
- pwa_teste_vendor:/var/www/pwa-teste/backend/vendor
```

### 3.3 Declaração dos volumes ao final do Compose

No mesmo arquivo, mesclar estas declarações no bloco `volumes` de nível raiz, no mesmo nível de `services` e `networks`. Se o bloco ainda não existir, criá-lo. O mount do passo anterior e esta declaração são necessários.

```yaml
volumes:
    pwa_teste_vendor:
        name: pwa_teste_vendor
    pwa_teste_node_modules:
        name: pwa_teste_node_modules
```

### 3.4 Site Nginx

No arquivo de sites ativo do Nginx, acrescentar o bloco abaixo preservando os outros sites. Nesta infraestrutura local, o destino é `C:\var\www\infra\nginx\sites_local.conf`. Em produção, usar o arquivo realmente montado e conferir os certificados. O root é `frontend/dist`; somente as rotas técnicas são encaminhadas ao Laravel. Substitua o bloco anterior deste projeto, sem duplicar o server_name.

```nginx
# PWA FOUNDATION: pwa-teste — PWA Sprint 4
server {
    listen 80;
    server_name pwa-teste.localhost;
    root "/var/www/pwa-teste/frontend/dist";
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
        fastcgi_param SCRIPT_FILENAME "/var/www/pwa-teste/backend/public/index.php";
        fastcgi_param DOCUMENT_ROOT "/var/www/pwa-teste/backend/public";
        
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

A validação `config --quiet` não mostra nada quando está correta. Se os mounts já estiverem aplicados, não recrie PHP-FPM. Nesta atualização, substitua o bloco deste projeto pelo da etapa 3.4 e valide/recarregue o Nginx.

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

Com o Vite parado, abra a Hello pelo domínio do projeto. Teste instalação pelo botão/menu, offline após o primeiro carregamento e retorno da conexão. API/banco não podem manter OK offline. Código 0 não comprova instalação nem funcionamento em aparelho; push fica na próxima etapa.


## 7. Desenvolvimento com Vite (opcional)

No CMD:

```cmd
cd /d C:\var\www\meu-projeto\frontend
vite.cmd dev
```

Abra [http://localhost:5176](http://localhost:5176). Mantenha esse terminal aberto; encerre com Ctrl+C. Alterações em .vue/JS/CSS devem aparecer pelo HMR.

Esse endereço usa HMR e não registra o service worker. Teste a PWA pelo domínio Nginx ou pela prévia abaixo. Push ainda não está ativo.

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

Testes do cliente API frontend, na pasta infra:

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

## VPS e atualizações

Na pasta infra da VPS, com `.env.foundation` de produção, Compose, Nginx e HTTPS preparados:

```bash
docker build -t pwa-foundation-bootstrap:0.1.0 ../meu-projeto/scripts/bootstrap
docker run --rm --workdir /var/www/infra --env FOUNDATION_PROJECTS_ROOT=/var/www --mount type=bind,source=/var/www,target=/var/www --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --network infra_network pwa-foundation-bootstrap:0.1.0 --project /var/www/meu-projeto --force
```

Para atualizar: faça backup, execute `git pull` na pasta do projeto e repita o comando acima na pasta infra. Ajuste o source do mount, a raiz interna, a rede e os caminhos ao ambiente real da VPS. A imagem só precisa ser reconstruída quando seu conteúdo mudar.
