# Telas

## Hello

Rota `/`, arquivo `frontend/src/pages/hello.vue`. Aparência nativa do Framework7 aprovada pelo responsável na Sprint 2; sem captura visual anexada como referência versionada. Identidade pública derivada do central, navbar, boas-vindas, status real e atualização manual. Estado de implementação e evidências em MEMORY.md.



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
| FAB | Speed Dial oficial: expande três ações para cima, alterna +/× e fecha ao selecionar uma ação, com confirmação por toast. |
| Ícones Lucide | Seção com aproximadamente 20 ícones Lucide distintos, identificados; não usar Framework7 Icons nessa seção. |
| Notifications | Notificações oficiais com abertura e fechamento. |
| Sheet Modal | Sheet oficial com abertura e fechamento, além da demonstração do calendário. |
| Smart Select | Componente oficial com opções locais e seleção refletida no campo. |
| Toast | Toast oficial acionado por uma ação da página. |
| Page transitions | Ações separadas para cover-v, dive, fade e parallax, usando roteador/transições oficiais e página auxiliar com retorno. |

Usar os componentes oficiais Framework7 Vue quando disponíveis e APIs Core documentadas quando o recurso assim exigir; integrar refs, estado e limpeza ao ciclo de vida adequado. Conferir suporte/opções na versão fixada antes de implementar; se algum requisito não for suportado, registrar o impedimento para decisão, sem simular uma implementação oficial.

O status da API/banco deve vir de /api/v1/status e mostrar carregamento, sucesso, erro, indisponibilidade ou não verificado. Offline ou falha de requisição não podem manter um OK antigo como se fosse uma checagem atual. Não consultar MySQL diretamente pelo navegador nem expor credenciais. As demonstrações usam dados locais de exemplo; sua interação não comprova persistência.

PwaStatus.vue na Hello mostra conexão, modo dev, instalação/menu manual, preparo offline, versão e atualização disponível. O worker é registrado apenas no build; validar a integração em navegador real. Documentar Hello e página auxiliar em 01-telas.md, padrões/componentes em 02-design-system.md e comandos/URL em instalacao-pwa-framework.md.

**Aceite da Sprint 2:** Hello acessível pelo Vite no Windows; HMR .vue/JS/CSS operacional; status real pelo proxy; todas as demonstrações da tabela funcionam, incluindo seleção de sugestões, calendário subindo como sheet, os quatro exemplos de transição com retorno, formulário, máscara e validação. Nenhum controle equivalente é recriado fora das APIs oficiais; não há persistência nas demonstrações. Aceite PWA é separado do desenvolvimento via Vite.


## Destino de transição

Arquivo frontend/src/pages/transition.vue. Rotas /transition/cover-v/, /transition/dive/, /transition/fade/ e /transition/parallax/, com retorno nativo e opções de transição do roteador. Hello oferece avanço e retorno reais em cover-v, dive, fade e parallax. Respeitar redução de movimento, sem animações substitutas.

## Status técnico Laravel

GET /status, HTML independente do Vite. Mostra Backend OK e Banco OK somente após consulta real, HTTP 503 quando indisponível, sem detalhes privados. GET /api/v1/status fornece o mesmo diagnóstico em JSON. Sem cache. Contratos em [05-api.md](05-api.md).

## Critérios comuns

Carregamento/sucesso/falha explícitos; offline nunca indica banco saudável sem resposta atual. Rótulos acessíveis, erros associados, foco visível e devolvido após diálogos, teclado, contraste e redução de movimento. Referência WCAG 2.2 AA. Fluxos de negócio futuros precisam de aprovação visual antes de implementar. Referências reais ficam em ../telas/; não criar aprovação fictícia.

## Contrato implementado do frontend

Título/nome vêm da configuração pública gerada. BackendStatus faz GET fresco com credentials include e cache no-store; estados carregando/OK/503/falha/offline/não verificado, cancelamento/timeout e descarte de respostas antigas. Eventos offline limpam o OK anterior; online consulta novamente. Formulário apenas confirma, não transmite dados; celular brasileiro com DDD e 11 dígitos. Inputs Vue mantêm o valor formatado da máscara. Autocomplete local: Blumenau, Florianópolis, Balneário Camboriú, Curitiba, São Paulo e Rio de Janeiro. Calendar usa openIn=sheet em todas as larguras; Smart Select usa popup. Hello mantém seu estado ao visitar as páginas auxiliares. APIs Core/máscaras/validadores são destruídos ao remover a página. Movimento reduzido desativa animação da navegação.

Instalação/offline/atualização e Web Push usam o mesmo build/worker; notification interna Framework7 não comprova entrega push.

Os nomes exibidos cover-v/dive/fade/parallax correspondem aos identificadores nativos f7-cover-v/f7-dive/f7-fade/f7-parallax nas opções do roteador, preservando avanço e retorno oficiais.


Hello e destino de transição compartilham app-content/app-heading e tokens de 02-design-system.md. Ações usam botões HTML pela prop type do Framework7; retorno mantém link back. Status tem preloader, aria-busy e resultado anunciado; validação associa erros aos campos e rótulos nativos aos inputs. FAB permanece Speed Dial oficial com suporte de teclado e estado acessível. Conferência visual dos ajustes e foco no ambiente do responsável pendente de aceite.


Atualização exige confirmação explícita. Campos da Hello (cidade/data/e-mail/celular/checkbox/linguagem/contador) podem ser preservados temporariamente por aba durante a recarga; não há envio nem persistência de registros. Data é serializada/restaurada e a máscara sincronizada. Aba alterada não é recarregada por outra aba; storage indisponível bloqueia atualização com alterações. No iPhone, orientar Compartilhar → Adicionar à Tela de Início quando não houver prompt.

## Push na Hello

PushSettings.vue compõe controles oficiais sem página separada: autenticação, suporte/HTTPS/instalação iOS, ambiente desabilitado, permissão negada, preferência global, adesão/cancelamento do dispositivo, lista própria/revogação e estado dos envios. Sem prompt ao abrir; permissão somente por Ativar neste dispositivo. Sem suporte ou no Vite dev, orientar uso do build. Não transferir inscrição de outra conta; cancelar vínculo local explicitamente antes de cadastrar novamente.

Acesso local opcional usa código CLI de uso único/10 minutos, campo password e botão Entrar para testar. Produção não oferece esse acesso nem envio de teste. Sair revoga o dispositivo vinculado à sessão, preservando os outros. Código pendente ou operação push em andamento bloqueiam atualização da aba; código nunca entra no rascunho/sessionStorage. Enfileirada e aceita pelo provedor são estados distintos de recebida/lida. Clique foca aba no destino ou abre outra, sem navegar uma aba com formulário alterado.



Últimos envios push: até quatro registros mais recentes, em pilha com chips Framework7 sem ação de clique. Enfileirada azul, aceita verde, falhou vermelho, cancelada cinza; texto do status e detalhes HTTP/falha preservados, sem depender só da cor. Ao atualizar a lista ou enfileirar novo teste, registros mais antigos saem da exibição, sem apagar histórico do banco.


Dispositivos cadastrados: seção explicativa com um card Framework7 por inscrição. Este dispositivo/identificação e nome legível ficam acima do botão Remover dispositivo, em largura total. A remoção exige confirmação explicando que novos envios serão impedidos. O botão superior de desativação só aparece para uma inscrição local sem vínculo com a conta; não duplicar a ação do card atual.
