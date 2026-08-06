const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

// Load models manually
const User = require('./User')(sequelize, DataTypes);
const Prediction = require('./Prediction')(sequelize, DataTypes);
const DiseaseInfo = require('./DiseaseInfo')(sequelize, DataTypes);

// Setup relationships
User.hasMany(Prediction, { foreignKey: 'user_id' });
Prediction.belongsTo(User, { foreignKey: 'user_id' });

DiseaseInfo.hasMany(Prediction, { foreignKey: 'disease_key' });
Prediction.belongsTo(DiseaseInfo, { foreignKey: 'disease_key' });

// Export
module.exports = {
  User,
  Prediction,
  DiseaseInfo,
  sequelize,
  Sequelize
};