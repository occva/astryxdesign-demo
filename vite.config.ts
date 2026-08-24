import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {readdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import type {Plugin} from 'vite';
import {menuIconChunk} from './src/menu-icon-categories';

function phosphorMenuIcons(): Plugin {
  const virtualId = 'virtual:phosphor-menu-icons';
  const resolvedId = `\0${virtualId}`;
  const require = createRequire(import.meta.url);
  const packageRoot = dirname(require.resolve('@phosphor-icons/react/package.json'));
  const names = readdirSync(`${packageRoot}/dist/csr`)
    .filter(fileName => fileName.endsWith('.d.ts'))
    .map(fileName => fileName.slice(0, -5))
    .sort((left, right) => left.localeCompare(right));

  return {
    name: 'phosphor-menu-icons',
    resolveId(id) {
      return id === virtualId ? resolvedId : undefined;
    },
    load(id) {
      if (id !== resolvedId) return undefined;
      const loaders = names.map(name =>
        `${JSON.stringify(`${name}Icon`)}: () => import(${JSON.stringify(`@phosphor-icons/react/dist/icons/${name}`)}).then(module => module.${name}Icon)`,
      );
      return `export const menuIconNames = ${JSON.stringify(names.map(name => `${name}Icon`))};\nexport const menuIconLoaders = {${loaders.join(',')}};`;
    },
  };
}

export default defineConfig({
  plugins: [phosphorMenuIcons(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const phosphorIcon = id.match(/\/node_modules\/@phosphor-icons\/react\/dist\/(?:csr|defs)\/([A-Za-z0-9]+)\.es\.js$/);
          if (phosphorIcon) return `vendor-icons-${menuIconChunk(`${phosphorIcon[1]}Icon`)}`;
          if (id.includes('/node_modules/elkjs/')) return 'vendor-layout';
          if (id.includes('/node_modules/@xyflow/')) return 'vendor-flow';
          if (id.includes('/node_modules/echarts/') || id.includes('/node_modules/zrender/')) return 'vendor-chart';
          if (id.includes('/node_modules/@tanstack/react-query/')) return 'vendor-query';
          if (id.includes('/node_modules/@cloudflare/kumo/')) return 'vendor-ui';
          if (id.includes('/node_modules/i18next/') || id.includes('/node_modules/react-i18next/')) return 'vendor-i18n';
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
