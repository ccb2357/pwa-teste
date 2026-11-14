<template>
  <f7-page name="hello" ref="page" @page:init="setup" @page:beforeremove="dispose">
    <f7-navbar :title="appConfig.name" />
    <div class="app-content">
      <f7-block>
        <h1 class="app-heading">Hello</h1>
        <p>Bem-vindo à {{ appConfig.name }}. Experimente os componentes oficiais e confira a integração com o backend.</p>
        <p class="app-note">As demonstrações usam dados locais e não gravam registros.</p>
      </f7-block>

      <f7-block-title>Integração real</f7-block-title>
      <BackendStatus />

      <f7-block-title>Grid responsivo</f7-block-title>
      <f7-block>
        <div class="grid grid-cols-1 medium-grid-cols-2 grid-gap" data-testid="responsive-grid">
          <div class="app-grid-cell">Coluna 1</div>
          <div class="app-grid-cell">Coluna 2</div>
        </div>
        <p class="app-note">Uma coluna no celular; duas a partir de 768 px.</p>
      </f7-block>

      <f7-block-title>Accordion</f7-block-title>
      <f7-list strong inset>
        <f7-list-item accordion-item title="Como funciona esta fundação?">
          <f7-accordion-content>
            <f7-block>Framework7 Vue cuida dos controles e da navegação. Laravel fornece a API e consulta o MySQL.</f7-block>
          </f7-accordion-content>
        </f7-list-item>
      </f7-list>

      <f7-block-title>Autocomplete</f7-block-title>
      <f7-list strong inset>
        <f7-list-input input-id="demo-city" type="text" placeholder="Digite uma cidade" autocomplete="off" v-model:value="city"><template #label><label for="demo-city">Cidade</label></template></f7-list-input>
      </f7-list>
      <f7-block class="app-note">Selecionada: <span data-testid="selected-city">{{ city || 'Nenhuma' }}</span></f7-block>

      <f7-block-title>Buttons e Dialog</f7-block-title>
      <f7-block strong inset>
        <div class="app-actions">
          <f7-button type="button" fill @click="count++">Contar: {{ count }}</f7-button>
          <f7-button type="button" outline @click="openDialog">Abrir diálogo</f7-button>
          <f7-button type="button" disabled aria-disabled="true" tabindex="-1">Desabilitado</f7-button>
        </div>
        <p class="app-note" aria-live="polite">{{ dialogResult }}</p>
      </f7-block>

      <f7-block-title>Calendar</f7-block-title>
      <f7-list strong inset>
        <f7-list-input input-id="demo-date" type="datepicker" placeholder="Selecionar data" readonly v-model:value="date" :calendar-params="calendarParams"><template #label><label for="demo-date">Data</label></template></f7-list-input>
      </f7-list>
      <f7-block class="app-note">O calendário abre como sheet, inclusive no desktop.</f7-block>

      <f7-block-title>Checkbox</f7-block-title>
      <f7-block strong inset>
        <label class="app-choice">
          <f7-checkbox :checked="checked" @change="checked = $event.target.checked" />
          Ativar opção de demonstração
        </label>
        <p class="app-note" aria-live="polite">{{ checked ? 'Opção ativada.' : 'Opção desativada.' }}</p>
      </f7-block>

      <f7-block-title>Formulário · JustValidate e IMask</f7-block-title>
      <form ref="form" novalidate aria-label="Formulário de demonstração">
        <f7-list strong inset>
          <f7-list-input input-id="demo-email" v-model:value="emailValue" required type="email" placeholder="voce@exemplo.com" autocomplete="off"><template #label><label for="demo-email">E-mail</label></template></f7-list-input>
          <f7-list-input input-id="demo-phone" required v-model:value="phoneValue" type="text" inputmode="tel" placeholder="(00) 00000-0000" autocomplete="off"><template #label><label for="demo-phone">Celular</label></template></f7-list-input>
        </f7-list>
        <f7-block>
          <f7-button type="submit" fill>Validar formulário</f7-button>
          <p class="app-note">Só valida os campos e exibe uma confirmação. Nenhum dado é enviado.</p>
        </f7-block>
      </form>

      <f7-block-title>Smart Select</f7-block-title>
      <f7-list strong inset>
        <f7-list-item title="Linguagem" smart-select :smart-select-params="smartSelectParams">
          <select name="language" v-model="language" aria-label="Linguagem">
            <option value="JavaScript">JavaScript</option>
            <option value="PHP">PHP</option>
            <option value="SQL">SQL</option>
          </select>
        </f7-list-item>
      </f7-list>
      <f7-block class="app-note" aria-live="polite">Seleção: {{ language }}</f7-block>

      <f7-block-title>Notifications, Sheet Modal e Toast</f7-block-title>
      <f7-block strong inset>
        <div class="app-actions">
          <f7-button type="button" outline @click="showNotification">Abrir notificação</f7-button>
          <f7-button type="button" outline @click="sheetOpened = true">Abrir sheet</f7-button>
          <f7-button type="button" outline @click="showToast">Abrir toast</f7-button>
        </div>
        <p class="app-note">A notificação acima é interna do Framework7. Web Push é configurado na seção Push Notifications.</p>
      </f7-block>

      <f7-block-title>Ícones Lucide</f7-block-title>
      <f7-block strong inset>
        <div class="icon-grid" data-testid="lucide-grid">
          <div class="icon-example" v-for="item in icons" :key="item.name">
            <LucideIcon :icon="item.icon" /><span>{{ item.name }}</span>
          </div>
        </div>
      </f7-block>

      <f7-block-title>Page transitions</f7-block-title>
      <f7-block strong inset>
        <div class="grid grid-cols-2 medium-grid-cols-4 grid-gap">
          <f7-button type="button" v-for="effect in transitions" :key="effect" outline @click="navigate(effect)">{{ effect }}</f7-button>
        </div>
        <p class="app-note">Cada botão abre uma página real e permite voltar. Movimento reduzido é respeitado.</p>
      </f7-block>

      <f7-block-title>Recursos da PWA</f7-block-title>
      <PwaStatus />
      <PushSettings ref="pushSettings" />
    </div>

    <template #fixed>
      <f7-fab position="right-bottom" @fab:open="fabOpened = true" @fab:close="onFabClose" @keydown.esc.prevent.stop="closeFab">
        <template #root>
          <a href="#" role="button" aria-label="Ações de demonstração" aria-controls="hello-fab-actions" :aria-expanded="fabOpened" @keydown.space.prevent="$event.currentTarget.click()">
            <f7-icon f7="plus" aria-hidden="true" />
            <f7-icon f7="xmark" aria-hidden="true" />
          </a>
          <f7-fab-buttons id="hello-fab-actions" position="top" :inert="fabOpened ? null : ''" :aria-hidden="!fabOpened">
            <f7-fab-button v-for="action in 3" :key="action" href="#" role="button" :tabindex="fabOpened ? 0 : -1" :label="`Ação ${action}`" fab-close @keydown.space.prevent="$event.currentTarget.click()" @click="showFabAction(action)">{{ action }}</f7-fab-button>
          </f7-fab-buttons>
        </template>
      </f7-fab>
    </template>

    <f7-sheet role="dialog" aria-label="Sheet de demonstração" v-model:opened="sheetOpened" :backdrop="true" :close-on-escape="true" :close-by-backdrop-click="true">
      <f7-toolbar>
        <div class="left"></div>
        <div class="right"><f7-link sheet-close>Fechar</f7-link></div>
      </f7-toolbar>
      <f7-page-content>
        <f7-block-title>Sheet Modal</f7-block-title>
        <f7-block>Este é o sheet oficial do Framework7 Vue, separado do calendário.</f7-block>
      </f7-page-content>
    </f7-sheet>
  </f7-page>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { f7 } from 'framework7-vue';
