import { Hono } from 'hono';
import authApp from './auth.js';

const app = new Hono().basePath('/api');

// Setup auth routes
app.route('/auth', authApp);

app.get('/config', (c: any) => {
  // @ts-ignore
  const apiKey = c.env?.VITE_GEMINI_API_KEY || c.env?.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  return c.json({ geminiApiKey: apiKey });
});

// Health check
app.get('/health', (c) => {
  // @ts-ignore
  return c.json({ status: 'ok', environment: c.env?.DB ? 'Cloudflare' : 'Local' });
});

export default app;
