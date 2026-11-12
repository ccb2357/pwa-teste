# PWA Framework — instruções de trabalho

Construir uma fundação reutilizável; o checkout de referência é pwa-teste. Ler [RULES.md](RULES.md), [MEMORY.md](MEMORY.md) e os documentos pertinentes em [docs/sdd/](docs/sdd/), antes de alterar código. O [README.md](README.md) contém o contrato aprovado e plano de construção.

**REGRA OBRIGATÓRIA — NÃO ADIVINHAR O FUNCIONAMENTO DA STACK. Ao menor sinal de dúvida sobre qualquer ferramenta, SEMPRE consultar sua documentação oficial antes de escrever código ou responder.**

Stack: Framework7 Vue 9.2.0, Vue 3.5.45, JavaScript com script setup, Vite 8.3.4, Laravel 12.70.0/PHP 8.2, MySQL 8 e Docker compartilhado. Sem React, TypeScript ou Vue Router. Branch master.

Toda tela e todo componente devem seguir o design system em [02-design-system.md](docs/sdd/02-design-system.md). Usar controles oficiais e criar componentes próprios somente por necessidade real. Hello nativa está autorizada; novas telas de negócio e mudanças visuais globais exigem aprovação.

Instalação, comandos e trechos de infraestrutura: [instalacao-pwa-framework.md](instalacao-pwa-framework.md). Contrato técnico do ambiente: [04-ambiente.md](docs/sdd/04-ambiente.md). Não instalar Node/npm no Windows. Não criar outro Compose. Preparar trechos para aplicação manual, sem alterar infraestrutura compartilhada automaticamente. Ao assumir ou retomar uma análise de infraestrutura, pedir ao responsável os arquivos atuais de Compose, Dockerfile PHP-FPM, Nginx e php.ini necessários à tarefa. O histórico e o SDD não comprovam o conteúdo atual. Não manter cópias desses arquivos no projeto; reutilizar apenas arquivos atuais já fornecidos na mesma sessão, enquanto não houver indicação de mudança.

Executor temporário por docker run --rm, imagem construída com docker build; sem serviço de bootstrap no Compose e sem novos atalhos de bootstrap no host. Clones recebem código pronto e executam o bootstrap Node/Docker a partir do arquivo central; não repetem sprints. Não criar usuários MySQL, senhas ou grants. Preservar APP_KEY, dados, volumes e personalizações. Nunca registrar segredos ou copiar credenciais dos arquivos enviados.

Atualizar a especificação responsável e MEMORY.md em cada entrega relevante. SDD descreve o sistema, MEMORY registra estado/evidências e próximo passo. Distinguir entregue, instalado e validado. Não declarar funcionamento no Windows ou VPS sem evidência real.

Frontend: grid/CSS Framework7 + tokens compartilhados; main.js/App.vue/rotas F7, sem biblioteca extra de estilos. O bootstrap gera frontend/.foundation.public.json com whitelist e instala npm pelo lockfile no volume node_modules. Não ler o central privado no Vite. PWA/worker injectManifest entregue; push na Sprint 5, sem login completo antecipado.

Consistência: usar classes app-content/app-heading/app-note/app-actions e tokens existentes antes de criar CSS local. Conferir label/input, nomes acessíveis, foco visível, disabled/loading, mensagens e teclado (inclusive FAB). Não substituir controles oficiais por wrappers. Aceite visual e de teclado depende de navegador real; registrar separadamente simulações.

Regra visual aprovada: inputs, selects e textareas sem outline retangular de foco. Usar a regra global de app.css e o estado próprio do Framework7; não reintroduzir anéis/contornos nesses campos em CSS local ou compartilhado.

PWA: usar somente src/sw.js e virtual:pwa-register. Não cachear API/sessão/CSRF/diagnósticos nem recarregar formulário alterado por atualização automática. Novos formulários integram draftGuard explicitamente. Build usa staging/publicação validada; preservar assets antigos até política de limpeza. Comandos e aplicação manual do Nginx no guia; não confundir testes simulados com instalação real.
