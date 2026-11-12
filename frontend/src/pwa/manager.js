export function createPwaManager({ window: win, navigator: nav, production, secure, register, state }) {
  Object.assign(state, { mode: production ? 'starting' : 'dev', online: nav.onLine, offlineReady: false, needRefresh: false, reloadReady: false, installReady: false, installed: !!nav.standalone || win.matchMedia('(display-mode: standalone)').matches, busy: false, message: '' });
  let deferredPrompt, registration, updateWorker, timer, approvedReload = false;
  let isDirty = () => false, saveDraft = () => {};
  const online = () => { state.online = nav.onLine; if (nav.onLine) checkUpdate(); };
  const installEvent = event => { event.preventDefault(); deferredPrompt = event; state.installReady = true; };
  const installed = () => { deferredPrompt = undefined; state.installReady = false; state.installed = true; };
  const visible = () => { if (win.document.visibilityState === 'visible' && nav.onLine) checkUpdate(); };
  function needReload() {
    state.needRefresh = true; state.reloadReady = true; state.busy = false;
    if (approvedReload || !isDirty()) {
      try { if (isDirty()) saveDraft(); approvedReload = false; win.location.reload(); }
      catch { approvedReload = false; state.message = 'Não foi possível preservar os campos. Esta aba foi mantida.'; }
    }
    else state.message = 'Nova versão ativa. Seus campos continuam nesta aba; atualize quando estiver pronto.';
  }
  function start() {
    win.addEventListener('online', online); win.addEventListener('offline', online);
    if (!production) return;
    if (!secure || !('serviceWorker' in nav)) { state.mode = 'unsupported'; state.message = 'Use HTTPS ou localhost em um navegador com suporte a PWA.'; return; }
    state.mode = 'ready';
    win.addEventListener('beforeinstallprompt', installEvent); win.addEventListener('appinstalled', installed);
    win.document.addEventListener('visibilitychange', visible);
    updateWorker = register({ immediate: true, onNeedRefresh: () => { state.needRefresh = true; }, onNeedReload: needReload,
      onOfflineReady: () => { state.offlineReady = true; },
      onRegisteredSW: (_url, value) => { registration = value; if (nav.serviceWorker.controller) state.offlineReady = true; },
      onRegisterError: () => { state.mode = 'error'; state.message = 'Não foi possível preparar o modo offline. Confira a conexão e tente novamente.'; },
    });
    timer = win.setInterval(() => { if (nav.onLine) checkUpdate(); }, 60 * 60 * 1000);
  }
  async function checkUpdate() {
    if (!registration || !nav.onLine) return;
    try { await registration.update(); } catch { state.message = 'Não foi possível conferir novas versões agora.'; }
  }
  async function install() {
    if (!deferredPrompt || state.busy) return;
    const event = deferredPrompt; deferredPrompt = undefined; state.installReady = false; state.busy = true;
    try { await event.prompt(); const result = await event.userChoice; if (result.outcome === 'accepted') state.message = 'Instalação solicitada ao navegador.'; }
    catch { state.message = 'Instalação não concluída. Use o menu do navegador.'; }
    finally { state.busy = false; }
  }
  async function applyUpdate() {
    if (!state.needRefresh || state.busy) return;
    state.busy = true;
    try {
      // A denied/unavailable sessionStorage must never discard a dirty form.
      if (isDirty()) saveDraft();
      approvedReload = true;
      if (state.reloadReady) win.location.reload();
      else if (updateWorker) { await updateWorker(true); state.message = 'Atualização solicitada. Aguarde o navegador.'; }
      else throw new Error('Worker unavailable');
    } catch { approvedReload = false; state.message = 'Não foi possível preservar os campos ou atualizar. Esta aba foi mantida.'; }
    finally { state.busy = false; }
  }
  function draftGuard(dirty, save) { isDirty = dirty; saveDraft = save; return () => { isDirty = () => false; saveDraft = () => {}; }; }
  function destroy() {
    win.removeEventListener('online', online); win.removeEventListener('offline', online); win.removeEventListener('beforeinstallprompt', installEvent); win.removeEventListener('appinstalled', installed); win.document.removeEventListener('visibilitychange', visible); win.clearInterval(timer);
  }
  return { start, install, checkUpdate, applyUpdate, draftGuard, destroy };
}
