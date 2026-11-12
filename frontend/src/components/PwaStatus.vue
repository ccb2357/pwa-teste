<template>
  <f7-block strong inset :aria-busy="state.busy">
    <h2 class="status-heading">PWA</h2>
    <div role="status" aria-live="polite">
      <p>{{ state.online ? 'Conexão disponível.' : 'Você está offline. Os dados do servidor não foram verificados.' }}</p>
      <p v-if="state.mode === 'dev'">Modo de desenvolvimento: instalação, cache e atualização devem ser testados no build.</p>
      <template v-else>
        <p v-if="state.mode === 'ready'">{{ state.offlineReady ? 'Aplicativo preparado para uso offline.' : 'O navegador está preparando ou conferindo o cache offline.' }}</p>
        <p v-if="state.installed">Aplicativo instalado neste navegador.</p>
        <p v-else-if="!state.installReady">Para instalar, use o menu do navegador. No iPhone: Compartilhar → Adicionar à Tela de Início.</p>
        <p v-if="state.needRefresh">Nova versão disponível. Você escolhe quando atualizar.</p>
      </template>
      <p v-if="state.message">{{ state.message }}</p>
    </div>
    <div class="app-actions">
      <f7-button v-if="state.installReady && !state.installed" type="button" fill preloader :loading="state.busy" :disabled="state.busy" :aria-disabled="state.busy" :tabindex="state.busy ? -1 : 0" @click="pwa.install">Instalar aplicativo</f7-button>
      <f7-button v-if="state.needRefresh" type="button" fill preloader :loading="state.busy" :disabled="state.busy" :aria-disabled="state.busy" :tabindex="state.busy ? -1 : 0" @click="update">Atualizar aplicativo</f7-button>
      <f7-button v-if="state.mode === 'ready'" type="button" outline @click="pwa.checkUpdate">Verificar atualização</f7-button>
    </div>
    <p class="app-note">Versão {{ buildId }}. Offline não confirma banco, login ou envio de dados.</p>
  </f7-block>
</template>
<script setup>
import { f7 } from 'framework7-vue';
import { pwa, pwaState as state, buildId } from '../pwa/index.js';
function update() { f7.dialog.confirm('Atualizar agora? Campos de demonstração preenchidos serão preservados nesta aba.', 'Atualizar aplicativo', () => pwa.applyUpdate()); }
</script>
