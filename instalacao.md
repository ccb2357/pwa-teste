# Instalação — PWA Framework

Este é o roteiro único de instalação e operação desta entrega. Todos os trechos de Compose e Nginx estão neste arquivo; não é necessário abrir outros arquivos para copiá-los.

Se estiver atualizando uma entrega anterior, remova os antigos `scripts/bootstrap/executor/compose-service.yml` e `infra-generated/` da cópia do projeto; eles foram substituídos por este guia. Preserve `.env.foundation`, os arquivos `.env`, os volumes e as configurações já aplicadas na pasta `infra`.

Os blocos abaixo são trechos de integração próprios da aplicação. Não são cópias completas nem comprovação da configuração atual da infraestrutura compartilhada. Outra IA deve pedir os arquivos atuais ao responsável antes de analisar ou alterar essa infraestrutura.

## Instalação local da Sprint 1

Aplicar o conteúdo do pacote para que a raiz seja C:\var\www\pwa-teste, sem uma segunda pasta pwa-teste aninhada. Preservar arquivos privados e volumes existentes. O pacote é cumulativo e não contém vendor, node_modules, .env preenchidos ou APP_KEY.

1. No PowerShell, criar o central **somente se ainda não existir**:

```powershell
Set-Location C:\var\www\pwa-teste
if (-not (Test-Path .env.foundation)) { Copy-Item .env.foundation.example .env.foundation }
notepad .env.foundation
```

Preencher DB_PASSWORD localmente com a senha da conta existente e conferir os demais campos. Não enviar senhas no chat. O exemplo usa root porque essa é a conta existente informada; não criar outra conta nem alterar grants.

2. Em `C:\var\www\infra\docker-compose.yml`, acrescentar o serviço abaixo ao `services` existente. Não duplicar a chave `services` nem criar outro Compose. Se o executor já estiver cadastrado com o nome antigo `foundation-bootstrap`, renomear essa chave para `pwa-foundation-bootstrap`.

```yaml
# TRECHO: incluir somente pwa-foundation-bootstrap no services do Compose EXISTENTE.
# Não executar este arquivo como uma segunda pilha.
services:
    pwa-foundation-bootstrap:
        build:
            context: ../pwa-teste/scripts/bootstrap
            dockerfile: Dockerfile
        image: pwa-foundation-bootstrap:0.1.0
        working_dir: /var/www/infra
        environment:
            FOUNDATION_PROJECTS_ROOT: /var/www
        volumes:
            - ../:/var/www
            - /var/run/docker.sock:/var/run/docker.sock
        networks:
            - infra_network
        profiles:
            - tools
```

O template usa build context ../pwa-teste/scripts/bootstrap, imagem pwa-foundation-bootstrap:0.1.0, raiz ../:/var/www, socket /var/run/docker.sock e rede infra_network. Perfil tools; nomear explicitamente o serviço em compose run o ativa sem subir todo o perfil. Em outra organização de pastas/socket, adaptar o template uma vez ao ambiente real. Depois do primeiro build, a imagem/entrypoint são compartilhados; o código de inicialização é sempre lido do projeto alvo.

3. Na pasta infra, validar, construir somente o executor e iniciar a preparação:

```powershell
Set-Location C:\var\www\infra
docker compose --profile dev --profile tools config --quiet
docker compose build pwa-foundation-bootstrap
docker compose run --rm pwa-foundation-bootstrap --project /var/www/pwa-teste
$LASTEXITCODE
```

Na primeira execução sem recursos pwa-teste, o código esperado é **2**: os blocos gerenciados deste instalacao.md foram atualizados com os valores do ambiente e a instalação PHP ainda não iniciou. Corrigir erro de build/CLI/socket antes de prosseguir; não declarar sucesso pelo fato de a imagem existir.

<!-- BEGIN FOUNDATION INSTALL INFRA -->

4. Aplicar as alterações abaixo, geradas para o ambiente **local** e o projeto **pwa-teste**. Este bloco é atualizado pelo bootstrap a partir da configuração central e dos mounts reais; o restante do guia é preservado.

### 4.1 Serviço Node no Compose existente

Arquivo de destino: `C:\var\www\infra\docker-compose.yml`. Acrescentar o serviço ao `services` existente, sem duplicar essa chave. O frontend será implementado na Sprint 2; não iniciar o serviço agora.

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

### 4.2 Mount vendor no PHP-FPM existente

No mesmo Compose, localizar `services.php-fpm.volumes` e acrescentar somente a linha abaixo. Preservar os mounts atuais; não criar outro serviço PHP nem substituir sua lista de volumes.

```yaml
- pwa_teste_vendor:/var/www/pwa-teste/backend/vendor
```

### 4.3 Declaração dos volumes ao final do Compose

No mesmo arquivo, mesclar estas declarações no bloco `volumes` de nível raiz, no mesmo nível de `services` e `networks`. Se o bloco ainda não existir, criá-lo. O mount do passo anterior e esta declaração são necessários.

```yaml
volumes:
    pwa_teste_vendor:
        name: pwa_teste_vendor
    pwa_teste_node_modules:
        name: pwa_teste_node_modules
```

### 4.4 Site Nginx

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

5. Validar o Compose e recriar apenas PHP-FPM para aplicar o novo vendor mount. Isso causa uma breve interrupção dos sites PHP compartilhados. Não reconstruir a imagem PHP: Composer e extensões já existem. Validar/recarregar somente o Nginx:

