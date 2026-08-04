'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('predictions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        allowNull: true
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      disease_key: {
        type: Sequelize.STRING(100),
        references: {
          model: 'disease_info',
          key: 'disease_key'
        },
        allowNull: true
      },
      disease_name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'Unknown'
      },
      is_leaf: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      green_ratio: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      symptoms: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true
      },
      causes: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true
      },
      treatment: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true
      },
      prevention: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true
      },
      probabilities_json: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      prediction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      prediction_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      saved: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('predictions');
  }
};