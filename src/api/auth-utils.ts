import { jwtVerify } from 'jose';

export interface AuthPayload {
  id: string;
  username: string;
  [key: string]: any;
}

/**
 * Get JWT secret from environment. Throws if not configured.
 * No fallback secret - forces proper configuration for security.
 */
export const getSecretKey = (env: any) => {
  const secret = env?.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set it in your environment variables.');
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
