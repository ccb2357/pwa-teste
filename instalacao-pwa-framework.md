# Instalação — PWA Framework

## 1. Preparar a pasta e a configuração

Aplicar o conteúdo do pacote para que a raiz seja C:\var\www\pwa-teste, sem uma segunda pasta pwa-teste aninhada. Preservar arquivos privados e volumes existentes. O pacote é cumulativo e não contém vendor, node_modules, .env preenchidos ou APP_KEY.

Prepare o arquivo de configuração central **manualmente**:

   - Abra a pasta `C:\var\www\pwa-teste` no Explorador de Arquivos.
   - Se `.env.foundation` ainda não existir, copie o arquivo `.env.foundation.example` nessa mesma pasta e renomeie a cópia para `.env.foundation`, sem acrescentar `.txt` ao nome.
   - Se `.env.foundation` já existir, mantenha o arquivo atual; não o substitua pelo exemplo.
   - Abra `.env.foundation` no VSCode ou em outro editor de texto, confira os campos e salve as alterações.

## 2. Construir a imagem do executor

No **Prompt de Comando (CMD)**:

```cmd
cd /d C:\var\www\infra
docker build -t pwa-foundation-bootstrap:0.1.0 ../pwa-teste/scripts/bootstrap
```

O executor roda temporariamente, fora do Compose. Se já houver um serviço `pwa-foundation-bootstrap` no Compose, remova somente esse bloco e salve; preserve os demais serviços, volumes e rede. Não crie atalhos de bootstrap.

Para testar a migração sem reutilizar cache, acrescente `--no-cache` ao build acima. Não é necessário apagar a imagem antiga. Nas próximas execuções, reconstrua apenas se o Dockerfile, entrypoint ou dependências do executor mudarem.

<!-- BEGIN FOUNDATION INSTALL INFRA -->

## 3. Preparar serviço Node, mount, volumes e site

O executor usa docker run --rm (etapas 2 e 5); não cadastrar serviço de bootstrap no Compose.

Antes de executar o bootstrap, aplique **todos os quatro itens** abaixo para o ambiente **local** e o projeto **pwa-teste**. Não duplique entradas que já estejam corretas. Os valores desta entrega estão prontos para pwa-teste local; se o central usar outros nomes, caminhos ou portas, ajuste os trechos para esse ambiente antes de aplicá-los. O bootstrap atualiza este bloco ao conferir o ambiente, preservando o restante do guia.

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

No arquivo de sites ativo do Nginx, acrescentar o bloco abaixo preservando os outros sites. Nesta infraestrutura local, o destino é `C:\var\www\infra\nginx\sites_local.conf`. Em produção, usar o arquivo realmente montado e conferir os certificados. O root desta release é `backend/public`; não apontar para `frontend/dist` antes da Sprint 4.

