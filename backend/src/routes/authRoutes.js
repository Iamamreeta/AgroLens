const express = require('express');
const { validateSignup, validateLogin } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');
const { stubSignup, stubLogin, stubProfile } = require('../controllers/predictionController');

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, stubSignup);
router.post('/login', authLimiter, validateLogin, stubLogin);
router.get('/profile', stubProfile);

module.exports = router;
