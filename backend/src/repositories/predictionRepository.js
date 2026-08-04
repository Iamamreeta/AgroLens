const db = require('../models');
const { formatDateParts } = require('../utils/helpers');

class PredictionRepository {
  async create(data) {
    const { date, time } = formatDateParts();
    const payload = { ...data, prediction_date: date, prediction_time: time };
    if (!db.connected) {
      return {
        id: `mem-pred-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return db.Prediction.create(payload);
  }

  async findAllByUserId(userId, { search, status, sortBy = 'created_at', sortDir = 'DESC', limit = 50, offset = 0 }) {
    if (!db.connected) return { rows: [], count: 0 };
    const where = { user_id: userId };
    if (status) where.status = status;
    const and = [];
    if (search) {
      const { Op } = db.Sequelize;
      and.push({
        [Op.or]: [
          { disease_name: { [Op.iLike]: `%${search}%` } },
          { disease_key: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    if (and.length) where[db.Sequelize.Op.and] = and;
    return db.Prediction.findAndCountAll({
      where,
      order: [[sortBy, sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      limit: Math.min(limit, 200),
      offset,
    });
  }

  async findByIdAndUserId(id, userId) {
    if (!db.connected) return null;
    return db.Prediction.findOne({ where: { id, user_id: userId } });
  }

  async deleteByIdAndUserId(id, userId) {
    if (!db.connected) throw new Error('Database unavailable');
    const pred = await db.Prediction.findOne({ where: { id, user_id: userId } });
    if (!pred) return 0;
    await pred.destroy();
    return 1;
  }

  async deleteAllByUserId(userId) {
    if (!db.connected) throw new Error('Database unavailable');
    return db.Prediction.destroy({ where: { user_id: userId } });
  }

  async getStatsByUserId(userId) {
    if (!db.connected) return { total: 0, healthy: 0, diseased: 0, recent: [] };
    const { Op, col, fn } = db.Sequelize;
    const total = await db.Prediction.count({ where: { user_id: userId } });
    const healthy = await db.Prediction.count({ where: { user_id: userId, status: 'Healthy' } });
    const diseased = await db.Prediction.count({ where: { user_id: userId, status: 'Diseased' } });
    const recent = await db.Prediction.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 5,
    });
    return { total, healthy, diseased, recent };
  }
}

module.exports = new PredictionRepository();
