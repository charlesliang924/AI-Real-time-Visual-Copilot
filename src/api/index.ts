import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import authApp from './auth.js';
import adminApp from './admin.js';
import { queryFirst } from './db.js';

const app = new Hono().basePath('/api');

// Setup auth routes
app.route('/auth', authApp);
app.route('/admin', adminApp);

app.get('/config', async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized. 需要登录。' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const encoder = new TextEncoder();
    const secret = encoder.encode(c.env?.JWT_SECRET || 'fallback_local_secret_key_123456');
    const { payload } = await jwtVerify(token, secret);
    
    // Check if user is approved
    const user: any = await queryFirst(c.env, 'SELECT is_approved FROM users WHERE id = ?', [payload.id]);
    if (!user || user.is_approved !== 1) {
      return c.json({ error: 'Your account is pending approval. 您的账号还在审核中，请联系管理员。' }, 403);
    }

    const apiKey = c.env?.VITE_GEMINI_API_KEY || c.env?.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    return c.json({ geminiApiKey: apiKey });
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env?.DB ? 'Cloudflare' : 'Local' });
});

export default app;
