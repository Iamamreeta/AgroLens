const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Prediction extends Model {
    static associate(models) {
      Prediction.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
      Prediction.belongsTo(models.DiseaseInfo, {
        foreignKey: 'disease_key',
        targetKey: 'disease_key',
        as: 'disease_info',
      });
    }
  }

  Prediction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL or local path to uploaded leaf image',
      },
      disease_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Disease class identifier matching ML model output and DiseaseInfo.disease_key',
      },
      disease_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      confidence: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: DataTypes.ENUM('Healthy', 'Diseased', 'Unknown'),
        allowNull: false,
        defaultValue: 'Unknown',
      },
      is_leaf: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      green_ratio: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      causes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      treatment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      prevention: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      probabilities_json: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'All class probabilities from SVM',
      },
      prediction_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      prediction_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      saved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Prediction',
      tableName: 'predictions',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['disease_key'] },
        { fields: ['prediction_date'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Prediction;
};
