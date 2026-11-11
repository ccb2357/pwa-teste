# PWA Framework — instruções de trabalho

Construir uma fundação reutilizável; o checkout de referência é pwa-teste. Ler [RULES.md](RULES.md), [MEMORY.md](MEMORY.md) e os documentos pertinentes em [docs/sdd/](docs/sdd/), antes de alterar código. O [README.md](README.md) contém o contrato aprovado e plano de construção.

**REGRA OBRIGATÓRIA — NÃO ADIVINHAR O FUNCIONAMENTO DA STACK. Ao menor sinal de dúvida sobre qualquer ferramenta, SEMPRE consultar sua documentação oficial antes de escrever código ou responder.**

Stack: Framework7 Vue 9.2.0, Vue 3, JavaScript com script setup, Vite 8.3.4, Tailwind 4 sem Preflight, Laravel 12.70.0/PHP 8.2, MySQL 8 e Docker compartilhado. Sem React, TypeScript ou Vue Router. Branch master.

Toda tela e todo componente devem seguir o design system em [02-design-system.md](docs/sdd/02-design-system.md). Usar controles oficiais e criar componentes próprios somente por necessidade real. Hello nativa está autorizada; novas telas de negócio e mudanças visuais globais exigem aprovação.

Instalação, comandos e trechos de infraestrutura: [instalacao.md](instalacao.md). Contrato técnico do ambiente: [04-ambiente.md](docs/sdd/04-ambiente.md). Não instalar Node/npm no Windows. Não criar outro Compose. Preparar trechos para aplicação manual, sem alterar infraestrutura compartilhada automaticamente. Ao assumir ou retomar uma análise de infraestrutura, pedir ao responsável os arquivos atuais de Compose, Dockerfile PHP-FPM, Nginx e php.ini necessários à tarefa. O histórico e o SDD não comprovam o conteúdo atual. Não manter cópias desses arquivos no projeto; reutilizar apenas arquivos atuais já fornecidos na mesma sessão, enquanto não houver indicação de mudança.

Clones recebem código pronto e executam o bootstrap Node/Docker a partir do arquivo central; não repetem sprints. Não criar usuários MySQL, senhas ou grants. Preservar APP_KEY, dados, volumes e personalizações. Nunca registrar segredos ou copiar credenciais dos arquivos enviados.

Atualizar a especificação responsável e MEMORY.md em cada entrega relevante. SDD descreve o sistema, MEMORY registra estado/evidências e próximo passo. Distinguir entregue, instalado e validado. Não declarar funcionamento no Windows ou VPS sem evidência real.
