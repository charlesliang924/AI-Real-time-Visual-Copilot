import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import { query } from './db.js';

const adminApp = new Hono<{ Bindings: { DB: any, JWT_SECRET: string } }>();

const getSecretKey = (env: any) => {
  return new TextEncoder().encode(env.JWT_SECRET || 'fallback_local_secret_key_123456');
};

adminApp.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, getSecretKey(c.env));
    if (payload.username !== 'admin') {
      return c.json({ error: 'Forbidden. Admin only.' }, 403);
    }
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

adminApp.get('/users', async (c) => {
  // In sqlite/D1, boolean might be returned as 0/1. Let's return as is.
  const users = await query(c.env, 'SELECT id, username, created_at, is_approved FROM users ORDER BY created_at DESC');
  return c.json({ users });
});

adminApp.post('/users/:id/approve', async (c) => {
  const { id } = c.req.param();
  const { is_approved } = await c.req.json();
  await query(c.env, 'UPDATE users SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, id]);
  return c.json({ success: true, is_approved: is_approved ? 1 : 0 });
});

export default adminApp;
