import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Load env vars onto process.env so the Hono dev server can access them
  // This ensures JWT_SECRET, GEMINI_API_KEY etc. are available in backend code
  if (typeof process !== 'undefined') {
    Object.entries(env).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  }
  
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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
