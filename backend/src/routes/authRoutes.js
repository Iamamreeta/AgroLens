const express = require('express');
const {
  validateSignup,
  validateLogin,
  validateChangePassword,
} = require('../validators/authValidator');
const { authLimiter, passwordLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');
const {
  signup,
  login,
  logout,
  me,
  changePassword,
  deleteAccount,
  refresh,
  getUserStats,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.post('/refresh', refresh);

router.post('/forgot-password', passwordLimiter, forgotPassword);
router.post('/reset-password', passwordLimiter, resetPassword);

router.get('/me', protect, me);
router.post('/change-password', protect, validateChangePassword, changePassword);
router.delete('/account', protect, deleteAccount);

router.get('/stats', protect, getUserStats);

module.exports = router;
