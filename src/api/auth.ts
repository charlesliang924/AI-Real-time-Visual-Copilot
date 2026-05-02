import { Hono } from 'hono';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { query, queryFirst } from './db.js';

const authApp = new Hono<{ Bindings: { DB: any, JWT_SECRET: string } }>();

const getSecretKey = (env: any) => {
  return new TextEncoder().encode(env.JWT_SECRET || 'fallback_local_secret_key_123456');
};

authApp.post('/register', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password || username.length < 3 || password.length < 6) {
    return c.json({ error: 'Username must be at least 3 chars, and password at least 6 chars.' }, 400);
  }

  const existingUser = await queryFirst(c.env, 'SELECT id FROM users WHERE username = ?', [username]);
  if (existingUser) {
    return c.json({ error: 'Username already exists' }, 400);
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = Date.now();

  try {
    const isApproved = username === 'admin' ? 1 : 0;
    await query(c.env, 'INSERT INTO users (id, username, password_hash, created_at, is_approved) VALUES (?, ?, ?, ?, ?)', [id, username, passwordHash, now, isApproved]);
    
    // Generate JWT
    const token = await new SignJWT({ id, username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getSecretKey(c.env));

    return c.json({ token, user: { id, username, is_approved: isApproved } });
  } catch (err) {
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

authApp.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const user: any = await queryFirst(c.env, 'SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await new SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey(c.env));

  return c.json({ token, user: { id: user.id, username: user.username, is_approved: user.is_approved } });
});

authApp.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, getSecretKey(c.env));
    const user: any = await queryFirst(c.env, 'SELECT is_approved FROM users WHERE id = ?', [payload.id]);
    return c.json({ user: { id: payload.id, username: payload.username, is_approved: user ? user.is_approved : 0 } });
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default authApp;
