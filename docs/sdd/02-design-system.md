# Design system

Usar a aparência nativa do Framework7 Vue 9.2.0, com Nunito local. A Hello aprovada é a referência de uso; não inventar identidade visual, paleta paralela ou controles equivalentes. Toda página consulta este contrato. Mudanças globais e novas variações visuais exigem aprovação e atualização compartilhada.

## Fonte e tokens

Importação única em frontend/src/main.js: bundle CSS Framework7 → Framework7 Icons → tokens.css → app.css. Não importar outra biblioteca de estilos. A ordem permite complementar layout/acessibilidade preservando controles, temas iOS/Material e estados nativos.

| Grupo | Implementação em frontend/src/css/tokens.css |
| --- | --- |
| Fonte | --app-font-family: Nunito, system-ui, sans-serif; --f7-font-family e --f7-button-font-family usam esse token. Fonte variável 200–900, font-display swap, binário/OFL em public/fonts/. |
| Espaçamento | --app-space-1/2/3/4/5: 4/8/16/24/32px. --f7-grid-gap usa space-3. |
| Conteúdo | --app-content-max: 960px; --app-heading-line-height: 1.2. |
| Ícones | --app-icon-size: 24px; --app-icon-label-min: 100px. SVG Lucide ocupa 100% do host. |
| Ênfase | --app-font-weight-strong: 700; tamanho de títulos e textos pequenos vem do Framework7. |
| Semântica | --app-text-muted/text-small usam list-item-subtitle-text-color/block-footer-font-size; success usa color-green; error usa input-error-text-color. Todos com prefixo nativo --f7-. |
| Superfície | --app-surface-background/radius usam --f7-list-bg-color/--f7-block-inset-border-radius. Bordas e sombras dos controles/overlays permanecem nativas; sem escala própria. |
| Foco | --app-focus-width/offset: 2px/2px; cor --app-focus-color usa --f7-theme-color. Em cores forçadas, Highlight do sistema. |

Aliases semânticos são resolvidos também nas superfícies e classes de tema, incluindo .dark; não fixar cores do tema claro em tokens herdados. Cor do manifest é metadado, não nova identidade CSS. Não adicionar token ou wrapper sem uso real.

## Layout compartilhado

Classes em frontend/src/css/app.css, consumidas por Hello, destino de transição e composições existentes:

- app-content: largura fluida até o limite compartilhado, centralização e quebra de textos longos. Hello e página auxiliar usam o mesmo contêiner.
- app-heading, app-note, app-actions, app-choice e app-grid-cell: título, apoio, ações com quebra, checkbox com rótulo e célula de exemplo. Medidas vêm dos tokens; sem estilos locais por página.
- Grid Framework7 grid-cols-1/medium-grid-cols-2/grid-gap; breakpoint medium nativo de 768px. Transições usam duas/quatro colunas. Ícones usam CSS Grid compartilhado, sem ultrapassar a largura disponível.
- Reserva inferior da Hello deriva de tamanho/margem nativos do FAB, space-4 e safe-area-bottom. Não sobrepor o último conteúdo. Cabeçalho do status permite quebra em telas estreitas.

## Componentes e estados

Usar controles oficiais diretamente; componentes próprios somente por composição/reutilização real. BackendStatus.vue reúne diagnóstico; LucideIcon.vue integra createElement oficial ao ciclo Vue e não altera nós gerenciados por outros componentes. Framework7 Icons 5.0.5 e pacote lucide fixados; não substituir por lucide-vue sem aprovação.

