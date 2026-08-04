const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');

exports.protect = catchAsync(async (req, _res, next) => {
  const user = await authService.getCurrentUserFromToken(req);
  if (!user) {
    return next(new AppError('You are not logged in or your session expired. Please log in again.', 401));
  }
  req.user = user;
  return next();
});

exports.optionalAuth = catchAsync(async (req, _res, next) => {
  try {
    const user = await authService.getCurrentUserFromToken(req);
    if (user) req.user = user;
  } catch (_e) {
    // ignore invalid optional tokens
  }
  return next();
});
