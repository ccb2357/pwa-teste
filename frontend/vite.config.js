import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { publicApp, buildIdentity } from './scripts/build-config.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const configPath = path.join(root, '.foundation.public.json');
if (!fs.existsSync(configPath)) throw new Error('Execute o bootstrap do projeto antes de usar Vite. Configuração pública ausente.');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = publicApp(config);
const appEntry = fileURLToPath(new URL('index.html', import.meta.url));
const buildId = buildIdentity(root, app);
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const backendProxy = () => ({ target: config.vite.proxyTarget, changeOrigin: true, headers: { Host: config.vite.proxyHost } });
export default defineConfig({
  root,
  plugins: [vue(), VitePWA({
    strategies: 'injectManifest', srcDir: 'src', filename: 'sw.js',
    includeManifestIcons: false, registerType: 'prompt', injectRegister: false, scope: '/', base: '/',
    devOptions: { enabled: false },
    manifest: { id: '/', name: app.name, short_name: app.shortName, description: app.description, lang: app.locale, start_url: '/', scope: '/', display: 'standalone', theme_color: app.themeColor, background_color: app.backgroundColor, icons: [192, 512].map(size => ({ src: `/icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })) },
    injectManifest: { globPatterns: ['index.html', 'offline.html', 'assets/*.{js,css,woff2,woff,ttf}', 'fonts/*.woff2', 'icons/*.png'], globIgnores: ['**/.*'], maximumFileSizeToCacheInBytes: 2 * 1024 * 1024 },
  }), {
    name: 'foundation-public-html',
    transformIndexHtml: html => html.replace('<title>PWA Framework</title>', `<title>${escapeHtml(app.name)}</title>`)
      .replace('lang="pt-BR"', `lang="${escapeHtml(app.locale)}"`)
      .replace('content="#007aff"', `content="${escapeHtml(app.themeColor)}"`)
      .replace('</head>', `<meta name="app-build" content="${buildId}"><link rel="apple-touch-icon" href="/icons/icon-180.png"></head>`),
  }],
  define: { __FOUNDATION_APP__: JSON.stringify(app), __APP_BUILD__: JSON.stringify(buildId) },
  server: {
    host: true, port: 5173, strictPort: true,
    watch: { usePolling: true, interval: 300 },
    proxy: { '/api': backendProxy(), '/sanctum': backendProxy(), '/up': backendProxy() },
  },
  preview: { host: true, port: 4173, strictPort: true, proxy: { '/api': backendProxy(), '/sanctum': backendProxy(), '/up': backendProxy(), '/status': backendProxy() } },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true, rolldownOptions: { input: appEntry } },
});