```powershell
Set-Location C:\var\www\infra
docker compose --profile dev --profile tools config --quiet
docker compose up -d --no-deps --force-recreate php-fpm
docker compose exec -T nginx nginx -t
if ($LASTEXITCODE -ne 0) { throw "Corrija a configuração do Nginx antes de recarregar." }
docker compose exec -T nginx nginx -s reload
```

Se nginx -t falhar, corrigir antes do reload. Não usar up do perfil inteiro, down -v ou apagar volumes. O serviço pwa-teste-node precisa estar declarado, mas não ficar rodando; o frontend ainda pertence à Sprint 2.

6. Repetir o mesmo bootstrap:

```powershell
Set-Location C:\var\www\infra
docker compose run --rm pwa-foundation-bootstrap --project /var/www/pwa-teste
$LASTEXITCODE
```

Agora ele confere vendor efetivo, plataforma, configuração, bancos, migrations e HTTP/CSRF. Ao término bem-sucedido da etapa backend, abrir http://pwa-teste.localhost/status. JSON em http://pwa-teste.localhost/api/v1/status; saúde padrão em http://pwa-teste.localhost/up. Código 0 nesta release significa backend da Sprint 1 inicializado; não atesta frontend, PWA ou conclusão integral da fundação.


## Verificações e testes

Os resultados reais, inclusive o que foi apenas simulado, ficam em [MEMORY.md](MEMORY.md). Ao assumir ou retomar uma análise da infraestrutura, solicitar ao responsável os arquivos atuais necessários; não presumir que o histórico ainda represente a configuração real. Arquivos atuais já enviados na mesma sessão podem ser reutilizados enquanto não houver indicação de mudança. Após instalação do backend local, na pasta infra:

```powershell
Set-Location C:\var\www\infra
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php artisan test --env=testing
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php vendor/bin/pint --test
docker compose run --rm --entrypoint node pwa-foundation-bootstrap --test /var/www/pwa-teste/scripts/bootstrap/tests/contracts.test.mjs /var/www/pwa-teste/scripts/bootstrap/tests/orchestration.test.mjs
```

A suíte completa inclui grupo mysql: consulta real, status saudável, app:sync duas vezes no banco testing e falha só na conexão daquele processo. Não desligar o MySQL compartilhado. Para executar apenas contratos determinísticos sem a integração saudável MySQL, usar:

```powershell
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php artisan test --env=testing --exclude-group=mysql
```

Mesmo testes determinísticos exigem central local e ambiente testing efetivo para conferir o isolamento. TestingDatabaseGuard roda na criação da aplicação antes de traits como RefreshDatabase: APP_ENV=testing, central APP_ENV=local, conexão mysql, servidor/porta correspondentes, banco igual ao DB_TEST_DATABASE e distinto do principal; sem URL/socket/read-write alternativos. Nunca preparar/executar testes destrutivos em produção.

Testes do bootstrap simulam Engine/Compose de forma explícita e não comprovam socket, criação de contêiner, publicação de porta ou mount real em Windows/Linux. Os testes unitários de paths preservam espaços e impedem escapes; validações reais de portabilidade e dois clones pertencem ao aceite final.

## app:sync e operação diária

Comando implementado: optimize:clear e, só após sucesso, migrate com migrations pendentes. Propaga falha/código e não anuncia sucesso parcial. Não instala dependências, builda, semeia, apaga dados ou gera chaves. Em produção, --force obrigatório antes de limpar caches e repassado somente às migrations.

```powershell
Set-Location C:\var\www\infra
docker compose exec -T -w /var/www/pwa-teste/backend php-fpm php artisan app:sync
```

frontend/vite.cmd já é entregue e gerado pelo bootstrap, mas dev/build exigem os manifests/scripts da Sprint 2. O atalho resolve os caminhos pela própria pasta, desativa delayed expansion, preserva identidade Compose, dev publica --service-ports e build não publica. Propaga código Docker e não instala npm automaticamente. Não executar dev/build nesta etapa backend.

## VPS, atualizações e recuperação

Primeira instalação VPS: clone/pull da release pronta, criar .env.foundation próprio com APP_ENV=production/PRODUCTION_URL HTTPS e conexão real. Integrar executor manualmente se ausente; mapear infraestrutura efetiva e aplicar os blocos deste guia regenerados na VPS. Não copiar credenciais/estado/dados locais.

Na pasta infra da VPS, depois de definir caminhos reais e aplicar alterações:

```text
docker compose run --rm pwa-foundation-bootstrap --project /var/www/pwa-teste --force
```

O caminho acima pressupõe a mesma raiz interna configurada; adaptar ao mount real, nunca inferir ambiente pelo sistema operacional. Site de produção gerado inclui HTTPS e caminhos de certificado que precisam corresponder ao Certbot real. Não presumir certificado provisionado. A verificação final em production usa a origem HTTPS pública com validação de certificado; redirecionamento HTTP interno não basta.

Atualizações: backup validado, git pull da revisão desejada e mesmo bootstrap com --force para migrations em produção. Preservar arquivos privados, volumes, APP_KEY e dados; mudanças de infra param com código 2 até aplicação manual. Não recriar Laravel/Vite. Releases de negócio com frontend precisarão das integrações de build previstas nas sprints seguintes; esta release cobre backend.

Antes de publicação externa, definir e testar backup/restauração isolada de banco e arquivos persistentes, retenção/acesso e plano de recuperação. Publicar assets antes do HTML, manter clientes PWA antigos compatíveis e distinguir rollback de código de restauração de dados. Comandos finais de certificado, backup/restore e deploy dependem da VPS efetiva e devem existir antes de publicar. Não presumir migration reversa segura.

