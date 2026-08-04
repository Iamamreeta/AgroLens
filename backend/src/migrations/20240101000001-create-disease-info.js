'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('disease_info', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      disease_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM('None', 'Low', 'Medium', 'High', 'Critical'),
        allowNull: false,
        defaultValue: 'Medium',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      symptoms: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      causes: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      treatment: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      prevention: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      is_healthy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('disease_info', ['disease_key'], { unique: true });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('disease_info');
  },
};
