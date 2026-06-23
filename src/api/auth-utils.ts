import { jwtVerify } from 'jose';

export interface AuthPayload {
  id: string;
  username: string;
  [key: string]: any;
}

// Dev-mode fallback secret (only used when JWT_SECRET is not configured)
// In production, JWT_SECRET MUST be set via environment variable
const DEV_FALLBACK_SECRET = 'dev_only_fallback_secret_change_me_in_production';

/**
 * Get JWT secret from environment.
 * Checks c.env first, then process.env, then falls back to dev secret with warning.
 */
export const getSecretKey = (env: any) => {
  // Check Hono bindings (Cloudflare/production)
  const secret = env?.JWT_SECRET || 
    (typeof process !== 'undefined' ? process.env?.JWT_SECRET : undefined);
  
  if (!secret) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured. Set it in your environment variables.');
    }
    // Dev mode fallback with warning
    console.warn('⚠️  JWT_SECRET not configured. Using dev fallback secret. DO NOT use in production!');
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
};

/**
 * Verify JWT token and return payload, or null if invalid.
 */
export const verifyToken = async (env: any, token: string): Promise<AuthPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(env));
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
};

/**
 * Extract and verify Bearer token from request headers.
 * Returns payload or null.
 */
export const extractUser = async (env: any, authHeader: string | undefined): Promise<AuthPayload | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(env, token);
};
