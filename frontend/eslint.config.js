import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
export default [
  { ignores: ['node_modules/**', 'dist/**', '.dist-build/**', 'test-results/**', 'playwright-report/**', 'tests/e2e/*-snapshots/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  { languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { __FOUNDATION_APP__: 'readonly', __APP_BUILD__: 'readonly' } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }], semi: ['error', 'always'], quotes: ['error', 'single', { avoidEscape: true }] } },
  { files: ['src/**/*.{js,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } } },
  { files: ['*.js', 'scripts/**/*.mjs', 'tests/**/*.{js,mjs}'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['src/pages/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
];
