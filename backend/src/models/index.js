const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: dbConfig.logging || false,
    pool: dbConfig.pool || { max: 5, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: dbConfig.dialectOptions || {},
  }
);

const User = require('./User')(sequelize, DataTypes);
const Prediction = require('./Prediction')(sequelize, DataTypes);
const DiseaseInfo = require('./DiseaseInfo')(sequelize, DataTypes);

User.hasMany(Prediction, { foreignKey: 'user_id', as: 'predictions', onDelete: 'CASCADE' });
Prediction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

DiseaseInfo.hasMany(Prediction, { foreignKey: 'disease_key', sourceKey: 'disease_key', as: 'predictions' });
Prediction.belongsTo(DiseaseInfo, { foreignKey: 'disease_key', targetKey: 'disease_key', as: 'disease_info' });

const db = {
  User,
  Prediction,
  DiseaseInfo,
  sequelize,
  Sequelize,
  connected: false,
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established successfully.');
    db.connected = true;
    if (process.env.DB_SYNC === 'alter') {
      await sequelize.sync({ alter: true });
      console.log('[DB] Alter sync completed.');
    } else if (process.env.DB_SYNC === 'force') {
      await sequelize.sync({ force: true });
      console.log('[DB] Force sync completed.');
    }
  } catch (err) {
    console.error('[DB] Unable to connect or sync:', err.message);
    db.connected = false;
  }
})();

module.exports = db;
