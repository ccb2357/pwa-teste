import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const visual = (name, use) => ({ name, testMatch: '**/*.visual.spec.js', use });
const contract = (name, use) => ({ name, testIgnore: '**/*.visual.spec.js', use });
export default defineConfig({
  testDir: './tests/e2e', timeout: 30000, fullyParallel: false, workers: 1, retries: 0,
  outputDir: 'test-results', reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', trace: 'off', screenshot: 'only-on-failure', video: 'off' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
  snapshotPathTemplate: path.join(root, process.env.PWA_VISUAL_CANDIDATE === '1' ? 'test-results/visual-candidates' : 'tests/e2e/visual-baselines', '{projectName}/{arg}{ext}'),
  projects: [
    contract('chromium-desktop', { browserName: 'chromium', viewport: { width: 1280, height: 900 } }),
    contract('chromium-mobile', { ...devices['Pixel 7'], browserName: 'chromium' }),
    contract('firefox-desktop', { browserName: 'firefox', viewport: { width: 1280, height: 900 } }),
    contract('webkit-desktop', { browserName: 'webkit', viewport: { width: 1280, height: 900 } }),
    visual('visual-desktop', { browserName: 'chromium', viewport: { width: 1280, height: 900 } }),
    visual('visual-mobile', { ...devices['Pixel 7'], browserName: 'chromium' }),
  ],
});
