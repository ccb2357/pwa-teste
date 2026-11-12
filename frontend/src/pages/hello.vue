<template>
  <f7-page name="hello" ref="page" @page:init="setup" @page:beforeremove="dispose">
    <f7-navbar :title="appConfig.name" />
    <div class="demo-content">
      <f7-block>
        <h1 class="page-heading">Hello</h1>
        <p>Bem-vindo à {{ appConfig.name }}. Experimente os componentes oficiais e confira a integração com o backend.</p>
        <p class="demo-note">As demonstrações usam dados locais e não gravam registros.</p>
      </f7-block>

      <f7-block-title>Integração real</f7-block-title>
      <BackendStatus />

      <f7-block-title>Grid responsivo</f7-block-title>
      <f7-block>
        <div class="grid grid-cols-1 medium-grid-cols-2 grid-gap" data-testid="responsive-grid">
          <div class="demo-grid-cell">Coluna 1</div>
          <div class="demo-grid-cell">Coluna 2</div>
        </div>
        <p class="demo-note">Uma coluna no celular; duas a partir de 768 px.</p>
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
        <f7-list-input input-id="demo-city" label="Cidade" type="text" placeholder="Digite uma cidade" autocomplete="off" v-model:value="city" />
      </f7-list>
      <f7-block class="demo-note">Selecionada: <span data-testid="selected-city">{{ city || 'Nenhuma' }}</span></f7-block>

      <f7-block-title>Buttons e Dialog</f7-block-title>
      <f7-block strong inset>
        <div class="demo-actions">
          <f7-button fill @click="count++">Contar: {{ count }}</f7-button>
          <f7-button outline @click="openDialog">Abrir diálogo</f7-button>
          <f7-button disabled>Desabilitado</f7-button>
        </div>
        <p class="demo-note" aria-live="polite">{{ dialogResult }}</p>
      </f7-block>

      <f7-block-title>Calendar</f7-block-title>
      <f7-list strong inset>
        <f7-list-input input-id="demo-date" label="Data" type="datepicker" placeholder="Selecionar data" readonly v-model:value="date" :calendar-params="calendarParams" />
      </f7-list>
      <f7-block class="demo-note">O calendário abre como sheet, inclusive no desktop.</f7-block>

      <f7-block-title>Checkbox</f7-block-title>
      <f7-block strong inset>
        <label class="demo-checkbox">
          <f7-checkbox :checked="checked" @change="checked = $event.target.checked" />
          Ativar opção de demonstração
        </label>
        <p class="demo-note" aria-live="polite">{{ checked ? 'Opção ativada.' : 'Opção desativada.' }}</p>
      </f7-block>

      <f7-block-title>Formulário · JustValidate e IMask</f7-block-title>
      <form ref="form" novalidate aria-label="Formulário de demonstração">
        <f7-list strong inset>
          <f7-list-input input-id="demo-email" label="E-mail" type="email" placeholder="voce@exemplo.com" autocomplete="off" />
          <f7-list-input input-id="demo-phone" v-model:value="phoneValue" label="Celular" type="text" inputmode="tel" placeholder="(00) 00000-0000" autocomplete="off" />
        </f7-list>
        <f7-block>
          <f7-button type="submit" fill>Validar formulário</f7-button>
          <p class="demo-note">Só valida os campos e exibe uma confirmação. Nenhum dado é enviado.</p>
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
      <f7-block class="demo-note" aria-live="polite">Seleção: {{ language }}</f7-block>

      <f7-block-title>Notifications, Sheet Modal e Toast</f7-block-title>
      <f7-block strong inset>
        <div class="demo-actions">
          <f7-button outline @click="showNotification">Abrir notificação</f7-button>
          <f7-button outline @click="sheetOpened = true">Abrir sheet</f7-button>
          <f7-button outline @click="showToast">Abrir toast</f7-button>
        </div>
        <p class="demo-note">A notificação acima é interna do Framework7. Web Push será integrado em uma etapa própria.</p>
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
          <f7-button v-for="effect in transitions" :key="effect" outline @click="navigate(effect)">{{ effect }}</f7-button>
        </div>
        <p class="demo-note">Cada botão abre uma página real e permite voltar. Movimento reduzido é respeitado.</p>
      </f7-block>

      <f7-block-title>Recursos da PWA</f7-block-title>
      <f7-list strong inset>
        <f7-list-item title="Instalação" after="Etapa de PWA" />
        <f7-list-item title="Preparo offline" after="Etapa de PWA" />
        <f7-list-item title="Atualização do aplicativo" after="Etapa de PWA" />
        <f7-list-item title="Push Notifications" after="Etapa de push" />
      </f7-list>
      <f7-block class="demo-note">Esses recursos ainda não estão ativos nesta entrega.</f7-block>
    </div>

    <f7-fab slot="fixed" position="right-bottom" href="#" aria-label="Abrir ou fechar ações">
      <f7-icon f7="plus" />
      <f7-icon f7="xmark" />
      <f7-fab-buttons position="top">
        <f7-fab-button v-for="action in 3" :key="action" :label="`Ação ${action}`" fab-close @click="showFabAction(action)">{{ action }}</f7-fab-button>
      </f7-fab-buttons>
    </f7-fab>

    <f7-sheet v-model:opened="sheetOpened" :backdrop="true" :close-on-escape="true" :close-by-backdrop-click="true">
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
import { nextTick, onBeforeUnmount, ref } from 'vue';
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
const page = ref(null), form = ref(null);
const city = ref(''), date = ref([]), count = ref(0), checked = ref(false), language = ref('JavaScript'), sheetOpened = ref(false);
const phoneValue = ref('');
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
function showFabAction(action) { track(f7.toast.create({ text: `Ação ${action} selecionada.`, closeTimeout: 2500 })).open(); }
function navigate(effect) { f7.views.main.router.navigate(`/transition/${effect}/`, { transition: `f7-${effect}`, animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches }); }
onBeforeUnmount(dispose);
</script>
