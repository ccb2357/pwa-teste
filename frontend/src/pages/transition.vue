<template>
  <f7-page name="transition-demo">
    <f7-navbar :title="effect" back-link="Voltar" />
    <f7-block strong inset>
      <h1 class="page-heading">Transição {{ effect }}</h1>
      <p>Esta é uma página do roteador oficial Framework7 Vue.</p>
      <p>Use Voltar para conferir o retorno nativo. A página Hello mantém os campos que você preencheu.</p>
      <f7-button back outline>Voltar para Hello</f7-button>
    </f7-block>
  </f7-page>
</template>
<script setup>
defineProps({ effect: { type: String, required: true } });
</script>
