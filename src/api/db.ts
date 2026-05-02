// This file handles both local dev (better-sqlite3) and Cloudflare Pages (D1)
// We use dynamic imports for native Node modules so Cloudflare's bundler doesn't fail.

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
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        created_at INTEGER
      );
    `);

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
