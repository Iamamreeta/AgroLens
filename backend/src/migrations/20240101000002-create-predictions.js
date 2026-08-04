'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('predictions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        allowNull: true,
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      disease_key: {
        type: Sequelize.STRING(100),
        references: { model: 'disease_info', key: 'disease_key' },
        allowNull: false,
      },
      disease_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Healthy', 'Diseased', 'Unknown'),
        allowNull: false,
        defaultValue: 'Unknown',
      },
      is_leaf: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      green_ratio: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      symptoms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      causes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      treatment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      prevention: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      probabilities_json: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      prediction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      prediction_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      saved: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('predictions', ['user_id']);
    await queryInterface.addIndex('predictions', ['disease_key']);
    await queryInterface.addIndex('predictions', ['prediction_date']);
    await queryInterface.addIndex('predictions', ['status']);
    await queryInterface.addIndex('predictions', ['created_at']);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('predictions');
  },
};
