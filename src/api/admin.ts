import { Hono } from 'hono';
import { query } from './db.js';
import { getSecretKey, extractUser } from './auth-utils.js';
import { jwtVerify } from 'jose';

const adminApp = new Hono<{
  Bindings: { DB: any, JWT_SECRET: string };
  Variables: { userId: string };
}>();

adminApp.use('/*', async (c, next) => {
  const payload = await extractUser(c.env, c.req.header('Authorization'));
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (payload.username !== 'admin') {
    return c.json({ error: 'Forbidden. Admin only.' }, 403);
  }
  await next();
});

adminApp.get('/users', async (c) => {
  const users = await query(c.env, 'SELECT id, username, created_at, is_approved FROM users ORDER BY created_at DESC');
  return c.json({ users });
});

adminApp.post('/users/:id/approve', async (c) => {
  const { id } = c.req.param();
  const { is_approved } = await c.req.json();
  await query(c.env, 'UPDATE users SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, id]);
  return c.json({ success: true, is_approved: is_approved ? 1 : 0 });
});

// Usage statistics endpoint
adminApp.get('/stats', async (c) => {
  const totalUsers = await query(c.env, 'SELECT COUNT(*) as count FROM users');
  const approvedUsers = await query(c.env, 'SELECT COUNT(*) as count FROM users WHERE is_approved = 1');
  const totalConnections = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE event_type = 'connect'");
  const totalMessages = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE event_type = 'message'");
  const totalSkillCalls = await query(c.env, "SELECT COUNT(*) as count FROM usage_stats WHERE event_type = 'skill_call'");
  const recentActivity = await query(c.env, 'SELECT u.username, s.event_type, s.metadata, s.created_at FROM usage_stats s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 50');
  
  return c.json({
    totalUsers: totalUsers[0]?.count || 0,
    approvedUsers: approvedUsers[0]?.count || 0,
    totalConnections: totalConnections[0]?.count || 0,
    totalMessages: totalMessages[0]?.count || 0,
    totalSkillCalls: totalSkillCalls[0]?.count || 0,
    recentActivity
  });
});

export default adminApp;
