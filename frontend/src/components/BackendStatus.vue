<template>
  <f7-block strong inset data-testid="backend-status" :aria-busy="state === 'loading'">
    <div class="status-heading">
      <h2>Laravel e MySQL</h2>
      <f7-button type="button" small outline preloader :loading="state === 'loading'" :disabled="state === 'loading'" :aria-disabled="state === 'loading'" :tabindex="state === 'loading' ? -1 : 0" @click="refresh">Atualizar status</f7-button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      <div class="status-details">
        <span>Backend: <strong class="status-value" :class="statusClass">{{ statusText }}</strong></span>
        <span>Banco: <strong class="status-value" :class="statusClass">{{ statusText }}</strong></span>
      </div>
      <p class="app-note">{{ message }}</p>
    </div>
  </f7-block>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getStatus } from '../services/api.js';
const state = ref('idle');
const message = ref('Aguardando verificação.');
let controller;
let sequence = 0;
const statusText = computed(() => ({ idle: 'Não verificado', loading: 'Verificando…', ok: 'OK', offline: 'Não verificado', unavailable: 'Indisponível', error: 'Não verificado' })[state.value]);
const statusClass = computed(() => state.value === 'ok' ? 'status-good' : ['error', 'unavailable'].includes(state.value) ? 'status-error' : '');
async function refresh() {
  if (state.value === 'loading') return;
  controller?.abort();
  const current = ++sequence;
  if (!navigator.onLine) { state.value = 'offline'; message.value = 'Sem conexão. O banco não foi verificado.'; return; }
  controller = new AbortController();
  const requestController = controller;
  state.value = 'loading'; message.value = 'Consultando o backend agora…';
  const timeout = setTimeout(() => requestController.abort(), 10000);
  try {
    await getStatus({ signal: requestController.signal });
    if (current === sequence) { state.value = 'ok'; message.value = 'Consulta real ao banco concluída. Nenhum dado de demonstração foi gravado.'; }
  } catch (error) {
    if (current === sequence) { state.value = error.status === 503 ? 'unavailable' : 'error'; message.value = error.name === 'AbortError' ? 'A consulta demorou demais. Tente novamente.' : 'Não foi possível confirmar o status. Confira o backend e tente novamente.'; }
  } finally { clearTimeout(timeout); }
}
function offline() { ++sequence; controller?.abort(); state.value = 'offline'; message.value = 'Sem conexão. O banco não foi verificado.'; }
onMounted(() => { window.addEventListener('offline', offline); window.addEventListener('online', refresh); refresh(); });
onBeforeUnmount(() => { ++sequence; controller?.abort(); window.removeEventListener('offline', offline); window.removeEventListener('online', refresh); });
</script>
