const { Client } = require('pg');

exports.healthCheck = async (req, res) => {
  let dbStatus = 'disconnected';
  
  try {
    const client = new Client({
      host: process.env.DB_HOST || 'dpg-d9psntlbedkc73akq9d0-a',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'agrolens_db',
      user: process.env.DB_USERNAME || 'agrolens_db_user',
      password: process.env.DB_PASSWORD || 'JHOJgIBG5k0ZxjJqV9sQv55NYraVw23A',
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    dbStatus = 'connected';
  } catch (error) {
    console.log('Health check DB error:', error.message);
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'AgroLens Backend',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
};