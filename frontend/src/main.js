import { createApp } from 'vue';
import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, {
  f7App, f7View, f7Page, f7Navbar, f7Block, f7BlockTitle, f7BlockHeader,
  f7List, f7ListItem, f7ListInput, f7AccordionContent, f7Button, f7Checkbox,
  f7Fab, f7FabButtons, f7FabButton, f7Icon, f7Sheet, f7Toolbar, f7Link, f7PageContent,
} from 'framework7-vue';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import './css/tokens.css';
import './css/app.css';
import App from './App.vue';
Framework7.use(Framework7Vue);
const app = createApp(App);
for (const [name, component] of Object.entries({
  f7App, f7View, f7Page, f7Navbar, f7Block, f7BlockTitle, f7BlockHeader,
  f7List, f7ListItem, f7ListInput, f7AccordionContent, f7Button, f7Checkbox,
  f7Fab, f7FabButtons, f7FabButton, f7Icon, f7Sheet, f7Toolbar, f7Link, f7PageContent,
})) app.component(name, component);
app.mount('#app');
