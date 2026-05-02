import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      devServer({
        entry: 'src/api/index.ts',
        exclude: [
          /^\/@.+$/,
          /.*\.(ts|tsx|vue)($|\?)/,
          /.*\.(s?css|less)($|\?)/,
          /^\/favicon\.ico$/,
          /.*\.(svg|png)($|\?)/,
          /^\/(src|node_modules)\/.*/,
        ],
        injectClientScript: false // Important for React apps
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
