const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DiseaseInfo extends Model {
    static associate(models) {
      DiseaseInfo.hasMany(models.Prediction, {
        foreignKey: 'disease_key',
        sourceKey: 'disease_key',
        as: 'predictions',
      });
    }
  }

  DiseaseInfo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      disease_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: 'Disease key must be unique' },
        comment: 'Must match ML model label encoder class string exactly',
      },
      display_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM('None', 'Low', 'Medium', 'High', 'Critical'),
        allowNull: false,
        defaultValue: 'Medium',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      symptoms: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      causes: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      treatment: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      prevention: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      is_healthy: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'DiseaseInfo',
      tableName: 'disease_info',
      timestamps: true,
    }
  );

  return DiseaseInfo;
};
