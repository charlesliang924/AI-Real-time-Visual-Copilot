import { Hono } from 'hono';
import { query, generateId } from './db.js';
import { extractUser } from './auth-utils.js';

const skillsApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

// Auth middleware
skillsApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.id);
  await next();
});

// Get all custom skills for current user
skillsApp.get('/', async (c) => {
  const userId = c.get('userId');
  const skills = await query(c.env, 'SELECT id, name, description, endpoint, created_at FROM skills WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return c.json({ skills });
});

// Create a new skill
skillsApp.post('/', async (c) => {
  const userId = c.get('userId');
  const { name, description, endpoint } = await c.req.json();
  if (!name || !description || !endpoint) {
    return c.json({ error: 'Name, description and endpoint are required' }, 400);
  }
  const id = generateId();
  const now = Date.now();
  await query(c.env, 'INSERT INTO skills (id, user_id, name, description, endpoint, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, name, description, endpoint, now]);
  return c.json({ id, name, description, endpoint, created_at: now });
});

// Delete a skill
skillsApp.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  await query(c.env, 'DELETE FROM skills WHERE id = ? AND user_id = ?', [id, userId]);
  return c.json({ success: true });
});

export default skillsApp;
