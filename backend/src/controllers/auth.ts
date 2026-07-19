import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  AuthRequest,
} from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password y nombre requeridos' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password debe tener al menos 8 caracteres' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, is_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, full_name, created_at`,
      [email, passwordHash, fullName]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    const result = await query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const result = await verifyRefreshToken(refreshToken);
    if (!result) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    await revokeRefreshToken(refreshToken);

    const user = await query('SELECT id, email FROM users WHERE id = $1', [result.userId]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const newAccessToken = generateAccessToken(user.rows[0].id, user.rows[0].email);
    const newRefreshToken = await generateRefreshToken(
      user.rows[0].id,
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Error al renovar sesión' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    if (req.userId) {
      await revokeAllUserSessions(req.userId);
    }
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

export async function updatePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password actual y nuevo requeridos' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Nuevo password debe tener al menos 8 caracteres' });
    }

    const user = await query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Password actual incorrecto' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.userId]);
    await revokeAllUserSessions(req.userId!);

    res.json({ message: 'Password actualizado. Inicia sesión nuevamente.' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Error al actualizar password' });
  }
}

export async function listSessions(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT id, device_info, ip_address, created_at, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Error al listar sesiones' });
  }
}

export async function revokeSession(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    await query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1 AND user_id = $2',
      [sessionId, req.userId]
    );
    res.json({ message: 'Sesión revocada' });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: 'Error al revocar sesión' });
  }
}

// OAuth 2.0 - Google OAuth
export async function googleAuth(req: Request, res: Response) {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await query(
      'INSERT INTO oauth_states (state, provider, redirect_uri, expires_at) VALUES ($1, $2, $3, $4)',
      [state, 'google', req.query.redirect_uri || null, expiresAt]
    );

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ error: 'Google OAuth no configurado' });
    }

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Error al iniciar OAuth' });
  }
}

export async function googleCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!state || !code) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const stateResult = await query(
      'SELECT id FROM oauth_states WHERE state = $1 AND provider = $2 AND expires_at > NOW()',
      [state, 'google']
    );

    if (stateResult.rows.length === 0) {
      return res.status(400).json({ error: 'Estado inválido o expirado' });
    }

    await query('DELETE FROM oauth_states WHERE state = $1', [state]);

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      return res.status(500).json({ error: 'Google OAuth no configurado' });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens: { id_token?: string } = await tokenRes.json();
    if (!tokens.id_token) {
      return res.status(400).json({ error: 'Error al obtener token de Google' });
    }

    const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture;

    let user = await query('SELECT id, email FROM users WHERE google_id = $1', [googleId]);

    if (user.rows.length === 0) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        await query(
          'UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = NOW() WHERE id = $3',
          [googleId, avatar, existing.rows[0].id]
        );
        user = await query('SELECT id, email FROM users WHERE id = $1', [existing.rows[0].id]);
      } else {
        user = await query(
          `INSERT INTO users (email, password_hash, full_name, google_id, avatar_url, is_verified)
           VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email`,
          [email, '', name, googleId, avatar]
        );
      }
    }

    const accessToken = generateAccessToken(user.rows[0].id, user.rows[0].email);
    const refreshToken = await generateRefreshToken(user.rows[0].id);

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).json({ error: 'Error al procesar OAuth' });
  }
}
