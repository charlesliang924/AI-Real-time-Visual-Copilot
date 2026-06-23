import { Hono } from 'hono';
import authApp from './auth.js';
import adminApp from './admin.js';
import memoriesApp from './memories.js';
import conversationsApp from './conversations.js';
import personasApp from './personas.js';
import skillsApp from './skills.js';
import statsApp from './stats.js';
import { queryFirst, query, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const app = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string, GEMINI_API_KEY: string };
}>().basePath('/api');

// Setup auth routes
app.route('/auth', authApp);
app.route('/admin', adminApp);
app.route('/memories', memoriesApp);
app.route('/conversations', conversationsApp);
app.route('/personas', personasApp);
app.route('/skills', skillsApp);
app.route('/stats', statsApp);

// Secure API config endpoint - returns Gemini API key only to authenticated & approved users
// Key is fetched from backend-only env var (no VITE_ prefix)
app.get('/config', async (c: any) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) {
    return c.json({ error: 'Unauthorized. 需要登录。' }, 401);
  }

  // Check if user is approved
  const user: any = await queryFirst(c.env, 'SELECT is_approved FROM users WHERE id = ?', [payload.id]);
  if (!user || user.is_approved !== 1) {
    return c.json({ error: 'Your account is pending approval. 您的账号还在审核中，请联系管理员。' }, 403);
  }

  // API Key from backend-only env var (GEMINI_API_KEY, NOT VITE_GEMINI_API_KEY)
  const apiKey = c.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    return c.json({ error: 'API Key not configured on server. 请联系管理员配置 GEMINI_API_KEY。' }, 500);
  }

  // Log key access for audit
  try {
    await query(c.env, 'INSERT INTO usage_stats (id, user_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)', 
      [generateId(), payload.id, 'key_access', null, Date.now()]);
  } catch(e) {}

  return c.json({ geminiApiKey: apiKey });
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env?.DB ? 'Cloudflare' : 'Local' });
});

export default app;
