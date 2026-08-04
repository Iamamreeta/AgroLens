const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../models');
const diseaseInfoRepo = require('../repositories/diseaseInfoRepository');
const predictionRepo = require('../repositories/predictionRepository');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const { deleteFile, arrayToText, formatDateParts, ensureDir } = require('../utils/helpers');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_BYTES = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

class MLService {
  constructor() {
    this.baseUrl = process.env.ML_API_URL || 'http://localhost:5001';
    this.timeout = parseInt(process.env.ML_API_TIMEOUT, 10) || 30000;
    this.inMemoryStore = [];
    this.uploadsDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    ensureDir(this.uploadsDir);
  }

  validateImage(file) {
    if (!file) throw new AppError('No image uploaded', 400);
    if (file.size > MAX_BYTES) {
      deleteFile(file.path);
      throw new AppError(`Image too large. Max ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`, 400);
    }
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeOk = ALLOWED_MIME.includes(file.mimetype?.toLowerCase());
    const extOk = ALLOWED_EXT.includes(ext);
    if (!mimeOk || !extOk) {
      deleteFile(file.path);
      throw new AppError(`Invalid image format. Allowed: JPG, PNG, WEBP.`, 400);
    }
    return true;
  }

  async callFastAPI(filePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    const response = await axios.post(`${this.baseUrl}/predict`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: this.timeout,
    });
    return response.data;
  }

  async enrichWithDiseaseInfo(result) {
    const key = result.disease;
    if (!key) return result;
    let info = null;
    try {
      info = await diseaseInfoRepo.findByDiseaseKey(key);
      if (!info) {
        const all = await db.connected ? (await db.DiseaseInfo.findAll()).map((d) => d.disease_key) : [];
        info = await diseaseInfoRepo.matchBest(key, all);
      }
    } catch (e) {
      console.warn('⚠️  DiseaseInfo lookup failed:', e.message);
    }
    if (info) {
      result.disease_name = info.display_name || info.disease_key;
      result.severity = info.severity || null;
      result.description = info.description || null;
      result.symptoms = Array.isArray(info.symptoms) ? info.symptoms.join('\n') : info.symptoms || null;
      result.causes = Array.isArray(info.causes) ? info.causes.join('\n') : info.causes || null;
      result.treatment = Array.isArray(info.treatment) ? info.treatment.join('\n') : info.treatment || null;
      result.prevention = Array.isArray(info.prevention) ? info.prevention.join('\n') : info.prevention || null;
    } else {
      result.disease_name = key;
    }
    return result;
  }

  async savePredictionToDB(rawResult, imagePath, userId) {
    const isHealthy = rawResult.status === 'Healthy' || /healthy/i.test(rawResult.disease || '');
    const { date, time } = formatDateParts();
    const prediction = {
      user_id: userId || null,
      image_url: imagePath || null,
      disease_key: rawResult.disease,
      disease_name: rawResult.disease_name || rawResult.disease,
      confidence: parseFloat(rawResult.confidence) || 0,
      status: rawResult.status || (isHealthy ? 'Healthy' : 'Diseased'),
      is_leaf: rawResult.is_leaf === undefined ? null : Boolean(rawResult.is_leaf),
      green_ratio: rawResult.green_ratio === undefined ? null : parseFloat(rawResult.green_ratio),
      symptoms: rawResult.symptoms || null,
      causes: rawResult.causes || null,
      treatment: rawResult.treatment || null,
      prevention: rawResult.prevention || null,
      probabilities_json: rawResult.probabilities || null,
      prediction_date: date,
      prediction_time: time,
      saved: true,
    };
    let saved;
    try {
      saved = await predictionRepo.create(prediction);
    } catch (e) {
      console.warn('⚠️  Could not save prediction to DB:', e.message);
      saved = { id: `mem-${Date.now()}`, ...prediction };
      this.inMemoryStore.unshift(saved);
    }
    try {
      if (userId && !isHealthy || (isHealthy && userId)) {
        await userRepo.updateStats(userId, isHealthy);
      }
    } catch (e) {
      console.warn('⚠️  Could not update user stats:', e.message);
    }
    return saved;
  }
}

module.exports = new MLService();
