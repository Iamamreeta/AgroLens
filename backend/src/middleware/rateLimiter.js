const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

const predictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many prediction requests. Please try again in a few minutes.',
  },
});

module.exports = { globalLimiter, authLimiter, predictLimiter };
