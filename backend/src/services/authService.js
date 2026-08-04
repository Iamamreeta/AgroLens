const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'agrolens-dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'agrolens-dev-secret');
  } catch (e) {
    return null;
  }
};

class AuthService {
  createTokenResponse(user) {
    const token = signToken(user.id);
    const cookieOptions = {
      expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_picture_url: user.profile_picture_url || null,
      total_scans: user.total_scans || 0,
      healthy_count: user.healthy_count || 0,
      disease_count: user.disease_count || 0,
      created_at: user.created_at || user.createdAt || new Date(),
    };
    return { token, cookieOptions, user: userSafe };
  }

  async signup(name, email, password) {
    throw new AppError('Signup service stub - complete in Module 2', 501);
  }

  async login(email, password) {
    throw new AppError('Login service stub - complete in Module 2', 501);
  }

  async getCurrentUserFromToken(req) {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return null;
    const decoded = decodeToken(token);
    if (!decoded) return null;
    return userRepo.findById(decoded.id);
  }
}

module.exports = new AuthService();