| Uso | Estados e regra |
| --- | --- |
| Ações | f7-button type=button; submit somente no formulário. fill para ação principal, outline para secundárias, small no status. Navegação de retorno usa o link back oficial. |
| Desabilitado | Manter disabled nativo do Framework7. Na versão 9.2.0 de f7-button isso gera classe CSS: complementar com aria-disabled e tabindex=-1. Ações assíncronas têm guarda contra reentrada. |
| Status | Não verificado → carregando (preloader oficial, botão indisponível, aria-busy) → OK/503/erro/offline. role=status anuncia resultado textual. Nunca indicar resultado somente pela cor nem manter OK antigo em falha/offline. |
| Formulário | Inputs Framework7; slot label contém label nativo associado ao input-id. E-mail/celular obrigatórios, IMask sincronizado com Vue; JustValidate mostra erros com cor/tamanho nativos e foca o primeiro inválido. |
| Erro de campo | Adaptador forms/demo.js usa onValidate para sincronizar aria-invalid e aria-describedby com o erro visível. Corrigir remove a descrição obsoleta; destroy restaura os atributos anteriores. Não duplicar mensagens ou validadores. |
| Dialog/Sheet | Confirmação/cancelamento e fechamento oficiais. Sheet tem nome acessível. Não redesenhar overlays. |
| Notification/Toast | Feedback oficial, com texto e fechamento conforme o uso. Notification interna não é Web Push. |
| FAB | Speed Dial oficial, três ações para cima, +/×. Slot root conserva estrutura Core .fab > a e fab-buttons. Nome/aria-expanded/aria-controls no acionador; ações fechadas são inert e saem da tabulação. Espaço aciona, Escape fecha e devolve foco ao acionador. |
| Ícones | Lucide decorativo com aria-hidden; seção exibe nomes. Ações só com ícone precisam de nome acessível no acionador. |

Por decisão do responsável, inputs, selects e textareas não exibem contorno retangular (outline), em :focus ou :focus-visible. A regra global em app.css preserva o estilo de foco próprio do Framework7; não reintroduzir anéis/contornos nos campos em novas telas ou componentes. Botões/links continuam com :focus-visible. Checkbox realça o rótulo quando o input recebe foco. Movimento reduzido mantém navegação sem animação e reduz transições do FAB; não criar animação substituta. Contraste, foco/recorte e operação por teclado/leitor de tela exigem conferência em navegador real; DOM simulado não é aceite visual nem certificação de acessibilidade.

## Evolução e verificação

Antes de alterar interface: consultar este arquivo, 01-telas.md, componentes existentes e referências em ../telas/. Não criar catálogo separado. Conservar referências aprovadas; não atualizar imagens para ocultar regressão.

Conferir Hello/auxiliar em larguras estreitas e desktop, campos vazios/inválidos/válidos, máscara, foco/Tab/Enter/Espaço/Escape, disabled/loading, status indisponível/offline e quatro retornos. Temas/claro/escuro e redução de movimento seguem Framework7 e preferências do navegador; não há seletor de tema novo. O roteiro operacional fica em ../../instalacao-pwa-framework.md; evidências e limites em ../../MEMORY.md.

Referências oficiais: [variáveis CSS](https://framework7.io/docs/css-variables), [Button Vue](https://framework7.io/vue/button), [FAB e eventos](https://framework7.io/docs/floating-action-button), [JustValidate onValidate](https://just-validate.dev/docs/methods/onValidate). Exports, props e eventos foram conferidos também no código das versões fixadas pelo lockfile; documentação publicada pode evoluir.


PwaStatus.vue compõe os blocos/botões/diálogo oficiais para instalação e atualização. Estados são textuais e anunciados, com ações explícitas; não cria paleta ou overlay próprio. Usa app-actions/app-note e preserva a regra de campos sem outline retangular.

A página técnica offline.html é a exceção mínima sem JavaScript: usa Nunito local, texto e link HTML nativos, sem identidade visual ou controles próprios. A Hello offline continua com o CSS/controles Framework7 completos do precache.

PushSettings.vue reutiliza block/list/list-input/checkbox/button/dialog oficiais, app-actions/app-choice/app-note e status-heading; sem CSS local. Código de teste tem label associado e autocomplete off. Estados assíncronos usam aria-busy, região role=status, disabled/aria-disabled/tabindex e guarda de reentrada. Revogação remota exige confirmação; falhas de sessão/permissão/inscrição têm texto explícito. Web Push do sistema operacional tem aparência definida pelo navegador/SO, não pelo Framework7.

