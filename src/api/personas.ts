import { Hono } from 'hono';
import { query, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const personasApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

// Auth middleware
personasApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.id);
  await next();
});

// Get all custom personas for current user
personasApp.get('/', async (c) => {
  const userId = c.get('userId');
  const personas = await query(c.env, 'SELECT id, name, avatar_icon, system_prompt, created_at FROM personas WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return c.json({ personas });
});

// Create a new persona
personasApp.post('/', async (c) => {
  const userId = c.get('userId');
  const { name, avatar_icon, system_prompt } = await c.req.json();
  if (!name || !system_prompt) {
    return c.json({ error: 'Name and system_prompt are required' }, 400);
  }
  const id = generateId();
  const now = Date.now();
  await query(c.env, 'INSERT INTO personas (id, user_id, name, avatar_icon, system_prompt, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, name, avatar_icon || '✨', system_prompt, now]);
  return c.json({ id, name, avatar_icon: avatar_icon || '✨', system_prompt, created_at: now });
});

// Update a persona
personasApp.put('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const { name, avatar_icon, system_prompt } = await c.req.json();
  await query(c.env, 'UPDATE personas SET name = ?, avatar_icon = ?, system_prompt = ? WHERE id = ? AND user_id = ?', [name, avatar_icon, system_prompt, id, userId]);
  return c.json({ success: true });
});

// Delete a persona
personasApp.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  await query(c.env, 'DELETE FROM personas WHERE id = ? AND user_id = ?', [id, userId]);
  return c.json({ success: true });
});

export default personasApp;
