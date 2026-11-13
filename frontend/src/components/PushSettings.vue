<template>
  <f7-block strong inset :aria-busy="busy">
    <div class="status-heading"><h2>Push Notifications</h2><f7-button type="button" small outline :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="load">Atualizar estado</f7-button></div>
    <div role="status" aria-live="polite"><p>{{ message }}</p><p v-if="user">Conta: {{ user.name }}</p></div>
    <template v-if="testLogin && !user">
      <f7-list strong inset><f7-list-input input-id="push-test-code" type="password" v-model:value="code" autocomplete="off"><template #label><label for="push-test-code">Código de acesso de teste local</label></template></f7-list-input></f7-list>
      <f7-button type="button" outline :disabled="busy || !code" :aria-disabled="busy || !code" :tabindex="busy || !code ? -1 : 0" @click="login">Entrar para testar</f7-button>
    </template>
    <template v-if="user">
      <label class="app-choice"><f7-checkbox :checked="preference" :disabled="busy" @change="setPreference($event.target.checked)" />Permitir notificações para minha conta</label>
      <p v-if="!enabled" class="app-note">Push está desabilitado neste ambiente. Você ainda pode revogar dispositivos.</p>
      <p v-if="supportMessage" class="app-note">{{ supportMessage }}</p>
      <p v-if="conflict" class="app-note">A inscrição local não corresponde à conta ou à chave atual. Desative este dispositivo antes de reativar.</p>
      <div class="app-actions">
        <f7-button v-if="enabled && supported && !current && !conflict" type="button" fill :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="activate">Ativar neste dispositivo</f7-button>
        <f7-button v-if="current || conflict" type="button" outline :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="cancelCurrent">Desativar neste dispositivo</f7-button>
        <f7-button v-if="current && enabled && preference && testLogin" type="button" outline :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="sendTest">Enviar teste para este dispositivo</f7-button>
        <f7-button v-if="testLogin" type="button" outline :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="logout">Sair do teste</f7-button>
      </div>
      <f7-list strong inset v-if="devices.length"><f7-list-item v-for="device in devices" :key="device.id" :title="device.label" :after="device.id === current?.id ? 'Este dispositivo' : 'Outro dispositivo'"><template #after><f7-button type="button" small outline :disabled="busy" :aria-disabled="busy" :tabindex="busy ? -1 : 0" @click="revoke(device)">Revogar</f7-button></template></f7-list-item></f7-list>
      <p class="app-note" v-if="deliveries.length">Últimos envios: {{ deliveries.map(item => deliveryLabel(item)).join(' · ') }}. Aceite do provedor não confirma exibição ou leitura.</p>
    </template>
  </f7-block>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { pushApi, applicationKey, activeRegistration, subscriptionFingerprint, sameApplicationKey } from '../services/push.js';
