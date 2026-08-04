require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const db = require('./models');
const { globalLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorMiddleware = require('./middleware/errorMiddleware');
const { ensureDir } = require('./utils/helpers');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
ensureDir(UPLOAD_DIR);

// ============================================
// 🔒 SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Bypass-Tunnel-Reminder'],
  maxAge: 86400,
}));
app.set('trust proxy', 1);

// ============================================
// 🛠️ PARSING & LOGGING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

// ============================================
// 📂 STATIC UPLOADS
// ============================================
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '1d',
  etag: false,
}));

// ============================================
// 🌐 ROUTES
// ============================================
app.use('/', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', predictionRoutes);

// ============================================
// ❌ ERROR HANDLING (must be after routes)
// ============================================
app.use(notFound);
app.use(errorMiddleware);

// ============================================
// 🚀 STARTUP
// ============================================
const startServer = async () => {
  console.log('🚀 Starting AgroLens Backend...');
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await db.initializeDatabase();
  } catch (dbErr) {
    console.warn('⚠️  Database init encountered an error (continuing with fallback mode):', dbErr.message);
  }

  app.listen(PORT, HOST, () => {
    const banner = `
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://${HOST}:${PORT}                      
║  📡 Local:     http://localhost:${PORT}                   
║  🤖 ML API:    ${process.env.ML_API_URL || 'http://localhost:5001'}  
║  🗄️  Database: ${db.isConnected() ? '✅ PostgreSQL connected' : '⚠️  Disconnected (in-memory fallback)'}
║  📦 Uploads:   ${UPLOAD_DIR}                             
╚══════════════════════════════════════════════════════════╝
`;
    console.log(banner);
  });
};

startServer();
