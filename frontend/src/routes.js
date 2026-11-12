import Hello from './pages/hello.vue';
import TransitionPage from './pages/transition.vue';
import { transitions } from './transitions.js';
export default [
  { path: '/', component: Hello },
  ...transitions.map(effect => ({ path: `/transition/${effect}/`, component: TransitionPage, options: { transition: `f7-${effect}`, props: { effect } } })),
];
