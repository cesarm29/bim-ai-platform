import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_DAYS = 7;

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as {
      userId: string;
      email: string;
      role: string;
      type: string;
    };
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Tipo de token inválido' });
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token_expired', message: 'Token de acceso expirado' });
    }
    return res.status(401).json({ error: 'Token de acceso inválido' });
  }
}

export function generateAccessToken(userId: string, email: string, role: string = 'user'): string {
  return jwt.sign(
    { userId, email, role, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

export async function generateRefreshToken(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<string> {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hash, deviceInfo || null, ipAddress || null, expiresAt]
  );

  const tokenId = crypto.createHash('sha256').update(raw + userId).digest('hex').slice(0, 12);
  return `${tokenId}.${raw}`;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string; tokenId: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [tokenId, raw] = parts;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const lookupHash = crypto.createHash('sha256').update(raw + '?').digest('hex');

    const result = await query(
      `SELECT user_id, expires_at, is_revoked FROM refresh_tokens
       WHERE token_hash = $1 AND is_revoked = false`,
      [hash]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1', [hash]);
      return null;
    }

    return { userId: row.user_id, tokenId };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const parts = token.split('.');
  if (parts.length !== 2) return;

  const raw = parts[1];
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1', [hash]);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [userId]);
}

export function generateTokenPair(userId: string, email: string, role: string = 'user', deviceInfo?: string, ipAddress?: string) {
  const accessToken = generateAccessToken(userId, email, role);
  return generateRefreshToken(userId, deviceInfo, ipAddress).then((refreshToken) => ({
    accessToken,
    refreshToken,
  }));
}
