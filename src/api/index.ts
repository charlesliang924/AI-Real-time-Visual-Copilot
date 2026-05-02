import { Hono } from 'hono';
import authApp from './auth.js';

const app = new Hono().basePath('/api');

// Setup auth routes
app.route('/auth', authApp);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env?.DB ? 'Cloudflare' : 'Local' });
});

export default app;
