import { defineConfig } from 'wxt';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
  }),
  manifest: {
    name: 'Donut Extension',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
  },
});
