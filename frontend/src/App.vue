<template>
  <f7-app v-bind="params">
    <f7-view main url="/" :animate="!reducedMotion" />
  </f7-app>
</template>
<script setup>
import { appConfig } from './config.js';
import routes from './routes.js';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = { name: appConfig.name, id: `app.${appConfig.slug}`, theme: 'auto', routes, dialog: { buttonOk: 'OK', buttonCancel: 'Cancelar' } };
</script>
