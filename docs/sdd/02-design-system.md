# Design system

Adotar inicialmente aparência padrão do Framework7, sem identidade visual definitiva inventada. Todo componente e tela devem consumir os mesmos tokens e padrões. Mudanças globais exigem aprovação explícita; aprovação de uma tela não muda o sistema global.

Implementação: frontend/src/css/tokens.css centraliza valores; mapear variáveis Framework7 e tema Tailwind. frontend/src/css/tailwind.css importa tema/utilitários sem Preflight, prefixo tw, sem important global. Conferir camadas e cascata, classes completas detectáveis pelo build e @theme inline quando referenciar variáveis. Tailwind compõe layouts; controles são Framework7 Vue.

Nunito variável local em frontend/public/fonts/nunito.woff2; @font-face e token global com fallback system-ui, sans-serif. O arquivo binário deverá acompanhar a implementação. Ícones Framework7 Icons 5.0.5 e pacote lucide; seção demonstrativa usa aproximadamente 20 Lucide. Não trocar pelo pacote lucide-vue sem aprovação.

Tokens cobrem cores semânticas, tipografia, espaçamentos, dimensões, bordas, raios, sombras e estados. Valores concretos devem ser obtidos dos padrões nativos da versão fixada, sem paleta paralela. Cores do manifest são metadados da PWA; não geram tokens arbitrários.

Botões, inputs, listas, cards, seletores, diálogos, formulários e feedback seguem componentes oficiais. Documentar estados normal, foco, desabilitado, carregamento, erro e sucesso, conforme uso. IMask/JustValidate complementam controles nativos. Componentes de composição reutilizável só são criados em frontend/src/components/ quando houver uso real; não criar wrappers obrigatórios.

Demonstrações exigidas e aceites: [01-telas.md](01-telas.md). Referências visuais reais ficam em ../telas/, versionadas por tela. Comparações visuais usam aprovação real, fontes carregadas e animações estabilizadas; não atualizar snapshots para esconder regressões.
