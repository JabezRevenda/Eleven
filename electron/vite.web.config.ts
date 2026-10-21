import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { rewriteDevApiProxyPath } from './src/shared/web-api-routing.ts';
import { DEFAULT_BACKEND_PORT, DEFAULT_WEB_PORT, PRODUCT_NAME } from '../config/app-config.mjs';

const root = resolve(import.meta.dirname, 'src/renderer');
const webDist = resolve(import.meta.dirname, '../frontend/dist');
const version = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
).version;
const backendPort = process.env.OMNIVOICE_PORT || String(DEFAULT_BACKEND_PORT);
// Build-time twin of the backend's OMNIVOICE_PUBLIC_API_BASE injection
// (backend/core/spa_inject.py), for hosts that serve this bundle statically and
// reach the API under a path prefix, e.g. "/api" behind a Vercel rewrite.
const webApiBase = (process.env.OMNIVOICE_WEB_API_BASE || '').trim().replace(/\/+$/, '');

function injectApiBase(html: string): string {
  const script = `window.__OMNIVOICE_API_BASE__=${JSON.stringify(webApiBase)};`;
  const digest = createHash('sha256').update(script).digest('base64');
  html = html.replace("script-src 'self'", `script-src 'self' 'sha256-${digest}'`);
  if (/^https?:\/\//.test(webApiBase)) {
    const url = new URL(webApiBase);
    const ws = url.protocol === 'https:' ? 'wss:' : 'ws:';
    html = html.replace(
      "connect-src 'self'",
      `connect-src 'self' ${url.origin} ${ws}//${url.host}`,
    );
  }
  return html.replace('<head>', `<head><script>${script}</script>`);
}

export default defineConfig({
  root,
  publicDir: resolve(import.meta.dirname, 'public'),
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'app-identity',
      transformIndexHtml(html) {
        html = html.replaceAll('__APP_PRODUCT_NAME__', PRODUCT_NAME);
        return webApiBase ? injectApiBase(html) : html;
      },
    },
    {
      name: 'renderer-boot-script',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'early-error-capture.js',
          source: readFileSync(resolve(import.meta.dirname, 'public/early-error-capture.js')),
        });
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __WEB_DEPLOYMENT__: true,
  },
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      '@shared': resolve(import.meta.dirname, 'src/shared'),
      '@vercel/oidc': resolve(root, 'src/lib/vercel-oidc-browser.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: { exclude: ['@scalar/api-reference-react'] },
  server: {
    host: 'localhost',
    // Same name the backend reads for its CORS/CSRF allow-list (core/csrf.py);
    // VOICESTUDIO_UI_PORT remains an accepted alias.
    port:
      Number(process.env.OMNIVOICE_UI_PORT || process.env.VOICESTUDIO_UI_PORT) || DEFAULT_WEB_PORT,
    strictPort: true,
    proxy: {
      '/api/ws': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
      },
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
        // Four backend router families genuinely own `/api`; every other
        // renderer request uses `/api` only as the Vite/Electron proxy prefix.
        rewrite: rewriteDevApiProxyPath,
      },
    },
  },
  build: {
    outDir: webDist,
    emptyOutDir: true,
    rollupOptions: { input: resolve(root, 'index.html') },
  },
});