const busy = ref(false), user = ref(null), enabled = ref(false), preference = ref(false), devices = ref([]), current = ref(null), conflict = ref(false), deliveries = ref([]), code = ref(''), testLogin = ref(false), message = ref('Verificando push…');
defineExpose({ hasPending: computed(() => busy.value || Boolean(code.value)) });
let publicKey = '', permissionState, disposed = false;
const permission = ref(window.Notification?.permission || 'default');
const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const supported = window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !(ios && !standalone) && import.meta.env.PROD;
const supportMessage = computed(() => !import.meta.env.PROD ? 'Use a PWA pelo build para ativar push.' : !window.isSecureContext ? 'Push exige HTTPS ou localhost.' : ios && !standalone ? 'No iPhone/iPad, instale e abra pela Tela de Início.' : !supported ? 'Este navegador não oferece os recursos necessários.' : permission.value === 'denied' ? 'Permissão bloqueada. Altere-a nas configurações do navegador.' : '');
const statusLabel = value => ({ queued: 'Enfileirada', accepted: 'Aceita pelo provedor', failed: 'Falhou', cancelled: 'Cancelada' })[value] || 'Pendente';
const deliveryLabel = item => [statusLabel(item.status), item.provider_status ? `HTTP ${item.provider_status}` : '', ({ 'provider-auth': 'confira VAPID', 'provider-temporary': 'aguardando retentativa', 'configuration-or-endpoint': 'confira configuração e provedor', 'retries-exhausted': 'tentativas esgotadas', 'subscription-expired': 'inscrição expirada' })[item.result] || ''].filter(Boolean).join(' · ');
function failure(error) { message.value = ({ 401: 'Autenticação necessária. Entre novamente.', 419: 'Sessão expirada. Atualize a página e entre novamente.', 409: 'Inscrição vinculada a outra conta ou chave. Revogue o vínculo local antes de tentar.', 422: 'Dados da inscrição inválidos.', 429: 'Aguarde antes de repetir.', 503: 'Push está desabilitado ou indisponível.' })[error.status] || error.message || 'Não foi possível concluir.'; }
async function refresh() {
  current.value = null; conflict.value = false; permission.value = window.Notification?.permission || 'default';
  try {
    const config = await pushApi('config'); enabled.value = config.enabled; publicKey = config.public_key; user.value = config.user; testLogin.value = config.test_auth;
    const [list, pref, recent] = await Promise.all([pushApi('subscriptions'), pushApi('preferences'), pushApi('deliveries')]); devices.value = list.devices; preference.value = pref.enabled; deliveries.value = recent.deliveries;
    if (supported) { const registration = await activeRegistration(); const sub = await registration.pushManager.getSubscription(); if (sub) { const fingerprint = await subscriptionFingerprint(sub); current.value = devices.value.find(device => device.fingerprint === fingerprint) || null; conflict.value = !current.value || (enabled.value && !sameApplicationKey(sub, publicKey)); } }
    message.value = current.value ? 'Dispositivo inscrito. Envio depende da preferência da conta e do ambiente.' : 'Este dispositivo não está inscrito para esta conta.';
  } catch (error) {
    if (error.status === 401) { user.value = null; devices.value = []; deliveries.value = []; try { const state = await pushApi('test-session'); testLogin.value = state.test_auth; } catch { testLogin.value = false; } }
    failure(error);
  }
}
async function run(action) { if (busy.value) return; busy.value = true; try { await action(); } catch (error) { failure(error); } finally { busy.value = false; } }
const load = () => run(refresh);
const login = () => run(async () => { await pushApi('test-session', { method: 'POST', json: { code: code.value } }); code.value = ''; await refresh(); });
const setPreference = value => run(async () => { await pushApi('preferences', { method: 'PUT', json: { enabled: value } }); await refresh(); });
const activate = () => run(async () => {
  if (!supported || !enabled.value) return;
  if (!navigator.onLine) { message.value = 'Conecte-se antes de ativar push.'; return; }
  if (Notification.permission === 'denied') { message.value = 'Permissão bloqueada nas configurações do navegador.'; return; }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') { message.value = 'Permissão não concedida. Nenhuma inscrição foi criada.'; return; }
  const registration = await activeRegistration(); let sub = await registration.pushManager.getSubscription();
  if (sub && !sameApplicationKey(sub, publicKey)) throw new Error('Chave do ambiente mudou. Desative este dispositivo antes de reativar.');
  sub ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) });
  await pushApi('subscriptions', { method: 'POST', json: { ...sub.toJSON(), label: ios ? 'iPhone/iPad' : 'Navegador', contentEncoding: 'aes128gcm' } });
  await pushApi('preferences', { method: 'PUT', json: { enabled: true } }); await refresh();
});
async function removeLocal() { if (current.value) await pushApi('subscriptions/' + current.value.id, { method: 'DELETE' }); if ('serviceWorker' in navigator) { const registration = await navigator.serviceWorker.getRegistration('/'); const sub = await registration?.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } }
const cancelCurrent = () => run(async () => { await removeLocal(); await refresh(); });
const logout = () => run(async () => { await removeLocal(); await pushApi('test-logout', { method: 'POST', json: { subscription_id: current.value?.id } }); await refresh(); });
function revoke(device) { f7.dialog.confirm('Revogar este dispositivo?', 'Push', () => run(async () => { if (device.id === current.value?.id) await removeLocal(); else await pushApi('subscriptions/' + device.id, { method: 'DELETE' }); await refresh(); })); }
const sendTest = () => run(async () => { if (!current.value) return; const result = await pushApi('test', { method: 'POST', json: { subscription_id: current.value.id } }); message.value = `${result.queued} teste(s) enfileirado(s). Aguarde o processamento.`; });
const visible = () => { if (document.visibilityState === 'visible') load(); };
const changed = event => { if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') load(); };
onMounted(async () => { load(); document.addEventListener('visibilitychange', visible); window.addEventListener('online', load); navigator.serviceWorker?.addEventListener('message', changed); navigator.serviceWorker?.addEventListener('controllerchange', load); try { permissionState = await navigator.permissions.query({ name: 'notifications' }); if (!disposed) permissionState.addEventListener('change', load); } catch {} });
onBeforeUnmount(() => { disposed = true; document.removeEventListener('visibilitychange', visible); window.removeEventListener('online', load); navigator.serviceWorker?.removeEventListener('message', changed); navigator.serviceWorker?.removeEventListener('controllerchange', load); permissionState?.removeEventListener('change', load); });
</script>
