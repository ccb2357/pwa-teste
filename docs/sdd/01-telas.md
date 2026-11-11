# Telas

## Hello

Rota `/`, arquivo `frontend/src/pages/hello.vue`. Aparência nativa do Framework7 autorizada para a fundação; sem referência visual aprovada ainda. Identidade pública derivada do central, navbar, boas-vindas, status real e atualização manual. Estado de implementação e evidências em MEMORY.md.



**Finalidade:** permitir que a pessoa abra a base instalada e experimente Framework7 Vue, integração Laravel/MySQL e os recursos da PWA. Não criar controles próprios para imitar os oficiais, nem uma aplicação separada para as demonstrações. A página acompanha cada clone até ser substituída pela página inicial do produto.

Exibir mensagem de boas-vindas, nome do projeto vindo da configuração central, estado de conexão, atualização manual do status e indicação dos resultados reais. Identificar cada demonstração pelo nome do componente.

| Demonstração | Implementação exigida |
|---|---|
| Accordion | Componente oficial, com expansão e recolhimento interativos. |
| Autocomplete | API oficial ligada ao input padrão do Framework7, com sugestões locais de exemplo e seleção funcional. |
| Buttons | Botões oficiais com ações demonstrativas; variações seguem o design system. |
| Calendar | Calendário oficial aberto como sheet de baixo para cima, inclusive em desktop; não substituir por modal central ou datepicker do navegador. |
| Checkbox | Controle oficial com estado reativo. |
| Dialog | Diálogo modal oficial com abertura, confirmação/cancelamento e fechamento. |
| FAB | Floating Action Button oficial com ação demonstrativa. |
| Ícones Lucide | Seção com aproximadamente 20 ícones Lucide distintos, identificados; não usar Framework7 Icons nessa seção. |
| Notifications | Notificações oficiais com abertura e fechamento. |
| Sheet Modal | Sheet oficial com abertura e fechamento, além da demonstração do calendário. |
| Smart Select | Componente oficial com opções locais e seleção refletida no campo. |
| Toast | Toast oficial acionado por uma ação da página. |
| Page transitions | Ações separadas para cover-v, dive, fade e parallax, usando roteador/transições oficiais e página auxiliar com retorno. |

Usar os componentes oficiais Framework7 Vue quando disponíveis e APIs Core documentadas quando o recurso assim exigir; integrar refs, estado e limpeza ao ciclo de vida adequado. Conferir suporte/opções na versão fixada antes de implementar; se algum requisito não for suportado, registrar o impedimento para decisão, sem simular uma implementação oficial.

O status da API/banco deve vir de /api/v1/status e mostrar carregamento, sucesso, erro, indisponibilidade ou não verificado. Offline ou falha de requisição não podem manter um OK antigo como se fosse uma checagem atual. Não consultar MySQL diretamente pelo navegador nem expor credenciais. As demonstrações usam dados locais de exemplo; sua interação não comprova persistência.

Reservar na mesma página os estados de instalação, preparo offline e atualização da PWA, cuja integração funcional pertence à Sprint 4; na Sprint 2 não declarar esses recursos concluídos. Documentar Hello e página auxiliar em 01-telas.md, padrões/componentes em 02-design-system.md e comandos/URL em 04-ambiente.md.

**Aceite da Sprint 2:** Hello acessível pelo Vite no Windows; HMR .vue/JS/CSS operacional; status real pelo proxy; todas as demonstrações da tabela funcionam, incluindo seleção de sugestões, calendário subindo como sheet, os quatro exemplos de transição com retorno, formulário, máscara e validação. Nenhum controle equivalente é recriado fora das APIs oficiais; não há persistência nas demonstrações. Instalação/offline/atualização permanecem explicitamente pendentes para a Sprint 4.


## Destino de transição

Página auxiliar Vue simples, rota documentada na implementação, com retorno nativo. Hello oferece avanço e retorno reais em cover-v, dive, fade e parallax. Respeitar redução de movimento, sem animações substitutas.

## Status técnico Laravel

GET /status, HTML independente do Vite. Mostra Backend OK e Banco OK somente após consulta real, HTTP 503 quando indisponível, sem detalhes privados. GET /api/v1/status fornece o mesmo diagnóstico em JSON. Sem cache. Contratos em [05-api.md](05-api.md).

## Critérios comuns

Carregamento/sucesso/falha explícitos; offline nunca indica banco saudável sem resposta atual. Rótulos acessíveis, erros associados, foco visível e devolvido após diálogos, teclado, contraste e redução de movimento. Referência WCAG 2.2 AA. Fluxos de negócio futuros precisam de aprovação visual antes de implementar. Referências reais ficam em ../telas/; não criar aprovação fictícia.
