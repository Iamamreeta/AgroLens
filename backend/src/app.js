require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

// MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/health', require('./routes/healthRoutes'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'AgroLens Backend API', version: '1.0.0' });
});

// ERROR HANDLING
app.use(require('./middleware/notFound'));
app.use(require('./middleware/errorMiddleware'));

// START SERVER
const PORT = process.env.PORT || 3000;

// ✅ USE SEQUELIZE
const db = require('./models');

const startServer = async () => {
  try {
    // Test connection
    await db.sequelize.authenticate();
    console.log('✅ PostgreSQL connected!');
    
    // Sync database if DB_SYNC is set
    if (process.env.DB_SYNC === 'alter') {
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database synced');
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://0.0.0.0:${PORT}
║  🗄️  Database: ✅ Connected
║  📦 Models:    ${Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize').join(', ')}
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Database error:', error.message);
    // Start without database (fallback)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://0.0.0.0:${PORT}
║  🗄️  Database: ❌ Not connected
╚══════════════════════════════════════════════════════════╝
      `);
    });
  }
};

startServer();

module.exports = app;