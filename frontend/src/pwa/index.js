import { reactive } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import { createPwaManager } from './manager.js';
export const pwaState = reactive({});
export const pwa = createPwaManager({ window, navigator, production: import.meta.env.PROD, secure: window.isSecureContext, register: registerSW, state: pwaState });
export const buildId = __APP_BUILD__;