import {
  Home, User, Bell, Calendar, Check, X, Search, Settings, Heart, Star,
  Mail, Phone, Globe, Wifi, Shield, Download, Upload, Folder, Clock, ArrowRight,
} from 'lucide';
import { appConfig } from '../config.js';
import { transitions } from '../transitions.js';
import { initDemoForm } from '../forms/demo.js';
import BackendStatus from '../components/BackendStatus.vue';
import LucideIcon from '../components/LucideIcon.vue';
import PwaStatus from '../components/PwaStatus.vue';
import PushSettings from '../components/PushSettings.vue';
import { pwa } from '../pwa/index.js';
import { cleanDraft, draftStorage } from '../pwa/draft.js';
const page = ref(null), form = ref(null), pushSettings = ref(null);
let session;
try { session = window.sessionStorage; } catch { session = { getItem() { return null; }, setItem() { throw new Error('Session unavailable'); } }; }
const drafts = draftStorage(session, appConfig.slug);
const restored = drafts.restore();
const city = ref(restored.city), date = ref(restored.date.map(value => new Date(value))), count = ref(restored.count), checked = ref(restored.checked), language = ref(restored.language), sheetOpened = ref(false);
const phoneValue = ref(restored.phone), emailValue = ref(restored.email);
const snapshot = () => ({ city: city.value, date: date.value.map(value => new Date(value).toISOString()), email: emailValue.value, phone: phoneValue.value, checked: checked.value, language: language.value, count: count.value });
const dirty = computed(() => JSON.stringify(snapshot()) !== JSON.stringify(cleanDraft(null)));
const releaseDraftGuard = pwa.draftGuard(() => dirty.value || pushSettings.value?.hasPending, () => {
  if (pushSettings.value?.hasPending) throw new Error('Conclua a operação push ou limpe o código de acesso antes de atualizar.');
  drafts.save(snapshot());
});
const fabOpened = ref(false);
const dialogResult = ref('Experimente confirmar ou cancelar o diálogo.');
const cities = ['Blumenau', 'Florianópolis', 'Balneário Camboriú', 'Curitiba', 'São Paulo', 'Rio de Janeiro'];
const icons = Object.entries({ Home, User, Bell, Calendar, Check, X, Search, Settings, Heart, Star, Mail, Phone, Globe, Wifi, Shield, Download, Upload, Folder, Clock, ArrowRight }).map(([name, icon]) => ({ name, icon }));
const calendarParams = {
  openIn: 'sheet', closeOnSelect: true, dateFormat: 'dd/mm/yyyy',
  toolbarCloseText: 'Fechar', header: true,
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
};
const smartSelectParams = { openIn: 'popup', closeOnSelect: true, pageTitle: 'Linguagem', popupCloseLinkText: 'Fechar' };
let autocomplete, destroyForm, initialized = false;
const overlays = new Set();
function track(instance) { if (instance) overlays.add(instance); return instance; }
async function setup() {
  await nextTick();
  if (initialized || !page.value?.$el || !form.value) return;
  initialized = true;
  autocomplete = f7.autocomplete.create({
    inputEl: page.value.$el.querySelector('#demo-city'), openIn: 'dropdown',
    source(query, render) { render(cities.filter(item => item.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))); },
    on: { change(values) { city.value = values[0] || ''; } },
  });
  destroyForm = initDemoForm(form.value, () => track(f7.dialog.alert('Campos válidos. Nenhum dado foi salvo ou enviado.', 'Formulário validado')), value => { phoneValue.value = value; });
}
function dispose() {
  autocomplete?.destroy(); autocomplete = undefined;
  destroyForm?.(); destroyForm = undefined;
  for (const overlay of overlays) { overlay.close?.(false); overlay.destroy?.(); }
  overlays.clear(); initialized = false;
}
function openDialog() {
  track(f7.dialog.confirm('Confirmar esta ação de demonstração?', 'Dialog',
    () => { dialogResult.value = 'Você confirmou a ação.'; },
    () => { dialogResult.value = 'Você cancelou a ação.'; }));
}
function showNotification() { track(f7.notification.create({ title: appConfig.name, titleRightText: 'Agora', text: 'Notificação interna do Framework7.', closeButton: true, closeTimeout: 5000 })).open(); }
function showToast() { track(f7.toast.create({ text: 'Toast oficial do Framework7.', closeTimeout: 2500, closeButton: true, closeButtonText: 'Fechar' })).open(); }
function closeFab(event) { f7.fab.close(event.currentTarget); }
function onFabClose(event) {
  fabOpened.value = false;
  if (event.currentTarget.contains(document.activeElement)) event.currentTarget.querySelector(':scope > a')?.focus();
}
function showFabAction(action) { track(f7.toast.create({ text: `Ação ${action} selecionada.`, closeTimeout: 2500 })).open(); }
function navigate(effect) { f7.views.main.router.navigate(`/transition/${effect}/`, { transition: `f7-${effect}`, animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches }); }
onBeforeUnmount(() => { dispose(); releaseDraftGuard(); });
</script>
