import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const root = fileURLToPath(new URL('.', import.meta.url));
const configPath = path.join(root, '.foundation.public.json');
if (!fs.existsSync(configPath)) throw new Error('Execute o bootstrap do projeto antes de usar Vite. Configuração pública ausente.');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
// Explicit public list: private configuration never enters the browser bundle.
const app = Object.fromEntries(['name', 'slug', 'locale', 'displayTimezone', 'appUrl', 'apiBase', 'themeColor'].map(key => [key, config.app[key]]));
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const backendProxy = () => ({ target: config.vite.proxyTarget, changeOrigin: true, headers: { Host: config.vite.proxyHost } });
export default defineConfig({
  root,
  plugins: [vue(), {
    name: 'foundation-public-html',
    transformIndexHtml: html => html.replace('<title>PWA Framework</title>', `<title>${escapeHtml(app.name)}</title>`)
      .replace('lang="pt-BR"', `lang="${escapeHtml(app.locale)}"`)
      .replace('content="#007aff"', `content="${escapeHtml(app.themeColor)}"`),
  }],
  define: { __FOUNDATION_APP__: JSON.stringify(app) },
  server: {
    host: true, port: 5173, strictPort: true,
    watch: { usePolling: true, interval: 300 },
    proxy: { '/api': backendProxy(), '/sanctum': backendProxy(), '/up': backendProxy() },
  },
  preview: { host: true, port: 4173, strictPort: true },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
});
