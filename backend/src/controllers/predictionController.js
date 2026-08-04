const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mlService = require('../services/mlService');
const { deleteFile } = require('../utils/helpers');
const authService = require('../services/authService');

const predict = catchAsync(async (req, res, next) => {
  let filePath = null;
  try {
    mlService.validateImage(req.file);
    filePath = req.file?.path;

    const currentUser = await authService.getCurrentUserFromToken(req);
    const userId = currentUser?.id || null;

    console.log('📤 Sending to FastAPI on port 5001...');
    let mlResponse;
    try {
      mlResponse = await mlService.callFastAPI(filePath);
    } catch (axiosErr) {
      console.error('❌ FastAPI call failed:', axiosErr.message);
      if (axiosErr.response) {
        console.error('❌ FastAPI status:', axiosErr.response.status);
        console.error('❌ FastAPI data:', axiosErr.response.data);
      }
      if (filePath) deleteFile(filePath);
      return res.status(502).json({
        success: false,
        error:
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.exception ||
          'Prediction service is unavailable. Please ensure FastAPI ML server is running on port 5001.',
        details: process.env.NODE_ENV === 'development' ? axiosErr.message : undefined,
      });
    }

    console.log('✅ Prediction received from FastAPI');
    if (filePath) deleteFile(filePath);

    if (!mlResponse.success || !mlResponse.data) {
      return res.status(500).json({
        success: false,
        error: mlResponse.exception || mlResponse.error || 'Prediction failed internally at ML server',
      });
    }

    const rawResult = mlResponse.data;
    const enriched = await mlService.enrichWithDiseaseInfo({ ...rawResult });
    const persistedImagePath = req.file?.filename ? `/uploads/${req.file.filename}` : null;
    const savedPrediction = await mlService.savePredictionToDB(enriched, persistedImagePath, userId);

    const combined = {
      id: savedPrediction.id,
      disease: enriched.disease,
      disease_name: enriched.disease_name || enriched.disease,
      confidence: enriched.confidence,
      status: enriched.status,
      is_leaf: enriched.is_leaf,
      green_ratio: enriched.green_ratio,
      probabilities: enriched.probabilities || null,
      severity: enriched.severity || null,
      description: enriched.description || null,
      symptoms: enriched.symptoms || null,
      causes: enriched.causes || null,
      treatment: enriched.treatment || null,
      prevention: enriched.prevention || null,
      prediction_date: savedPrediction.prediction_date,
      prediction_time: savedPrediction.prediction_time,
      timestamp: savedPrediction.created_at || new Date().toISOString(),
      saved: true,
      image_url: persistedImagePath,
      user_id: userId,
    };

    return res.json({
      success: true,
      data: combined,
    });
  } catch (err) {
    if (filePath) deleteFile(filePath);
    return next(err);
  }
});

const getHistory = catchAsync(async (req, res) => {
  const currentUser = await authService.getCurrentUserFromToken(req);
  const userId = currentUser?.id;
  let rows = [];
  let count = 0;
  if (userId) {
    const { search, status, sortBy, sortDir, limit, offset } = req.query;
    const result = await require('../repositories/predictionRepository').findAllByUserId(userId, {
      search,
      status,
      sortBy: sortBy || 'created_at',
      sortDir: sortDir || 'DESC',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    rows = result.rows || [];
    count = result.count || 0;
  }
  res.json({
    success: true,
    count,
    history: rows,
  });
});

const stubSignup = catchAsync(async (_req, _res) => {
  throw new AppError('Signup endpoint ready. Module 2 will implement JWT auth.', 501);
});
const stubLogin = catchAsync(async (_req, _res) => {
  throw new AppError('Login endpoint ready. Module 2 will implement JWT auth.', 501);
});
const stubProfile = catchAsync(async (_req, _res) => {
  throw new AppError('Profile endpoint ready. Module 2 will implement JWT auth.', 501);
});

module.exports = {
  predict,
  getHistory,
  stubSignup,
  stubLogin,
  stubProfile,
};
