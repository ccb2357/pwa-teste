# Design system

Adotar inicialmente aparência padrão do Framework7, sem identidade visual definitiva inventada. Todo componente e tela devem consumir os mesmos tokens e padrões. Mudanças globais exigem aprovação explícita; aprovação de uma tela não muda o sistema global.

Implementação: frontend/src/css/tokens.css e app.css. Grid oficial com grid-cols-1/medium-grid-cols-2/grid-gap; composições flex/CSS compartilhadas, sem outra biblioteca de estilos. Controles, cores semânticas e estados vêm do Framework7. Tokens iniciais: Nunito, espaços 4/8/16/24/32px, --f7-grid-gap=16px e conteúdo máximo 960px. Não gerar identidade visual ou cores novas por página. Todo CSS é importado uma vez em main.js após o bundle Framework7.

Nunito variável local em frontend/public/fonts/nunito.woff2; @font-face e token global com fallback system-ui, sans-serif. Binário e licença OFL acompanham o projeto. Ícones Framework7 Icons 5.0.5 e pacote lucide; seção demonstrativa usa aproximadamente 20 Lucide. Não trocar pelo pacote lucide-vue sem aprovação.

Tokens cobrem cores semânticas, tipografia, espaçamentos, dimensões, bordas, raios, sombras e estados. Valores concretos devem ser obtidos dos padrões nativos da versão fixada, sem paleta paralela. Cores do manifest são metadados da PWA; não geram tokens arbitrários.

Botões, inputs, listas, cards, seletores, diálogos, formulários e feedback seguem componentes oficiais. Documentar estados normal, foco, desabilitado, carregamento, erro e sucesso, conforme uso. IMask/JustValidate complementam controles nativos. Componentes de composição reutilizável só são criados em frontend/src/components/ quando houver uso real; não criar wrappers obrigatórios.

Demonstrações exigidas e aceites: [01-telas.md](01-telas.md). Referências visuais reais ficam em ../telas/, versionadas por tela. Comparações visuais usam aprovação real, fontes carregadas e animações estabilizadas; não atualizar snapshots para esconder regressões.

LucideIcon.vue adapta o createElement oficial do pacote lucide ao ciclo Vue, sem manipular nós de outros componentes. BackendStatus.vue reúne o diagnóstico reutilizável. Erros JustValidate usam variáveis de erro nativas; máscara aceita valores e sincroniza o input com v-model.
