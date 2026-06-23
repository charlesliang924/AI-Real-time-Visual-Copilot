import { Hono } from 'hono';
import { query, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const statsApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

// Auth middleware
statsApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.id);
  await next();
});

// Log a usage event
statsApp.post('/', async (c) => {
  const userId = c.get('userId');
  const { event_type, metadata } = await c.req.json();
  if (!event_type) {
    return c.json({ error: 'event_type is required' }, 400);
  }
  const id = generateId();
  const now = Date.now();
  await query(c.env, 'INSERT INTO usage_stats (id, user_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)', [id, userId, event_type, metadata ? JSON.stringify(metadata) : null, now]);
  return c.json({ success: true });
});

// Get current user's stats
statsApp.get('/me', async (c) => {
  const userId = c.get('userId');
  const connections = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE user_id = ? AND event_type = 'connect'", [userId]);
  const messages = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE user_id = ? AND event_type = 'message'", [userId]);
  const skillCalls = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE user_id = ? AND event_type = 'skill_call'", [userId]);
  const lastConnection = await query(c.env, "SELECT created_at FROM usage_stats WHERE user_id = ? AND event_type = 'connect' ORDER BY created_at DESC LIMIT 1", [userId]);
  
  return c.json({
    connections: connections[0]?.count || 0,
    messages: messages[0]?.count || 0,
    skillCalls: skillCalls[0]?.count || 0,
    lastConnection: lastConnection[0]?.created_at || null,
  });
});

export default statsApp;
