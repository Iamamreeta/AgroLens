const express = require('express');
const {
  validateSignup,
  validateLogin,
  validateChangePassword,
} = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');
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
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.post('/refresh', refresh);

router.get('/me', protect, me);
router.post('/change-password', protect, validateChangePassword, changePassword);
router.delete('/account', protect, deleteAccount);

router.get('/stats', protect, getUserStats);

module.exports = router;
