import { handle } from 'hono/cloudflare-pages';
import app from '../../src/api/index.js';

export const onRequest = handle(app);