```nginx
# PWA FOUNDATION: pwa-teste — backend Sprint 1
server {
    listen 80;
    server_name pwa-teste.localhost;
    root "/var/www/pwa-teste/backend/public";
    index index.php;
    charset utf-8;

    location = / { return 302 /status; }
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location = /index.php {
        include fastcgi_params;
        fastcgi_pass php-fpm:9000;
        fastcgi_param SCRIPT_FILENAME "/var/www/pwa-teste/backend/public/index.php";
    }
    location ~ \.php$ { return 404; }
    location ~ /\. { deny all; }
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

A validação `config --quiet` não mostra nada quando está correta. Se os mounts e o site já estiverem aplicados, não é necessário recriar PHP-FPM nem recarregar Nginx novamente.

Recrie somente o PHP-FPM para aplicar o mount vendor. Isso interrompe brevemente os sites PHP compartilhados; não é necessário reconstruir a imagem PHP.

```cmd
docker compose up -d --no-deps --force-recreate php-fpm
```

Valide o Nginx e recarregue somente se a validação passar:

```cmd
docker compose exec -T nginx nginx -t && docker compose exec -T nginx nginx -s reload
```

Não execute `down -v` nem inicie todo o perfil dev. O bootstrap prepara as dependências; o Vite será iniciado na etapa 7.

## 5. Executar o bootstrap

Agora o serviço Node, os volumes, o mount PHP-FPM e o site Nginx devem estar configurados e aplicados. Execute:

```cmd
docker run --rm --workdir /var/www/infra --env FOUNDATION_PROJECTS_ROOT=/var/www --mount "type=bind,source=C:\var\www,target=/var/www" --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --network infra_network pwa-foundation-bootstrap:0.1.0 --project /var/www/pwa-teste
```

Quando o comando terminar e o prompt voltar, execute separadamente:

```cmd
echo %ERRORLEVEL%
```

Ao terminar, o contêiner é removido; a imagem e os dados do projeto permanecem.

O código esperado ao concluir esta etapa é **0**. Se retornar **2**, ainda existe alguma pendência: leia a lista exibida, confira as alterações da etapa 3, aplique-as conforme a etapa 4 e repita este comando. Não é necessário refazer as etapas que já estiverem corretas. Código **1** indica erro; envie a mensagem para análise.

## 6. Conferir o resultado

O bootstrap verifica as dependências, a configuração, os bancos, as migrations e a comunicação com o backend. Se terminar com código **0**, o backend foi verificado e as dependências frontend foram preparadas. Confira:

- [Status do backend e banco](http://pwa-teste.localhost/status)
- [Mesmo diagnóstico em JSON](http://pwa-teste.localhost/api/v1/status)
- [Verificação básica do Laravel](http://pwa-teste.localhost/up)

Abra a Hello na etapa 7. PWA, push e publicação continuam nas etapas próprias.


## 7. Abrir Hello

No CMD:

```cmd
cd /d C:\var\www\pwa-teste\frontend
vite.cmd dev
```

Abra [http://localhost:5176](http://localhost:5176). Mantenha esse terminal aberto; encerre com Ctrl+C. Alterações em .vue/JS/CSS devem aparecer pelo HMR.

Confira o status real, autocomplete, calendário em sheet, formulário/máscara, seletores, feedback, 20 ícones e as quatro transições com retorno. O formulário não grava dados. PWA/offline/push ainda não estão ativos.

Para conferir a compilação:

```cmd
cd /d C:\var\www\pwa-teste\frontend
vite.cmd build
```

## Verificações e testes

No CMD, execute um comando por vez. Os testes usam o banco exclusivo de testes.

```cmd
cd /d C:\var\www\infra
```

Testes do backend:

```cmd
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php artisan test --env=testing
```

Formatação PHP:

```cmd
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php vendor/bin/pint --test
```

Testes do bootstrap:

```cmd
docker run --rm --workdir /var/www/infra --mount "type=bind,source=C:\var\www,target=/var/www" --entrypoint node pwa-foundation-bootstrap:0.1.0 --test /var/www/pwa-teste/scripts/bootstrap/tests/contracts.test.mjs /var/www/pwa-teste/scripts/bootstrap/tests/orchestration.test.mjs
```

Testes do cliente API frontend, na pasta infra:

```cmd
docker compose --profile dev run --rm --no-deps pwa-teste-node npm test
```

Esperado: todos os testes passando e nenhuma falha de formatação.

## app:sync

Limpa os caches e aplica migrations pendentes. No CMD:

```cmd
cd /d C:\var\www\infra
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php artisan app:sync
```

## VPS e atualizações

Na pasta infra da VPS, com `.env.foundation` de produção, Compose, Nginx e HTTPS preparados:

```bash
docker build -t pwa-foundation-bootstrap:0.1.0 ../pwa-teste/scripts/bootstrap
docker run --rm --workdir /var/www/infra --env FOUNDATION_PROJECTS_ROOT=/var/www --mount type=bind,source=/var/www,target=/var/www --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --network infra_network pwa-foundation-bootstrap:0.1.0 --project /var/www/pwa-teste --force
```

Para atualizar: faça backup, execute `git pull` na pasta do projeto e repita o comando acima na pasta infra. Ajuste o source do mount, a raiz interna, a rede e os caminhos ao ambiente real da VPS. A imagem só precisa ser reconstruída quando seu conteúdo mudar.
