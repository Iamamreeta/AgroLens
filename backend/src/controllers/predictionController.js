const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mlService = require('../services/mlService');
const { deleteFile } = require('../utils/helpers');
const predictionRepo = require('../repositories/predictionRepository');

const predict = catchAsync(async (req, res, next) => {
  let filePath = null;
  try {
    mlService.validateImage(req.file);
    filePath = req.file?.path;
    const userId = req.user?.id || null;

    console.log(`[Predict] userId=${userId || 'anonymous'} file=${req.file?.originalname || 'unknown'} size=${req.file?.size || 0}`);
    let mlResponse;
    try {
      mlResponse = await mlService.callFastAPI(filePath);
    } catch (axiosErr) {
      console.error('[Predict] FastAPI call failed:', axiosErr.message);
      if (axiosErr.response) {
        console.error('[Predict] FastAPI status:', axiosErr.response.status);
        console.error('[Predict] FastAPI data:', JSON.stringify(axiosErr.response.data).slice(0, 600));
      }
      if (filePath) deleteFile(filePath);
      return res.status(502).json({
        success: false,
        error:
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.exception ||
          axiosErr.response?.data?.message ||
          'Prediction service is unavailable. Please ensure the FastAPI ML server is running.',
        details: process.env.NODE_ENV === 'development' ? axiosErr.message : undefined,
      });
    }

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
      timestamp: savedPrediction.created_at || savedPrediction.createdAt || new Date().toISOString(),
      saved: true,
      image_url: persistedImagePath,
      user_id: userId,
    };

    return res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (err) {
    if (filePath) deleteFile(filePath);
    return next(err);
  }
});

const getHistory = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const userId = req.user.id;
  const { search, status, sortBy, sortDir, limit, offset } = req.query;
  const result = await predictionRepo.findAllByUserId(userId, {
    search,
    status,
    sortBy: sortBy || 'created_at',
    sortDir: sortDir || 'DESC',
    limit: limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  const rows = (result.rows || []).map((r) => r.toJSON ? r.toJSON() : r);
  res.status(200).json({
    success: true,
    count: result.count || rows.length,
    history: rows,
  });
});

const getHistoryById = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { id } = req.params;
  const item = await predictionRepo.findByIdAndUserId(id, req.user.id);
  if (!item) throw new AppError('Prediction not found', 404);
  const plain = item.toJSON ? item.toJSON() : item;
  res.status(200).json({
    success: true,
    data: plain,
  });
});

const deleteHistoryById = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { id } = req.params;
  const deleted = await predictionRepo.deleteByIdAndUserId(id, req.user.id);
  if (!deleted) throw new AppError('Prediction not found or already deleted', 404);
  res.status(200).json({
    success: true,
    message: 'Prediction deleted',
  });
});

const deleteHistoryAll = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const deleted = await predictionRepo.deleteAllByUserId(req.user.id) || 0;
  res.status(200).json({
    success: true,
    message: `Deleted ${deleted} history records`,
    deleted: typeof deleted === 'number' ? deleted : 0,
  });
});

module.exports = {
  predict,
  getHistory,
  getHistoryById,
  deleteHistoryById,
  deleteHistoryAll,
};
