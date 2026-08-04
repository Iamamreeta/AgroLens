const db = require('../models');
const { formatDateParts } = require('../utils/helpers');

class PredictionRepository {
  async create(data) {
    const { date, time } = formatDateParts();
    const payload = { ...data, prediction_date: date, prediction_time: time };
    if (!db.connected) {
      return {
        id: `mem-pred-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return db.Prediction.create(payload);
  }

  async findAllByUserId(userId, { search, status, sortBy = 'created_at', sortDir = 'DESC', limit = 50, offset = 0 }) {
    if (!db.connected) return { rows: [], count: 0 };
    const { Op } = db.Sequelize;
    const where = { user_id: userId };
    if (status) where.status = status;
    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { disease_name: { [Op.iLike]: `%${search}%` } },
            { disease_key: { [Op.iLike]: `%${search}%` } },
            { symptoms: { [Op.iLike]: `%${search}%` } },
            { status: { [Op.iLike]: `%${search}%` } },
          ],
        },
      ];
    }
    return db.Prediction.findAndCountAll({
      where,
      order: [[sortBy, sortDir && sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      limit: Math.min(Math.max(limit, 1), 200),
      offset: Math.max(offset, 0),
    });
  }

  async findByIdAndUserId(id, userId) {
    if (!db.connected) return null;
    return db.Prediction.findOne({ where: { id, user_id: userId } });
  }

  async deleteByIdAndUserId(id, userId) {
    if (!db.connected) return 0;
    const pred = await db.Prediction.findOne({ where: { id, user_id: userId } });
    if (!pred) return 0;
    await pred.destroy();
    return 1;
  }

  async deleteAllByUserId(userId) {
    if (!db.connected) return 0;
    return db.Prediction.destroy({ where: { user_id: userId } });
  }

  async getStatsByUserId(userId) {
    if (!db.connected) return { total: 0, healthy: 0, diseased: 0, recent: [] };
    const { Op } = db.Sequelize;
    const [total, healthy, diseased, recent] = await Promise.all([
      db.Prediction.count({ where: { user_id: userId } }),
      db.Prediction.count({ where: { user_id: userId, status: 'Healthy' } }),
      db.Prediction.count({ where: { user_id: userId, [Op.or]: [{ status: 'Diseased' }, { status: 'Unknown' }] } }),
      db.Prediction.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 5,
      }),
    ]);
    return { total, healthy, diseased, recent: recent.map((r) => (r.toJSON ? r.toJSON() : r)) };
  }

  async getWeeklyCounts(userId) {
    const result = Array.from({ length: 4 }).map((_, i) => ({
      week: i + 1,
      label: `Week ${4 - i}`,
      date_start: new Date(Date.now() - (3 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      total: 0,
      healthy: 0,
      diseased: 0,
    }));
    if (!db.connected) return result;
    const { Op, col, fn, literal } = db.Sequelize;
    const now = Date.now();
    const weekStart = new Date(now - 4 * 7 * 24 * 60 * 60 * 1000);
    try {
      const rows = await db.Prediction.findAll({
        attributes: [
          [fn('COUNT', col('id')), 'total'],
          [literal("SUM(CASE WHEN status = 'Healthy' THEN 1 ELSE 0 END)"), 'healthy'],
          [literal("SUM(CASE WHEN status = 'Diseased' OR status = 'Unknown' THEN 1 ELSE 0 END)"), 'diseased'],
          [fn('DATE_TRUNC', literal("'week'"), col('created_at')), 'week_bucket'],
        ],
        where: { user_id: userId, created_at: { [Op.gte]: weekStart } },
        group: [literal("DATE_TRUNC('week', created_at)")],
        order: [[literal("DATE_TRUNC('week', created_at)"), 'DESC']],
        raw: true,
      });
      for (const row of rows) {
        const bucket = new Date(row.week_bucket).toISOString().slice(0, 10);
        for (let i = 0; i < result.length; i++) {
          const wStart = new Date(result[i].date_start);
          const wEnd = new Date(wStart.getTime() + 6 * 24 * 60 * 60 * 1000);
          const b = new Date(bucket);
          if (b >= wStart && b <= wEnd) {
            result[i].total += parseInt(row.total, 10) || 0;
            result[i].healthy += parseInt(row.healthy, 10) || 0;
            result[i].diseased += parseInt(row.diseased, 10) || 0;
          }
        }
      }
    } catch (e) {
      console.warn('[predictionRepo.getWeeklyCounts] failed, using empty:', e.message);
    }
    return result;
  }

  async getMonthlyCounts(userId) {
    const now = new Date();
    const result = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      result.push({
        month: i + 1,
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        total: 0,
        healthy: 0,
        diseased: 0,
      });
    }
    if (!db.connected) return result;
    const { Op, col, fn, literal } = db.Sequelize;
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    try {
      const rows = await db.Prediction.findAll({
        attributes: [
          [fn('COUNT', col('id')), 'total'],
          [literal("SUM(CASE WHEN status = 'Healthy' THEN 1 ELSE 0 END)"), 'healthy'],
          [literal("SUM(CASE WHEN status = 'Diseased' OR status = 'Unknown' THEN 1 ELSE 0 END)"), 'diseased'],
          [fn('DATE_TRUNC', literal("'month'"), col('created_at')), 'month_bucket'],
        ],
        where: { user_id: userId, created_at: { [Op.gte]: start } },
        group: [literal("DATE_TRUNC('month', created_at)")],
        order: [[literal("DATE_TRUNC('month', created_at)"), 'ASC']],
        raw: true,
      });
      for (const row of rows) {
        const b = new Date(row.month_bucket);
        const slot = result.find((r) => r.year === b.getFullYear() && new Date(r.year, result.indexOf(r), 1).getMonth() === b.getMonth());
        for (let i = 0; i < result.length; i++) {
          const ref = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          if (ref.getFullYear() === b.getFullYear() && ref.getMonth() === b.getMonth()) {
            result[i].total += parseInt(row.total, 10) || 0;
            result[i].healthy += parseInt(row.healthy, 10) || 0;
            result[i].diseased += parseInt(row.diseased, 10) || 0;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[predictionRepo.getMonthlyCounts] failed, using empty:', e.message);
    }
    return result;
  }

  async getMostCommonDisease(userId) {
    if (!db.connected) return null;
    const { Op, col, fn } = db.Sequelize;
    try {
      const rows = await db.Prediction.findAll({
        attributes: [
          'disease_key',
          'disease_name',
          [fn('COUNT', col('id')), 'cnt'],
        ],
        where: { user_id: userId, status: { [Op.ne]: 'Healthy' } },
        group: ['disease_key', 'disease_name'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 1,
        raw: true,
      });
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        disease_key: r.disease_key,
        disease_name: r.disease_name,
        count: parseInt(r.cnt, 10) || 0,
      };
    } catch (e) {
      console.warn('[predictionRepo.getMostCommonDisease] failed:', e.message);
      return null;
    }
  }

  async getScanStreak(userId) {
    if (!db.connected) return 0;
    const { Op, col, fn, literal } = db.Sequelize;
    try {
      const rows = await db.Prediction.findAll({
        attributes: [[fn('DISTINCT', fn('DATE', col('created_at'))), 'd']],
        where: { user_id: userId },
        order: [[literal("DATE(created_at)"), 'DESC']],
        raw: true,
      });
      if (!rows || rows.length === 0) return 0;
      const dates = rows.map((r) => new Date(r.d).toISOString().slice(0, 10)).sort().reverse();
      let streak = 0;
      let expected = new Date();
      const iso = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      let pointer = 0;
      while (pointer < dates.length) {
        const ex = iso(expected);
        if (dates[pointer] === ex) {
          streak += 1;
          pointer += 1;
          expected.setDate(expected.getDate() - 1);
        } else if (pointer === 0 && dates[pointer] !== ex) {
          expected = new Date(dates[pointer]);
          continue;
        } else {
          break;
        }
      }
      return streak;
    } catch (e) {
      console.warn('[predictionRepo.getScanStreak] failed:', e.message);
      return 0;
    }
  }
}

module.exports = new PredictionRepository();
