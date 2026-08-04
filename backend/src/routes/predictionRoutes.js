const express = require('express');
const { predict, getHistory } = require('../controllers/predictionController');
const { uploadSingle } = require('../config/upload');
const { predictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/predict', predictLimiter, uploadSingle, predict);
router.get('/history', getHistory);

module.exports = router;
