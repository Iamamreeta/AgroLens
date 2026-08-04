const db = require('../models');
const AppError = require('../utils/AppError');

class UserRepository {
  async create(userData) {
    if (!db.connected) {
      const newUser = {
        id: `mem-${Date.now()}`,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newUser;
    }
    return db.User.create(userData);
  }

  async findByEmail(email) {
    if (!db.connected) return null;
    return db.User.findOne({ where: { email } });
  }

  async findById(id) {
    if (!db.connected) return null;
    return db.User.findByPk(id);
  }

  async updateStats(userId, isHealthy) {
    if (!db.connected) return null;
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    user.total_scans = (user.total_scans || 0) + 1;
    if (isHealthy) {
      user.healthy_count = (user.healthy_count || 0) + 1;
    } else {
      user.disease_count = (user.disease_count || 0) + 1;
    }
    await user.save();
    return user;
  }

  async updateLastLogin(userId) {
    if (!db.connected) return null;
    return db.User.update(
      { last_login_at: new Date() },
      { where: { id: userId } }
    );
  }

  async changePassword(userId, newPasswordHash) {
    if (!db.connected) throw new AppError('Database not available', 503);
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    user.password_hash = newPasswordHash;
    await user.save();
    return user;
  }

  async delete(userId) {
    if (!db.connected) throw new AppError('Database not available', 503);
    const user = await db.User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    await user.destroy();
    return true;
  }
}

module.exports = new UserRepository();
