const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const emailService = require('./emailService');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[AuthService] WARNING: JWT_SECRET is too short or not set. Set a secure long random secret.');
    }
    return secret || 'agrolens-dev-secret-insecure-change-me-2024';
  }
  return secret;
};

const signToken = (id) =>
  jwt.sign({ id, iat: Math.floor(Date.now() / 1000) }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id, type: 'refresh' }, getSecret(), {
    expiresIn: '30d',
  });

const decodeToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (e) {
    return null;
  }
};

const userSafe = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  profile_picture_url: user.profile_picture_url || null,
  total_scans: typeof user.total_scans === 'number' ? user.total_scans : 0,
  healthy_count: typeof user.healthy_count === 'number' ? user.healthy_count : 0,
  disease_count: typeof user.disease_count === 'number' ? user.disease_count : 0,
  last_login_at: user.last_login_at || null,
  created_at: user.created_at || user.createdAt || new Date(),
  email_verified: Boolean(user.email_verified) || false,
});

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const generateResetToken = () => {
  const raw = crypto.randomBytes(3).toString('hex');
  const code = raw.toUpperCase();
  return code.match(/.{1,6}/g).slice(0,6).join('-') || raw.slice(0, 36);
};

class AuthService {
  createTokenResponse(user) {
    const token = signToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    const cookieOptions = {
      expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    };
    return { token, refreshToken, cookieOptions, user: userSafe(user) };
  }

  async signup(name, email, password) {
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('A user with this email address already exists.', 409);
    }
    const created = await userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      password_hash: password,
    });
    await userRepo.updateLastLogin(created.id);
    const refreshed = (await userRepo.findById(created.id)) || created;
    emailService.sendWelcome(normalizedEmail, created.name).catch(() => null);
    return this.createTokenResponse(refreshed);
  }

  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide both email and password', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }
    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }
    await userRepo.updateLastLogin(user.id);
    const refreshed = (await userRepo.findById(user.id)) || user;
    return this.createTokenResponse(refreshed);
  }

  async refreshToken(refreshTokenStr) {
    const decoded = decodeToken(refreshTokenStr);
    if (!decoded || decoded.type !== 'refresh') {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    const user = await userRepo.findById(decoded.id);
    if (!user) throw new AppError('User no longer exists', 401);
    return this.createTokenResponse(user);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(currentPassword)
      : await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) throw new AppError('Current password is incorrect', 401);
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await userRepo.changePassword(userId, hashed);
    return this.createTokenResponse(user);
  }

  async deleteAccount(userId, password) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new AppError('Password is incorrect', 401);
    await require('../repositories/predictionRepository').deleteAllByUserId(userId).catch(() => null);
    await userRepo.delete(userId);
    return true;
  }

  async forgotPassword(email, clientResetUrl) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      return {
        sent: true,
        message: 'If a matching email exists, a password reset link has been sent.',
      };
    }
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await userRepo.setResetToken(user.id, tokenHash, expiresAt);
    const resetUrl = clientResetUrl
      ? `${clientResetUrl}?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalizedEmail)}`
      : null;
    await emailService.sendPasswordReset(normalizedEmail, user.name, rawToken, resetUrl);
    return {
      sent: true,
      message: 'If a matching email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }
    const tokenHash = hashToken(String(token).trim());
    const user = await userRepo.findByResetTokenHash(tokenHash);
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }
    await userRepo.markResetTokenUsed(user.id);
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await userRepo.changePassword(user.id, hashed);
    return {
      success: true,
      message: 'Password updated successfully. Please log in with your new password.',
    };
  }

  async getCurrentUserFromToken(req) {
    let token;
    if (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) return null;
    const decoded = decodeToken(token);
    if (!decoded || !decoded.id) return null;
    return userRepo.findById(decoded.id);
  }
}

module.exports = new AuthService();
