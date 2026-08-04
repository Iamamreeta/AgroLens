const db = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const healthCheck = catchAsync(async (_req, res) => {
  const status = {
    status: 'healthy',
    service: 'AgroLens Backend',
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };
  if (!db.isConnected()) {
    status.warning = 'PostgreSQL not connected; using in-memory fallback. Start PostgreSQL and restart server for full feature set.';
  }
  res.status(db.isConnected() ? 200 : 200).json({
    success: true,
    ...status,
  });
});

module.exports = { healthCheck };
