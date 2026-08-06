require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Client } = require('pg');

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

// Test database connection
const testDatabase = async () => {
  try {
    const client = new Client({
      host: 'dpg-d9psntlbedkc73akq9d0-a',
      port: 5432,
      database: 'agrolens_db',
      user: 'agrolens_db_user',
      password: 'JHOJgIBG5k0ZxjJqV9sQv55NYraVw23A',
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('✅ PostgreSQL connected!');
    await client.end();
    return true;
  } catch (error) {
    console.log('⚠️ PostgreSQL not connected:', error.message);
    return false;
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  const dbStatus = await testDatabase();
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              🌿 AGROLENS BACKEND READY                   ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server:    http://0.0.0.0:${PORT}
║  🗄️  Database: ${dbStatus ? '✅ Connected' : '⚠️ Not connected'}
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;