import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

let localDb: any = null;

const getLocalDb = () => {
  if (!localDb) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dbPath = path.join(__dirname, '../../local.sqlite');
    localDb = new Database(dbPath);
    
    // Initialize schema
    localDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        created_at INTEGER
      );
    `);
  }
  return localDb;
};

export const query = async (env: any, sql: string, params: any[] = []) => {
  if (env && env.DB) {
    // Cloudflare D1
    const stmt = env.DB.prepare(sql);
    let binded = stmt;
    if (params.length > 0) {
      binded = stmt.bind(...params);
    }
    const { results } = await binded.all();
    return results;
  } else {
    // Local better-sqlite3
    const db = getLocalDb();
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
