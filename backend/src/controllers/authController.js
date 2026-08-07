const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');
const predictionRepo = require('../repositories/predictionRepository');

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.signup(name, email, password);
  if (result.cookieOptions) {
    res.cookie('jwt', result.token, result.cookieOptions);
  }
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token: result.token,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  if (result.cookieOptions) {
    res.cookie('jwt', result.token, result.cookieOptions);
  }
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: result.token,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

exports.logout = catchAsync(async (_req, res) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

exports.me = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      profile_picture_url: req.user.profile_picture_url || null,
      total_scans: req.user.total_scans || 0,
      healthy_count: req.user.healthy_count || 0,
      disease_count: req.user.disease_count || 0,
      last_login_at: req.user.last_login_at || null,
      created_at: req.user.created_at || req.user.createdAt || new Date(),
      email_verified: Boolean(req.user.email_verified) || false,
    },
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Current and new password are required', 400);
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token: result.token,
    refreshToken: result.refreshToken,
  });
});

exports.deleteAccount = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { password } = req.body || {};
  if (!password) throw new AppError('Password is required to delete account', 400);
  await authService.deleteAccount(req.user.id, password);
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({
    success: true,
    message: 'Account deleted permanently',
  });
});

exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) throw new AppError('Refresh token is required', 400);
  const result = await authService.refreshToken(refreshToken);
  res.status(200).json({
    success: true,
    token: result.token,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

exports.getUserStats = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const userId = req.user.id;
  const quick = await predictionRepo.getStatsByUserId(userId);
  const weekly = await predictionRepo.getWeeklyCounts(userId);
  const monthly = await predictionRepo.getMonthlyCounts(userId);
  const mostCommon = await predictionRepo.getMostCommonDisease(userId);
  const streak = await predictionRepo.getScanStreak(userId);
  const today = new Date();
  res.status(200).json({
    success: true,
    data: {
      total: quick.total || 0,
      healthy: quick.healthy || 0,
      diseased: quick.diseased || 0,
      most_common_disease: mostCommon || null,
      weekly: weekly,
      monthly: monthly,
      streak_days: streak,
      recent: quick.recent || [],
      last_updated: today.toISOString(),
    },
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email, resetUrl } = req.body || {};
  const result = await authService.forgotPassword(email, resetUrl);
  res.status(200).json({
    success: true,
    sent: result.sent,
    message: result.message,
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword, confirmNewPassword } = req.body || {};
  if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
    throw new AppError('Passwords do not match', 400);
  }
  const result = await authService.resetPassword(token, newPassword);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});
