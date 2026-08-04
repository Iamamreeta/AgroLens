require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors());  // ← This handles all CORS
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

// ============================================
// ERROR HANDLING
// ============================================
app.use(require('./middleware/notFound'));
app.use(require('./middleware/errorMiddleware'));

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 AgroLens Backend running on port ${PORT}`);
});

module.exports = app;