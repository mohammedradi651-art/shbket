import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { SessionUser } from '../../shared/types.js';
import { config } from './config.js';
import { repository } from './repository.js';

export function issueToken(userId: string) {
  return jwt.sign({}, config.sessionSecret, { subject: userId, expiresIn: '7d' });
}

export function toSessionUser(user: { passwordHash: string } & SessionUser): SessionUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export type AuthenticatedRequest = Request & { user?: SessionUser };

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  let userId = '';
  try { userId = String(jwt.verify(token, config.sessionSecret, { algorithms: ['HS256'] }).sub ?? ''); } catch { userId = ''; }
  const user = userId ? await repository.findUserById(userId) : undefined;
  if (!user) return response.status(401).json({ error: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول أولًا.' });
  request.user = toSessionUser(user);
  return next();
}
