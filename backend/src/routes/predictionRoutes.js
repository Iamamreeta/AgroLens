const express = require('express');
const {
  predict,
  getHistory,
  getHistoryById,
  deleteHistoryById,
  deleteHistoryAll,
} = require('../controllers/predictionController');
const { uploadSingle } = require('../config/upload');
const { predictLimiter } = require('../middleware/rateLimiter');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/predict', predictLimiter, uploadSingle, optionalAuth, predict);
router.get('/history', protect, getHistory);
router.get('/history/:id', protect, getHistoryById);
router.delete('/history/:id', protect, deleteHistoryById);
router.delete('/history', protect, deleteHistoryAll);

module.exports = router;
