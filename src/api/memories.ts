import { Hono } from 'hono';
import { query, queryFirst, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const memoriesApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

// Auth middleware
memoriesApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.id);
  await next();
});

// Get all memories for current user
memoriesApp.get('/', async (c) => {
  const userId = c.get('userId');
  const memories = await query(c.env, 'SELECT id, fact, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return c.json({ memories });
});

// Add a new memory
memoriesApp.post('/', async (c) => {
  const userId = c.get('userId');
  const { fact } = await c.req.json();
  if (!fact || !fact.trim()) {
    return c.json({ error: 'Fact is required' }, 400);
  }
  // Avoid duplicates
  const existing = await queryFirst(c.env, 'SELECT id FROM memories WHERE user_id = ? AND fact = ?', [userId, fact.trim()]);
  if (existing) {
    return c.json({ id: existing.id, fact: fact.trim(), duplicate: true });
  }
  const id = generateId();
  const now = Date.now();
  await query(c.env, 'INSERT INTO memories (id, user_id, fact, created_at) VALUES (?, ?, ?, ?)', [id, userId, fact.trim(), now]);
  return c.json({ id, fact: fact.trim(), created_at: now });
});

// Delete a memory
memoriesApp.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  await query(c.env, 'DELETE FROM memories WHERE id = ? AND user_id = ?', [id, userId]);
  return c.json({ success: true });
});

export default memoriesApp;
