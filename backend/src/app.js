require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true;

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400,
}));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' || process.env.HTTP_LOG === 'true') {
  const morgan = require('morgan');
  app.use(morgan(process.env.LOG_FORMAT || 'dev'));
}
app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

const { globalLimiter } = require('./middleware/rateLimiter');
app.use('/api', globalLimiter);

// ROUTES - PRIMARY
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/health', require('./routes/healthRoutes'));

// COMPATIBILITY SHORTCUTS - maps frontend calls to controller handlers
const { uploadSingle } = require('./config/upload');
const { predictLimiter } = require('./middleware/rateLimiter');
const { protect, optionalAuth } = require('./middleware/authMiddleware');
const {
  predict,
  getHistory,
  getHistoryById,
  deleteHistoryById,
  deleteHistoryAll,
} = require('./controllers/predictionController');

app.post('/api/predict', predictLimiter, uploadSingle, optionalAuth, predict);
app.get('/api/history', protect, getHistory);
app.get('/api/history/:id', protect, getHistoryById);
app.delete('/api/history/:id', protect, deleteHistoryById);
app.delete('/api/history', protect, deleteHistoryAll);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgroLens Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      predictions: '/api/predictions/*',
      predict: 'POST /api/predict',
      history: 'GET /api/history',
      health: '/health',
    },
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AgroLens API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ERROR HANDLING
app.use(require('./middleware/notFound'));
app.use(require('./middleware/errorMiddleware'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const db = require('./models');

const printBanner = () => {
  const modelNames = Object.keys(db).filter(
    (k) => k !== 'sequelize' && k !== 'Sequelize' && k !== 'connected'
  ).join(', ');
  console.log('========================================');
  console.log('  AGROLENS BACKEND READY');
  console.log('========================================');
  console.log('  Server:    http://' + HOST + ':' + PORT);
  console.log('  Database:  ' + (db.connected ? 'Connected' : 'Pending / Not Connected'));
  console.log('  Models:    ' + modelNames);
  console.log('========================================');
};

const startServer = async () => {
  const start = () => {
    app.listen(PORT, HOST, () => {
      printBanner();
    });
  };
  let waited = 0;
  const waitForDB = setInterval(() => {
    waited += 500;
    if (db.connected || waited > 5000) {
      clearInterval(waitForDB);
      start();
    }
  }, 500);
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  process.exit(1);
});

module.exports = app;
