import { Hono } from 'hono';
import { query, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const conversationsApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

// Auth middleware
conversationsApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.id);
  await next();
});

// Get conversation history (paginated)
conversationsApp.get('/', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  const conversations = await query(c.env, 
    'SELECT id, role, content, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', 
    [userId, limit, offset]
  );
  const total = await query(c.env, 'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?', [userId]);
  return c.json({ conversations: conversations.reverse(), total: total[0]?.count || 0 });
});

// Add a conversation entry
conversationsApp.post('/', async (c) => {
  const userId = c.get('userId');
  const { role, content } = await c.req.json();
  if (!role || !content) {
    return c.json({ error: 'Role and content are required' }, 400);
  }
  const id = generateId();
  const now = Date.now();
  await query(c.env, 'INSERT INTO conversations (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', [id, userId, role, content, now]);
  return c.json({ id, role, content, created_at: now });
});

// Clear all conversations
conversationsApp.delete('/', async (c) => {
  const userId = c.get('userId');
  await query(c.env, 'DELETE FROM conversations WHERE user_id = ?', [userId]);
  return c.json({ success: true });
});

export default conversationsApp;
