<template><span ref="host" class="lucide-host" aria-hidden="true"></span></template>
<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { createElement } from 'lucide';
const props = defineProps({ icon: { type: Array, required: true } });
const host = ref(null);
const render = () => host.value?.replaceChildren(createElement(props.icon, { width: 24, height: 24, 'aria-hidden': 'true' }));
onMounted(render);
watch(() => props.icon, render);
onBeforeUnmount(() => host.value?.replaceChildren());
</script>
