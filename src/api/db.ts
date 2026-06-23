// This file handles both local dev (better-sqlite3) and Cloudflare Pages (D1)
// We use dynamic imports for native Node modules so Cloudflare's bundler doesn't fail.

let localDbCache: any = null;
let d1Initialized = false;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at INTEGER,
    is_approved INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    fact TEXT NOT NULL,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_icon TEXT,
    system_prompt TEXT NOT NULL,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS usage_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
  CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_stats_user ON usage_stats(user_id);
`;

export const query = async (env: any, sql: string, params: any[] = []) => {
  if (env && env.DB) {
    // Cloudflare D1
    if (!d1Initialized) {
      d1Initialized = true;
      try {
        await env.DB.exec(SCHEMA_SQL);
      } catch(e) {}
      try {
        await env.DB.exec('ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0;');
      } catch(e) {}
    }
    
    const stmt = env.DB.prepare(sql);
    let binded = stmt;
    if (params.length > 0) {
      binded = stmt.bind(...params);
    }
    const { results } = await binded.all();
    return results;
  } else {
    // Local better-sqlite3
    if (!localDbCache) {
      const dbNames = {
        sqlite: 'better-sqlite3',
        path: 'path',
        url: 'url'
      };
      const path = await import(/* @vite-ignore */ dbNames.path);
      const url = await import(/* @vite-ignore */ dbNames.url);
      const Database = (await import(/* @vite-ignore */ dbNames.sqlite)).default;

      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const dbPath = path.join(__dirname, '../../local.sqlite');
      localDbCache = new Database(dbPath);
      localDbCache.exec(SCHEMA_SQL);
      try { 
        localDbCache.exec('ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0'); 
      } catch(e) {}
    }
    
    const db = localDbCache;
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    } else {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        return { success: true, changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }
};

export const queryFirst = async (env: any, sql: string, params: any[] = []) => {
  const results = await query(env, sql, params);
  return results && results.length > 0 ? results[0] : null;
};

// Helper to generate UUID
export const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : (Date.now().toString(36) + Math.random().toString(36).substring(2));
};
