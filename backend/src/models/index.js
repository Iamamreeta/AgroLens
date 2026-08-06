const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env];

const db = {};

let sequelize;

const initializeDatabase = async () => {
  try {
    console.log('🔍 Connecting to database with config:', {
      database: config.database,
      username: config.username,
      host: config.host,
      port: config.port,
      ssl: !!config.dialectOptions?.ssl
    });

    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
      );
    }

    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');

    // Load all model files
    const modelFiles = fs
      .readdirSync(__dirname)
      .filter((file) => {
        return (
          file.indexOf('.') !== 0 &&
          file !== basename &&
          file.slice(-3) === '.js' &&
          file.indexOf('.test.js') === -1
        );
      });

    console.log('📦 Loading models:', modelFiles);

    for (const file of modelFiles) {
      const modelDef = require(path.join(__dirname, file));
      const model = modelDef(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      console.log(`✅ Model loaded: ${model.name}`);
    }

    // Setup associations
    Object.keys(db).forEach((modelName) => {
      if (db[modelName].associate) {
        db[modelName].associate(db);
      }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    // Sync database
    if (process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'alter') {
      const syncMode = process.env.DB_SYNC === 'alter' ? 'alter' :
                       process.env.DB_SYNC === 'force' ? 'force' : null;
      if (syncMode) {
        await sequelize.sync({ [syncMode]: true });
        console.log(`✅ Database synchronized (mode: ${syncMode})`);
      }
    }

    console.log('📦 Available models:', Object.keys(db));
    return { sequelize, connected: true };
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('💥 Full error:', error);
    throw error;
  }
};

db.initializeDatabase = initializeDatabase;

module.exports = db;