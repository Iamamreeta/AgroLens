require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/health', require('./routes/healthRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AgroLens Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      predictions: '/api/predictions'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(require('./middleware/notFound'));
app.use(require('./middleware/errorMiddleware'));

// ============================================
// DATABASE SYNC & START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    
    // Sync database (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
    
    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://${HOST}:${PORT}
║  📡 Local:     http://localhost:${PORT}
║  🗄️  Database: ✅ PostgreSQL connected
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Starting server without database...');
    
    // Start server even if database fails (in-memory mode)
    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://${HOST}:${PORT}
║  📡 Local:     http://localhost:${PORT}
║  🗄️  Database: ⚠️ Not connected (in-memory mode)
╚══════════════════════════════════════════════════════════╝
      `);
    });
  }
};

startServer();

module.exports = app;